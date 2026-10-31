import test from "node:test";
import assert from "node:assert/strict";

import { getAuthCallbackError, getConfirmationDestination, getEmailOtpType } from "../lib/auth/confirmation.ts";

const origin = "https://photizonetwork.com";

test("signup confirmation supports the server-side email token type", () => {
  assert.equal(getEmailOtpType("email"), "email");
  assert.equal(getEmailOtpType("signup"), "signup");
  assert.equal(getEmailOtpType("unexpected"), null);
  assert.equal(getEmailOtpType(null), null);
});

test("only a genuine access denial is described as a cancelled sign-in", () => {
  assert.equal(getAuthCallbackError("access_denied", null), "cancelled");
  assert.equal(getAuthCallbackError("access_denied", "otp_expired"), "verification");
  assert.equal(getAuthCallbackError("access_denied", "email_not_confirmed"), "verification");
  assert.equal(getAuthCallbackError("server_error", null), "callback");
  assert.equal(getAuthCallbackError(null, null), null);
});

test("confirmation redirects keep safe internal destinations and use general member defaults", () => {
  assert.equal(getConfirmationDestination("email", "/member?welcome=1", origin), "/member?welcome=1");
  assert.equal(getConfirmationDestination("email", "https://outside.example/steal", origin), "/member");
});

test("password recovery defaults to the protected password update page", () => {
  assert.equal(getConfirmationDestination("recovery", null, origin), "/streak/reset-password");
  assert.equal(getConfirmationDestination("recovery", "/member", origin), "/member");
});
