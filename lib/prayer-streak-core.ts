export function calendarDayNumber(startDate: string, currentDate: string) {
  const isDateOnly = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value)
    && Number.isFinite(Date.parse(`${value}T12:00:00Z`))
    && new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) === value;
  if (!isDateOnly(startDate) || !isDateOnly(currentDate)) throw new Error("Expected valid ISO calendar dates.");
  const start = Date.parse(`${startDate}T12:00:00Z`);
  const current = Date.parse(`${currentDate}T12:00:00Z`);
  return Math.floor((current - start) / 86_400_000) + 1;
}

export function streakMetrics(checkinDates: string[], localToday: string) {
  const completed = [...new Set(checkinDates)].sort();
  const set = new Set(completed);
  let current = 0;
  for (let offset = 0; offset < completed.length + 2; offset++) {
    const date = new Date(`${localToday}T12:00:00Z`);
    date.setUTCDate(date.getUTCDate() - offset);
    const key = date.toISOString().slice(0, 10);
    if (set.has(key)) current++;
    else if (offset > 0) break;
  }
  let longest = 0;
  let run = 0;
  let previous: string | undefined;
  for (const day of completed) {
    const expected = previous ? new Date(`${previous}T12:00:00Z`) : null;
    if (expected) expected.setUTCDate(expected.getUTCDate() + 1);
    run = expected?.toISOString().slice(0, 10) === day ? run + 1 : 1;
    longest = Math.max(longest, run);
    previous = day;
  }
  return { totalCompleted: completed.length, currentStreak: current, longestStreak: longest };
}

export function journeyMetrics(startDate: string, checkinDates: string[], localToday: string, durationDays = 30) {
  if (!Number.isInteger(durationDays) || durationDays < 1) throw new Error("Journey duration must be a positive whole number.");
  const elapsedDay = calendarDayNumber(startDate, localToday);
  const checkins = [...new Set(checkinDates)];
  const streak = streakMetrics(checkins, localToday);
  const completedFinalDay = checkins.includes(addCalendarDays(startDate, durationDays - 1));
  const elapsedWithinJourney = Math.min(durationDays, Math.max(0, elapsedDay));
  const todayIsEligibleForMissed = elapsedDay > durationDays || checkins.includes(localToday);
  const elapsedCompletedDays = Math.max(0, elapsedWithinJourney - (todayIsEligibleForMissed ? 0 : 1));
  return {
    currentDay: Math.min(durationDays, Math.max(1, elapsedDay)),
    elapsedDay,
    totalCompleted: streak.totalCompleted,
    currentStreak: streak.currentStreak,
    longestStreak: streak.longestStreak,
    missedDays: Math.min(durationDays, Math.max(0, elapsedCompletedDays - streak.totalCompleted)),
    completed: elapsedDay > durationDays || completedFinalDay,
  };
}

function addCalendarDays(dateOnly: string, days: number) {
  const date = new Date(`${dateOnly}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
