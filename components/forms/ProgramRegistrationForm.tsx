"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/Button";
import { FormInput } from "@/components/forms/FormInput";
import { FormSelect } from "@/components/forms/FormSelect";
import { FormTextarea } from "@/components/forms/FormTextarea";
import { programRegistrationSchema } from "@/lib/schemas";
import type { ProgramCustomField } from "@/lib/types";

type FormValues = z.input<typeof programRegistrationSchema>;

export function ProgramRegistrationForm({
  programId,
  slug,
  registrationForm = [],
  previewMode = false,
}: {
  programId: string;
  slug: string;
  registrationForm?: ProgramCustomField[];
  previewMode?: boolean;
}) {
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const hasCustomForm = registrationForm.length > 0;
  const defaultValues: FormValues = useMemo(
    () => ({
      program_id: programId,
      full_name: "",
      email: "",
      whatsapp: "",
      country: "",
      city: "",
      program_of_interest: "",
      how_did_you_hear: "",
      message: "",
      custom_answers: registrationForm.reduce<Record<string, string>>(
        (accumulator, field) => {
          accumulator[field.key] = "";
          return accumulator;
        },
        {},
      ),
    }),
    [programId, registrationForm],
  );

  const form = useForm<FormValues>({
    defaultValues,
  });

  function getInputType(fieldType: ProgramCustomField["type"]) {
    switch (fieldType) {
      case "email":
        return "email";
      case "phone":
        return "tel";
      case "number":
        return "number";
      case "date":
        return "date";
      default:
        return "text";
    }
  }

  function isValidForType(field: ProgramCustomField, answer: string) {
    if (!answer) {
      return !field.required;
    }

    switch (field.type) {
      case "email":
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(answer);
      case "phone":
        return /^[+\d][\d\s\-()]{6,}$/.test(answer);
      case "number":
        return !Number.isNaN(Number(answer));
      case "date":
        return !Number.isNaN(new Date(answer).getTime());
      default:
        return true;
    }
  }

  async function onSubmit(values: FormValues) {
    setMessage("");
    setStatus("idle");

    if (previewMode) {
      setStatus("success");
      setMessage(
        "Preview mode is active. Publish the program to start receiving real registrations.",
      );
      return;
    }

    if (!hasCustomForm) {
      const fullName = values.full_name?.trim() || "";
      const email = values.email?.trim() || "";

      if (fullName.length < 2) {
        form.setError("full_name", {
          type: "required",
          message: "Full name is required.",
        });
        setStatus("error");
        setMessage("Please complete the required registration fields.");
        return;
      }

      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        form.setError("email", {
          type: "validate",
          message: "Enter a valid email address.",
        });
        setStatus("error");
        setMessage("Please correct the highlighted registration fields.");
        return;
      }
    }

    for (const field of registrationForm) {
      const rawAnswer = values.custom_answers?.[field.key];
      const answer = typeof rawAnswer === "string" ? rawAnswer.trim() : "";

      if (field.required && !answer) {
        form.setError(`custom_answers.${field.key}` as never, {
          type: "required",
          message: `${field.label} is required.`,
        });
        setStatus("error");
        setMessage("Please complete the required registration fields.");
        return;
      }

      if (!isValidForType(field, answer)) {
        form.setError(`custom_answers.${field.key}` as never, {
          type: "validate",
          message: `Enter a valid ${field.label.toLowerCase()}.`,
        });
        setStatus("error");
        setMessage("Please correct the highlighted registration fields.");
        return;
      }
    }

    const response = await fetch(`/api/public/programs/${slug}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const payload = await response.json();

    if (!response.ok) {
      setStatus("error");
      setMessage(payload.error || "Unable to complete your registration.");
      return;
    }

    form.reset(defaultValues);
    setStatus("success");
    setMessage("Thank you for registering. Your details have been received.");
  }

  return (
    <form
      className="grid gap-5 rounded-[32px] border border-[rgba(72,108,38,0.12)] bg-white p-6 shadow-soft sm:grid-cols-2 sm:p-8"
      onSubmit={form.handleSubmit(onSubmit)}
    >
      {previewMode ? (
        <div className="sm:col-span-2 rounded-[24px] border border-[rgba(72,108,38,0.12)] bg-[var(--honeydew)]/55 px-5 py-4 text-sm leading-7 text-[rgba(11,11,11,0.72)]">
          This is an admin preview of the registration experience. Submissions are
          disabled here until the program is published and opened for live registration.
        </div>
      ) : null}
      {!hasCustomForm ? (
        <>
          <FormInput
            label="Full name"
            error={form.formState.errors.full_name?.message}
            disabled={previewMode}
            {...form.register("full_name")}
          />
          <FormInput
            label="Email address"
            error={form.formState.errors.email?.message}
            disabled={previewMode}
            {...form.register("email")}
          />
          <FormInput
            label="WhatsApp number"
            error={form.formState.errors.whatsapp?.message}
            disabled={previewMode}
            {...form.register("whatsapp")}
          />
          <FormInput
            label="Country"
            error={form.formState.errors.country?.message}
            disabled={previewMode}
            {...form.register("country")}
          />
          <FormInput
            label="State or city"
            error={form.formState.errors.city?.message}
            disabled={previewMode}
            {...form.register("city")}
          />
          <FormInput
            label="How did you hear about us?"
            error={form.formState.errors.how_did_you_hear?.message}
            disabled={previewMode}
            {...form.register("how_did_you_hear")}
          />
        </>
      ) : (
        <div className="sm:col-span-2 rounded-[24px] border border-[rgba(72,108,38,0.12)] bg-[var(--honeydew)]/45 px-5 py-4 text-sm leading-7 text-[rgba(11,11,11,0.72)]">
          This meeting is using a custom registration form created specifically for
          this program.
        </div>
      )}

      {registrationForm.map((field) => {
        const error =
          form.formState.errors.custom_answers?.[field.key]?.message?.toString();
        const helperText = field.helper_text || "";
        const label = field.required ? `${field.label} *` : field.label;

        if (field.type === "textarea") {
          return (
            <div key={field.id} className="sm:col-span-2">
              <FormTextarea
                label={label}
                placeholder={field.placeholder || undefined}
                error={error}
                disabled={previewMode}
                {...form.register(`custom_answers.${field.key}` as const)}
              />
              {helperText ? (
                <p className="mt-2 text-xs leading-6 text-[rgba(11,11,11,0.55)]">
                  {helperText}
                </p>
              ) : null}
            </div>
          );
        }

        if (field.type === "select") {
          return (
            <div key={field.id}>
              <FormSelect
                label={label}
                error={error}
                disabled={previewMode}
                {...form.register(`custom_answers.${field.key}` as const)}
              >
                <option value="">Select an option</option>
                {(field.options || []).map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </FormSelect>
              {helperText ? (
                <p className="mt-2 text-xs leading-6 text-[rgba(11,11,11,0.55)]">
                  {helperText}
                </p>
              ) : null}
            </div>
          );
        }

        return (
          <div key={field.id}>
            <FormInput
              label={label}
              type={getInputType(field.type)}
              placeholder={field.placeholder || undefined}
              error={error}
              disabled={previewMode}
              {...form.register(`custom_answers.${field.key}` as const)}
            />
            {helperText ? (
              <p className="mt-2 text-xs leading-6 text-[rgba(11,11,11,0.55)]">
                {helperText}
              </p>
            ) : null}
          </div>
        );
      })}

      {!hasCustomForm ? (
        <div className="sm:col-span-2">
          <FormTextarea
            label="Message or prayer request"
            error={form.formState.errors.message?.message}
            disabled={previewMode}
            {...form.register("message")}
          />
        </div>
      ) : null}
      <div className="sm:col-span-2">
        <Button
          type="submit"
          disabled={previewMode || form.formState.isSubmitting}
        >
          {previewMode
            ? "Preview Only"
            : form.formState.isSubmitting
              ? "Submitting..."
              : "Register"}
        </Button>
      </div>
      {message ? (
        <p
          className={`sm:col-span-2 text-sm ${
            status === "success" ? "text-emerald-700" : "text-rose-600"
          }`}
        >
          {message}
        </p>
      ) : null}
    </form>
  );
}
