"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/Button";
import { FormInput } from "@/components/forms/FormInput";
import { FormSelect } from "@/components/forms/FormSelect";
import { FormTextarea } from "@/components/forms/FormTextarea";
import { biblicalQuestionSchema } from "@/lib/schemas";
import { questionCategories } from "@/lib/types";

type FormValues = z.input<typeof biblicalQuestionSchema>;

export function AskQuestionForm() {
  const [state, setState] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const form = useForm<FormValues>({
    resolver: zodResolver(biblicalQuestionSchema),
    defaultValues: {
      full_name: "",
      email: "",
      whatsapp: "",
      country: "",
      city: "",
      category: "",
      question: "",
      wants_private_response: true,
      allow_public_answer: false,
    },
  });

  async function onSubmit(values: FormValues) {
    setState("idle");
    setMessage("");

    const response = await fetch("/api/public/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    const payload = await response.json();

    if (!response.ok) {
      setState("error");
      setMessage(payload.error || "Unable to submit your question.");
      return;
    }

    form.reset();
    setState("success");
    setMessage(
      "Thank you. Your question has been received. Our team will review it and respond appropriately.",
    );
  }

  return (
    <form
      className="grid gap-5 rounded-[32px] border border-[rgba(72,108,38,0.12)] bg-white p-6 shadow-soft sm:grid-cols-2 sm:p-8"
      onSubmit={form.handleSubmit(onSubmit)}
    >
      <FormInput
        label="Full name"
        placeholder="Simon Peter"
        error={form.formState.errors.full_name?.message}
        {...form.register("full_name")}
      />
      <FormInput
        label="Email address"
        placeholder="SimonPeter@gmail.com"
        error={form.formState.errors.email?.message}
        {...form.register("email")}
      />
      <FormInput
        label="WhatsApp number"
        placeholder="+234 801 234 5678"
        error={form.formState.errors.whatsapp?.message}
        {...form.register("whatsapp")}
      />
      <FormInput
        label="Country"
        placeholder="Israel"
        error={form.formState.errors.country?.message}
        {...form.register("country")}
      />
      <FormInput
        label="State or city"
        placeholder="Jerusalem"
        error={form.formState.errors.city?.message}
        {...form.register("city")}
      />
      <FormSelect
        label="Question category"
        error={form.formState.errors.category?.message}
        {...form.register("category")}
      >
        <option value="">Select a category</option>
        {questionCategories.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </FormSelect>
      <div className="sm:col-span-2">
        <FormTextarea
          label="Your question"
          placeholder="What does John 8:32 mean for a believer today?"
          error={form.formState.errors.question?.message}
          {...form.register("question")}
        />
      </div>
      <label className="flex items-start gap-3 rounded-2xl border border-[rgba(72,108,38,0.12)] bg-[var(--honeydew)]/35 p-4 text-sm">
        <input type="checkbox" className="mt-1" {...form.register("wants_private_response")} />
        <span>Do you want a private response?</span>
      </label>
      <label className="flex items-start gap-3 rounded-2xl border border-[rgba(72,108,38,0.12)] bg-[var(--honeydew)]/35 p-4 text-sm">
        <input type="checkbox" className="mt-1" {...form.register("allow_public_answer")} />
        <span>Can this question be answered publicly as a teaching?</span>
      </label>
      <div className="sm:col-span-2">
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Sending..." : "Submit Question"}
        </Button>
      </div>
      {message ? (
        <p
          className={`sm:col-span-2 text-sm ${state === "success" ? "text-emerald-700" : "text-rose-600"}`}
        >
          {message}
        </p>
      ) : null}
    </form>
  );
}
