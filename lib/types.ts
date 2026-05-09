export type ProgramStatus = "draft" | "published" | "closed" | "completed";
export type RegistrationStatus =
  | "new"
  | "confirmed"
  | "attended"
  | "did_not_attend"
  | "followed_up";
export type SalvationStatus =
  | "new"
  | "contacted"
  | "prayed_with"
  | "in_follow_up"
  | "joined_discipleship"
  | "planted_in_church"
  | "needs_attention"
  | "completed";
export type QuestionStatus =
  | "new"
  | "in_review"
  | "answered"
  | "needs_pastoral_attention"
  | "converted_to_teaching"
  | "archived";
export type ContactStatus = "new" | "responded" | "closed";
export type ProgramCustomFieldType =
  | "text"
  | "textarea"
  | "select"
  | "email"
  | "phone"
  | "number"
  | "date";

export type ProgramCustomField = {
  id: string;
  key: string;
  label: string;
  type: ProgramCustomFieldType;
  placeholder?: string | null;
  helper_text?: string | null;
  required?: boolean;
  options?: string[];
};

export type SiteSettings = {
  id?: string;
  email?: string | null;
  whatsapp?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  youtube?: string | null;
  telegram?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type Program = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  flyer_url: string | null;
  date: string | null;
  time: string | null;
  location: string | null;
  online_link: string | null;
  registration_deadline: string | null;
  registration_form?: ProgramCustomField[];
  status: ProgramStatus;
  created_at: string;
  updated_at: string;
};

export type ProgramRegistration = {
  id: string;
  program_id: string | null;
  full_name: string;
  email: string | null;
  whatsapp: string | null;
  country: string | null;
  city: string | null;
  program_of_interest?: string | null;
  how_did_you_hear: string | null;
  message: string | null;
  custom_answers?: Record<string, string>;
  status: RegistrationStatus;
  created_at: string;
  programs?: Pick<Program, "id" | "title" | "slug" | "registration_form"> | null;
};

export type SalvationResponse = {
  id: string;
  full_name: string;
  email: string | null;
  whatsapp: string | null;
  country: string | null;
  city: string | null;
  received_christ_today: boolean | null;
  needs_follow_up: boolean | null;
  attends_church: boolean | null;
  message: string | null;
  status: SalvationStatus;
  assigned_to: string | null;
  next_follow_up_date: string | null;
  created_at: string;
};

export type BiblicalQuestion = {
  id: string;
  full_name: string;
  email: string | null;
  whatsapp: string | null;
  country: string | null;
  city: string | null;
  category: string | null;
  question: string;
  wants_private_response: boolean;
  allow_public_answer: boolean;
  status: QuestionStatus;
  assigned_to: string | null;
  internal_notes: string | null;
  response_notes?: string | null;
  created_at: string;
};

export type ContactMessage = {
  id: string;
  full_name: string;
  email: string | null;
  whatsapp: string | null;
  subject: string | null;
  message: string;
  status: ContactStatus;
  created_at: string;
};

export type FollowUpLog = {
  id: string;
  record_type: string;
  record_id: string;
  note: string;
  next_action: string | null;
  next_follow_up_date: string | null;
  created_by: string | null;
  created_at: string;
};

export const questionCategories = [
  "Salvation",
  "Prayer",
  "Doctrine",
  "Bible interpretation",
  "Christian living",
  "Spiritual growth",
  "Healing and miracles",
  "Discipleship",
  "Other",
] as const;

export const programStatusOptions: ProgramStatus[] = [
  "draft",
  "published",
  "closed",
  "completed",
];

export const registrationStatusOptions: RegistrationStatus[] = [
  "new",
  "confirmed",
  "attended",
  "did_not_attend",
  "followed_up",
];

export const salvationStatusOptions: SalvationStatus[] = [
  "new",
  "contacted",
  "prayed_with",
  "in_follow_up",
  "joined_discipleship",
  "planted_in_church",
  "needs_attention",
  "completed",
];

export const questionStatusOptions: QuestionStatus[] = [
  "new",
  "in_review",
  "answered",
  "needs_pastoral_attention",
  "converted_to_teaching",
  "archived",
];

export const contactStatusOptions: ContactStatus[] = [
  "new",
  "responded",
  "closed",
];
