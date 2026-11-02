export const INVITATION_ACTIVE_KEY = "photizo:invitation:active";
export const INVITATION_ACTIVE_EVENT = "photizo:invitation-active";
export const INSTALL_DISMISSED_SESSION_KEY = "photizo:install:dismissed-session";
export const INSTALL_SHOWN_SESSION_KEY = "photizo:install:shown-session";

export type InvitationKind = "install" | "community" | "reminders" | null;

export function getActiveInvitation(storage: Pick<Storage, "getItem">): InvitationKind {
  const value = storage.getItem(INVITATION_ACTIVE_KEY);
  return value === "install" || value === "community" || value === "reminders" ? value : null;
}

export function communityDismissedKey(memberId: string) {
  return `photizo:community:${memberId}:dismissed-this-session`;
}

export function communityJoinedKey(memberId: string) {
  return `photizo:community:${memberId}:joined`;
}

export function communityConfirmOpenKey(memberId: string) {
  return `photizo:community:${memberId}:confirm-opened`;
}
