import type { Program } from "@/lib/types";

export const PROGRAM_SCHEDULE_TIME_ZONE = "Africa/Lagos";

export type ScheduledProgram = Program & {
  end_date?: string | null;
  end_time?: string | null;
};

export type ProgramScheduleInput = {
  date?: string | null;
  time?: string | null;
  end_date?: string | null;
  end_time?: string | null;
};

export type ProgramAvailability = "upcoming" | "ongoing";

type LocalDateParts = { year: number; month: number; day: number };
type LocalTimeParts = { hour: number; minute: number };

function parseDate(value?: string | null): LocalDateParts | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const normalized = new Date(Date.UTC(year, month - 1, day));
  if (normalized.getUTCFullYear() !== year || normalized.getUTCMonth() !== month - 1 || normalized.getUTCDate() !== day) return null;
  return { year, month, day };
}

function parseTime(value?: string | null): LocalTimeParts | null {
  if (!value?.trim()) return { hour: 0, minute: 0 };
  const match = /^\s*(\d{1,2}):(\d{2})\s*(AM|PM)?\s*$/i.exec(value);
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const period = match[3]?.toUpperCase();
  if (minute > 59) return null;
  if (period) {
    if (hour < 1 || hour > 12) return null;
    hour = hour % 12 + (period === "PM" ? 12 : 0);
  } else if (hour > 23) return null;
  return { hour, minute };
}

function timeZoneParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  return { year: value("year"), month: value("month"), day: value("day"), hour: value("hour"), minute: value("minute"), second: value("second") };
}

/** Convert a local Lagos wall-clock date/time into an absolute instant. */
function localDateTimeToInstant(date: LocalDateParts, time: LocalTimeParts, timeZone: string): Date | null {
  const targetAsUtc = Date.UTC(date.year, date.month - 1, date.day, time.hour, time.minute);
  let guess = targetAsUtc;
  try {
    // Recompute the zone offset from the displayed local fields. Africa/Lagos has
    // no daylight-saving transitions, and this also avoids host-timezone leaks.
    for (let pass = 0; pass < 3; pass += 1) {
      const observed = timeZoneParts(new Date(guess), timeZone);
      const observedAsUtc = Date.UTC(observed.year, observed.month - 1, observed.day, observed.hour, observed.minute, observed.second);
      guess += targetAsUtc - observedAsUtc;
    }
    const instant = new Date(guess);
    const roundTrip = timeZoneParts(instant, timeZone);
    if (roundTrip.year !== date.year || roundTrip.month !== date.month || roundTrip.day !== date.day || roundTrip.hour !== time.hour || roundTrip.minute !== time.minute) return null;
    return instant;
  } catch {
    return null;
  }
}

export function getProgramStartInstant(program: ProgramScheduleInput, timeZone = PROGRAM_SCHEDULE_TIME_ZONE): Date | null {
  const date = parseDate(program.date);
  const time = parseTime(program.time);
  return date && time ? localDateTimeToInstant(date, time, timeZone) : null;
}

export function isProgramScheduleValid(program: ProgramScheduleInput, timeZone = PROGRAM_SCHEDULE_TIME_ZONE) {
  const start = getProgramStartInstant(program, timeZone);
  if (!start) return false;
  const endDateProvided = Boolean(program.end_date?.trim());
  const endTimeProvided = Boolean(program.end_time?.trim());
  if (endDateProvided !== endTimeProvided) return false;
  if (!endDateProvided) return true;
  const endDate = parseDate(program.end_date);
  const endTime = parseTime(program.end_time);
  if (!endDate || !endTime) return false;
  const end = localDateTimeToInstant(endDate, endTime, timeZone);
  return Boolean(end && end.getTime() > start.getTime());
}

export function getProgramAvailability(
  program: ScheduledProgram,
  now = new Date(),
  timeZone = PROGRAM_SCHEDULE_TIME_ZONE,
): ProgramAvailability | null {
  if (program.status !== "published" || !isProgramScheduleValid(program, timeZone)) return null;
  const start = getProgramStartInstant(program, timeZone);
  if (!start) return null;
  const nowMs = now.getTime();
  if (!Number.isFinite(nowMs)) return null;
  const endDateProvided = Boolean(program.end_date?.trim());
  const endTimeProvided = Boolean(program.end_time?.trim());
  if (nowMs < start.getTime()) return "upcoming";
  if (!endDateProvided || !endTimeProvided) return null;
  const endDate = parseDate(program.end_date);
  const endTime = parseTime(program.end_time);
  if (!endDate || !endTime) return null;
  const end = localDateTimeToInstant(endDate, endTime, timeZone);
  return end && nowMs < end.getTime() ? "ongoing" : null;
}

export function getAvailablePrograms(programs: ScheduledProgram[], now = new Date(), timeZone = PROGRAM_SCHEDULE_TIME_ZONE) {
  return programs
    .map((program) => ({ program, start: getProgramStartInstant(program, timeZone), availability: getProgramAvailability(program, now, timeZone) }))
    .filter((entry): entry is { program: ScheduledProgram; start: Date; availability: ProgramAvailability } => Boolean(entry.start && entry.availability))
    .sort((a, b) => a.start.getTime() - b.start.getTime() || a.program.title.localeCompare(b.program.title))
    .map(({ program, availability }) => ({ ...program, availability }));
}
