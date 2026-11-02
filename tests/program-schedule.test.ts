import assert from "node:assert/strict";
import test from "node:test";
import { getAvailablePrograms, getProgramAvailability, getProgramStartInstant, isProgramScheduleValid } from "../lib/program-schedule.ts";
import type { ScheduledProgram } from "../lib/program-schedule.ts";

function program(id: string, overrides: Record<string, unknown> = {}): ScheduledProgram {
  return ({
    id,
    title: id,
    slug: id,
    description: "A programme description for schedule tests.",
    flyer_url: null,
    date: "2026-11-03",
    time: "9:00 AM",
    end_date: null,
    end_time: null,
    location: null,
    online_link: null,
    registration_deadline: null,
    status: "published",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  } as ScheduledProgram);
}

test("Lagos scheduling converts local start times to the correct instant", () => {
  assert.equal(getProgramStartInstant(program("morning"))?.toISOString(), "2026-11-03T08:00:00.000Z");
});

test("future events are upcoming and explicit live date/time windows are ongoing", () => {
  const now = new Date("2026-11-02T00:30:00Z"); // 1:30 AM in Lagos
  assert.equal(getProgramAvailability(program("future", { time: "2:00 AM" }), now), "upcoming");
  assert.equal(getProgramAvailability(program("live", { date: "2026-11-02", time: "1:00 AM", end_date: "2026-11-02", end_time: "3:00 AM" }), now), "ongoing");
  assert.equal(getProgramAvailability(program("ended", { date: "2026-11-02", time: "1:00 AM", end_date: "2026-11-02", end_time: "1:30 AM" }), now), null);
});

test("programs without confirmed dates, cancelled states, invalid dates and unknown past ends are excluded", () => {
  const now = new Date("2026-11-02T00:30:00Z");
  assert.equal(getProgramAvailability(program("no-date", { date: null }), now), null);
  assert.equal(getProgramAvailability(program("invalid", { date: "2026-02-30" }), now), null);
  assert.equal(getProgramAvailability(program("cancelled", { status: "cancelled" }), now), null);
  assert.equal(getProgramAvailability(program("draft", { status: "draft" }), now), null);
  assert.equal(getProgramAvailability(program("unknown-end", { date: "2026-11-01", time: "9:00 AM" }), now), null);
});

test("a date-only future start is scheduled in Lagos and a past one is not revived as ongoing", () => {
  assert.equal(getProgramAvailability(program("tomorrow", { date: "2026-11-03", time: null }), new Date("2026-11-02T22:30:00Z")), "upcoming");
  assert.equal(getProgramAvailability(program("today", { date: "2026-11-02", time: null }), new Date("2026-11-02T00:00:00Z")), null);
});

test("end dates and times must be supplied together and must follow the start", () => {
  assert.equal(isProgramScheduleValid(program("missing-time", { end_date: "2026-11-03" })), false);
  assert.equal(isProgramScheduleValid(program("wrong-order", { end_date: "2026-11-03", end_time: "8:00 AM" })), false);
  assert.equal(isProgramScheduleValid(program("valid", { end_date: "2026-11-03", end_time: "11:00 AM" })), true);
});

test("member programme list excludes ineligible entries and sorts by Lagos start time", () => {
  const items = getAvailablePrograms([
    program("later", { date: "2026-11-04", time: "9:00 AM" }),
    program("cancelled", { status: "cancelled" }),
    program("earlier", { date: "2026-11-03", time: "10:00 AM" }),
    program("ongoing", { date: "2026-11-02", time: "1:00 AM", end_date: "2026-11-02", end_time: "3:00 AM" }),
  ], new Date("2026-11-02T00:30:00Z"));
  assert.deepEqual(items.map((item) => item.id), ["ongoing", "earlier", "later"]);
  assert.deepEqual(items.map((item) => item.availability), ["ongoing", "upcoming", "upcoming"]);
});
