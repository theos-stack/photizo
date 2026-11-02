import test from "node:test";
import assert from "node:assert/strict";
import { PHOTIZO_WHATSAPP_INVITE } from "../lib/community-invitations.ts";
import { communityDismissedKey, communityJoinedKey } from "../lib/invitation-coordinator.ts";

test("WhatsApp invitation uses the official PHOTIZO community link", () => {
  assert.equal(PHOTIZO_WHATSAPP_INVITE, "https://chat.whatsapp.com/Lirea9qwAVHFMEmAne7mpB");
});

test("community dismissal is scoped to the current browser session and member", () => {
  assert.notEqual(communityDismissedKey("member-a"), communityDismissedKey("member-b"));
  assert.match(communityDismissedKey("member-a"), /community:member-a:dismissed-this-session/);
});

test("confirmed membership uses a persistent member-specific key", () => {
  assert.notEqual(communityJoinedKey("member-a"), communityJoinedKey("member-b"));
  assert.match(communityJoinedKey("member-a"), /community:member-a:joined/);
});
