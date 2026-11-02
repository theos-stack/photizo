begin;

alter table public.member_profiles
  add column if not exists whatsapp_community_joined_at timestamptz;

comment on column public.member_profiles.whatsapp_community_joined_at is
  'Member-confirmed WhatsApp community status; PHOTIZO does not verify WhatsApp group membership.';

commit;
