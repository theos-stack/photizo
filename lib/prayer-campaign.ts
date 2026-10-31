export const PRAYER_CAMPAIGN_DEFAULT = {
  title: "30-Day Prayer Streak",
  startsAt: "2026-11-01T08:00:00.000Z",
  timeZone: "Africa/Lagos",
  durationDays: 30,
  rollover: "00:00",
} as const;

export function getTimeZoneDate(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = (type: string) => parts.find((part) => part.type === type)?.value || "00";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

export function getCampaignDay(now: Date, startsAt: string, timeZone: string, rollover = "00:00"): number {
  const launch = new Date(startsAt);
  if (!Number.isFinite(launch.getTime()) || now < launch) return 0;
  const localDate = getTimeZoneDate(now, timeZone);
  const localLaunchDate = getTimeZoneDate(launch, timeZone);
  const localTime = new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(now);
  const adjustedDate = localTime < rollover ? addCalendarDays(localDate, -1) : localDate;
  return calendarDifference(localLaunchDate, adjustedDate) + 1;
}

export function calendarDifference(start: string, end: string): number {
  const parse = (value: string) => {
    const [year, month, day] = value.split("-").map(Number);
    const result = Date.UTC(year, month - 1, day);
    if (!Number.isFinite(result) || new Date(result).toISOString().slice(0, 10) !== value) throw new Error("Expected a valid ISO calendar date");
    return result;
  };
  return Math.floor((parse(end) - parse(start)) / 86_400_000);
}

export function addCalendarDays(date: string, days: number): string {
  const [year, month, day] = date.split("-").map(Number);
  const value = new Date(Date.UTC(year, month - 1, day + days));
  return value.toISOString().slice(0, 10);
}

export function formatLocalDateTime(value: string | null | undefined, timeZone: string): string {
  if (!value) return "2026-11-01T09:00";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date(value));
  const get = (type: string) => parts.find((part) => part.type === type)?.value || "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

export function localDateTimeToIso(value: string, timeZone: string): string {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) throw new Error("Choose a valid campaign date and time");
  const [datePart, timePart] = value.split("T");
  calendarDifference(datePart, datePart);
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);
  if (hour > 23 || minute > 59) throw new Error("Choose a valid campaign date and time");
  const target = Date.UTC(year, month - 1, day, hour, minute);
  let guess = target;
  for (let i = 0; i < 3; i += 1) {
    const rendered = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(guess));
    const get = (type: string) => Number(rendered.find((part) => part.type === type)?.value || 0);
    const renderedAsUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"));
    guess += target - renderedAsUtc;
  }
  const result = new Date(guess);
  const verified = formatLocalDateTime(result.toISOString(), timeZone);
  if (verified !== value) throw new Error("That local time is not valid in the selected time zone");
  return result.toISOString();
}

export function countdownParts(milliseconds: number) {
  const total = Math.max(0, Math.floor(milliseconds / 1000));
  return {
    days: Math.floor(total / 86_400),
    hours: Math.floor((total % 86_400) / 3_600),
    minutes: Math.floor((total % 3_600) / 60),
    seconds: total % 60,
  };
}
