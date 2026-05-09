"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/Button";
import { FormInput } from "@/components/forms/FormInput";
import { FormTextarea } from "@/components/forms/FormTextarea";
import { programInterestSchema } from "@/lib/schemas";

type FormValues = z.input<typeof programInterestSchema>;

export function ProgramInterestForm({ compact = false }: { compact?: boolean }) {
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const form = useForm<FormValues>({
    resolver: zodResolver(programInterestSchema),
    defaultValues: {
      full_name: "",
      email: "",
      whatsapp: "",
      country: "",
      city: "",
      program_of_interest: "",
      how_did_you_hear: "",
      message: "",
    },
  });

  async function onSubmit(values: FormValues) {
    const response = await fetch("/api/public/program-interest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const payload = await response.json();

    if (!response.ok) {
      setStatus("error");
      setMessage(payload.error || "Unable to submit your registration interest.");
      return;
    }

    form.reset();
    setStatus("success");
    setMessage("Thank you for registering your interest. We have received your details.");
  }

  return (
    <form
      className={`grid gap-5 rounded-[32px] border border-[rgba(72,108,38,0.12)] bg-white p-6 shadow-soft ${compact ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3"} sm:p-8`}
      onSubmit={form.handleSubmit(onSubmit)}
    >
      <FormInput label="Full name" error={form.formState.errors.full_name?.message} {...form.register("full_name")} />
      <FormInput label="Email address" error={form.formState.errors.email?.message} {...form.register("email")} />
      <FormInput label="WhatsApp number" error={form.formState.errors.whatsapp?.message} {...form.register("whatsapp")} />
      <FormInput label="Country" error={form.formState.errors.country?.message} {...form.register("country")} />
      <FormInput label="State or city" error={form.formState.errors.city?.message} {...form.register("city")} />
      <FormInput label="Program of interest" error={form.formState.errors.program_of_interest?.message} {...form.register("program_of_interest")} />
      <FormInput label="How did you hear about us?" error={form.formState.errors.how_did_you_hear?.message} {...form.register("how_did_you_hear")} />
      <div className={compact ? "sm:col-span-2" : "sm:col-span-2 lg:col-span-3"}>
        <FormTextarea label="Message or prayer request" error={form.formState.errors.message?.message} {...form.register("message")} />
      </div>
      <div className={compact ? "sm:col-span-2" : "sm:col-span-2 lg:col-span-3"}>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Submitting..." : "Register Interest"}
        </Button>
      </div>
      {message ? (
        <p className={`${compact ? "sm:col-span-2" : "sm:col-span-2 lg:col-span-3"} text-sm ${status === "success" ? "text-emerald-700" : "text-rose-600"}`}>
          {message}
        </p>
      ) : null}
    </form>
  );
}
