"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/Button";
import { FormInput } from "@/components/forms/FormInput";
import { FormSelect } from "@/components/forms/FormSelect";
import { FormTextarea } from "@/components/forms/FormTextarea";
import { salvationResponseSchema } from "@/lib/schemas";

type FormValues = z.input<typeof salvationResponseSchema>;

export function SalvationFollowUpForm() {
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const form = useForm<FormValues>({
    resolver: zodResolver(salvationResponseSchema),
    defaultValues: {
      full_name: "",
      email: "",
      whatsapp: "",
      country: "",
      city: "",
      received_christ_today: true,
      needs_follow_up: true,
      attends_church: false,
      message: "",
    },
  });

  async function onSubmit(values: FormValues) {
    const response = await fetch("/api/public/salvation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const payload = await response.json();

    if (!response.ok) {
      setStatus("error");
      setMessage(payload.error || "Unable to submit your response.");
      return;
    }

    form.reset();
    setStatus("success");
    setMessage(
      "Thank you. Your response has been received. Our team will reach out to you for follow-up, prayer, and discipleship.",
    );
  }

  return (
    <form
      className="grid gap-5 rounded-[32px] border border-[rgba(72,108,38,0.12)] bg-white p-6 shadow-soft sm:grid-cols-2 sm:p-8"
      onSubmit={form.handleSubmit(onSubmit)}
    >
      <FormInput label="Full name" placeholder="Simon Peter" error={form.formState.errors.full_name?.message} {...form.register("full_name")} />
      <FormInput label="Email address" placeholder="SimonPeter@gmail.com" error={form.formState.errors.email?.message} {...form.register("email")} />
      <FormInput label="WhatsApp number" placeholder="+234 801 234 5678" error={form.formState.errors.whatsapp?.message} {...form.register("whatsapp")} />
      <FormInput label="Country" placeholder="Israel" error={form.formState.errors.country?.message} {...form.register("country")} />
      <FormInput label="State or city" placeholder="Jerusalem" error={form.formState.errors.city?.message} {...form.register("city")} />
      <FormSelect
        label="Did you just receive Christ today?"
        error={form.formState.errors.received_christ_today?.message as string | undefined}
        {...form.register("received_christ_today", {
          setValueAs: (value) => value === "true",
        })}
      >
        <option value="true">Yes</option>
        <option value="false">No</option>
      </FormSelect>
      <FormSelect
        label="Do you need someone to follow up with you?"
        error={form.formState.errors.needs_follow_up?.message as string | undefined}
        {...form.register("needs_follow_up", {
          setValueAs: (value) => value === "true",
        })}
      >
        <option value="true">Yes</option>
        <option value="false">No</option>
      </FormSelect>
      <FormSelect
        label="Do you currently attend a church?"
        error={form.formState.errors.attends_church?.message as string | undefined}
        {...form.register("attends_church", {
          setValueAs: (value) => value === "true",
        })}
      >
        <option value="false">No</option>
        <option value="true">Yes</option>
      </FormSelect>
      <div className="sm:col-span-2">
        <FormTextarea label="Prayer request or message" placeholder="I just gave my life to Christ and I would love follow-up and prayer." error={form.formState.errors.message?.message} {...form.register("message")} />
      </div>
      <div className="sm:col-span-2">
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Submitting..." : "Send Follow-Up Request"}
        </Button>
      </div>
      {message ? (
        <p className={`sm:col-span-2 text-sm ${status === "success" ? "text-emerald-700" : "text-rose-600"}`}>
          {message}
        </p>
      ) : null}
    </form>
  );
}
