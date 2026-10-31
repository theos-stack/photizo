import test from "node:test";
import assert from "node:assert/strict";
import { countdownParts, getCampaignDay, localDateTimeToIso } from "../lib/prayer-campaign.ts";

const launch = "2026-11-01T08:00:00.000Z";

test("campaign day zero stays locked until the exact configured start instant", () => {
  assert.equal(getCampaignDay(new Date("2026-11-01T07:59:59.999Z"), launch, "Africa/Lagos"), 0);
  assert.equal(getCampaignDay(new Date(launch), launch, "Africa/Lagos"), 1);
});

test("calendar day two unlocks at midnight in the campaign time zone", () => {
  assert.equal(getCampaignDay(new Date("2026-11-01T22:59:59.999Z"), launch, "Africa/Lagos"), 1);
  assert.equal(getCampaignDay(new Date("2026-11-01T23:00:00.000Z"), launch, "Africa/Lagos"), 2);
});

test("configured rollover moves the local calendar boundary without using browser time", () => {
  assert.equal(getCampaignDay(new Date("2026-11-02T02:29:59.999Z"), launch, "Africa/Lagos", "04:30"), 1);
  assert.equal(getCampaignDay(new Date("2026-11-02T03:30:00.000Z"), launch, "Africa/Lagos", "04:30"), 2);
});

test("admin local campaign date and time converts to the correct UTC instant", () => {
  assert.equal(localDateTimeToIso("2026-11-01T09:00", "Africa/Lagos"), launch);
  assert.throws(() => localDateTimeToIso("2026-02-30T09:00", "Africa/Lagos"), /valid ISO calendar date/);
  assert.throws(() => localDateTimeToIso("2026-03-08T02:30", "America/New_York"), /not valid/);
});

test("countdown parts use a stable days-hours-minutes-seconds breakdown", () => {
  assert.deepEqual(countdownParts(2 * 86_400_000 + 3_723_000), { days: 2, hours: 1, minutes: 2, seconds: 3 });
  assert.deepEqual(countdownParts(-1), { days: 0, hours: 0, minutes: 0, seconds: 0 });
});
