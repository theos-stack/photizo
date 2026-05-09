import { z } from "zod";

const optionalString = z
  .string()
  .trim()
  .max(500, "This field is too long.")
  .optional()
  .or(z.literal(""));

export const programCustomFieldSchema = z.object({
  id: z.string().trim().min(1, "Field id is required."),
  key: z
    .string()
    .trim()
    .min(2, "Each custom field needs an internal key.")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Use lowercase letters, numbers, and hyphens only for the field key.",
    ),
  label: z.string().trim().min(2, "Each custom field needs a label."),
  type: z.enum(["text", "textarea", "select", "email", "phone", "number", "date"]),
  placeholder: optionalString,
  helper_text: optionalString,
  required: z.boolean().default(false),
  options: z.array(z.string().trim().min(1)).default([]),
}).superRefine((value, context) => {
  if (value.type === "select" && value.options.length === 0) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Select fields need at least one option.",
      path: ["options"],
    });
  }
});

export const programInterestSchema = z.object({
  full_name: z.string().trim().min(2, "Full name is required."),
  email: z
    .string()
    .trim()
    .email("Enter a valid email address.")
    .or(z.literal("")),
  whatsapp: optionalString,
  country: optionalString,
  city: optionalString,
  program_of_interest: optionalString,
  how_did_you_hear: optionalString,
  message: z
    .string()
    .trim()
    .max(1000, "Please keep your message under 1000 characters.")
    .optional()
    .or(z.literal("")),
});

export const fallbackProgramRegistrationSchema = programInterestSchema.extend({
  program_id: z.string().uuid().optional(),
  custom_answers: z
    .record(z.string(), z.string().trim().max(1000))
    .default({}),
});

export const programRegistrationSchema = z.object({
  program_id: z.string().uuid().optional(),
  full_name: optionalString,
  email: z
    .string()
    .trim()
    .email("Enter a valid email address.")
    .or(z.literal("")),
  whatsapp: optionalString,
  country: optionalString,
  city: optionalString,
  program_of_interest: optionalString,
  how_did_you_hear: optionalString,
  message: z
    .string()
    .trim()
    .max(1000, "Please keep your message under 1000 characters.")
    .optional()
    .or(z.literal("")),
  custom_answers: z
    .record(z.string(), z.string().trim().max(1000))
    .default({}),
});

export const biblicalQuestionSchema = z.object({
  full_name: z.string().trim().min(2, "Full name is required."),
  email: z
    .string()
    .trim()
    .email("Enter a valid email address.")
    .or(z.literal("")),
  whatsapp: optionalString,
  country: optionalString,
  city: optionalString,
  category: z.string().trim().min(2, "Please choose a category."),
  question: z
    .string()
    .trim()
    .min(20, "Please share your question in a little more detail.")
    .max(2000, "Please keep your question under 2000 characters."),
  wants_private_response: z.boolean().default(true),
  allow_public_answer: z.boolean().default(false),
});

export const contactMessageSchema = z.object({
  full_name: z.string().trim().min(2, "Full name is required."),
  email: z
    .string()
    .trim()
    .email("Enter a valid email address.")
    .or(z.literal("")),
  whatsapp: optionalString,
  subject: z.string().trim().min(2, "Subject is required."),
  message: z
    .string()
    .trim()
    .min(10, "Please enter your message.")
    .max(2000, "Please keep your message under 2000 characters."),
});

export const salvationResponseSchema = z.object({
  full_name: z.string().trim().min(2, "Full name is required."),
  email: z
    .string()
    .trim()
    .email("Enter a valid email address.")
    .or(z.literal("")),
  whatsapp: optionalString,
  country: optionalString,
  city: optionalString,
  received_christ_today: z.boolean(),
  needs_follow_up: z.boolean(),
  attends_church: z.boolean(),
  message: z
    .string()
    .trim()
    .max(1000, "Please keep your message under 1000 characters.")
    .optional()
    .or(z.literal("")),
});

export const adminLoginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(6, "Enter your password."),
});

export const programSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(3, "Title is required."),
  slug: z.string().trim().min(3, "Slug is required."),
  description: z
    .string()
    .trim()
    .min(20, "Please provide a fuller description."),
  flyer_url: optionalString,
  date: z.string().trim().optional().or(z.literal("")),
  time: optionalString,
  location: optionalString,
  online_link: z
    .string()
    .trim()
    .url("Enter a valid meeting link.")
    .optional()
    .or(z.literal("")),
  registration_deadline: z.string().trim().optional().or(z.literal("")),
  registration_form: z.array(programCustomFieldSchema).default([]),
  status: z.enum(["draft", "published", "closed", "completed"]),
}).superRefine((value, context) => {
  const seenKeys = new Set<string>();

  value.registration_form.forEach((field, index) => {
    if (seenKeys.has(field.key)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Each custom field key must be unique.",
        path: ["registration_form", index, "key"],
      });
      return;
    }

    seenKeys.add(field.key);
  });
});

export const followUpLogSchema = z.object({
  record_type: z.string().trim().min(2),
  record_id: z.string().uuid(),
  note: z.string().trim().min(5, "Add a note for the follow-up log."),
  next_action: optionalString,
  next_follow_up_date: z.string().trim().optional().or(z.literal("")),
});

export const siteSettingsSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Enter a valid email address.")
    .or(z.literal("")),
  whatsapp: optionalString,
  instagram: optionalString,
  facebook: optionalString,
  youtube: optionalString,
  telegram: optionalString,
});

export const updateRecordSchema = z.object({
  status: z.string().trim().min(2),
  assigned_to: optionalString,
  next_follow_up_date: z.string().trim().optional().or(z.literal("")),
  internal_notes: optionalString,
  response_notes: optionalString,
});
