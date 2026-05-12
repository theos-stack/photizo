"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/Button";
import { FormInput } from "@/components/forms/FormInput";
import { FormTextarea } from "@/components/forms/FormTextarea";
import { contactMessageSchema } from "@/lib/schemas";

type FormValues = z.input<typeof contactMessageSchema>;

export function ContactForm() {
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const form = useForm<FormValues>({
    resolver: zodResolver(contactMessageSchema),
    defaultValues: {
      full_name: "",
      email: "",
      whatsapp: "",
      subject: "",
      message: "",
    },
  });

  async function onSubmit(values: FormValues) {
    const response = await fetch("/api/public/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const payload = await response.json();

    if (!response.ok) {
      setStatus("error");
      setMessage(payload.error || "Unable to send your message.");
      return;
    }

    form.reset();
    setStatus("success");
    setMessage("Thank you. Your message has been received.");
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
        label="Subject"
        placeholder="Prayer and spiritual counsel"
        error={form.formState.errors.subject?.message}
        {...form.register("subject")}
      />
      <div className="sm:col-span-2">
        <FormTextarea
          label="Message"
          placeholder="Hello PHOTIZO, I would love someone to reach out and pray with me."
          error={form.formState.errors.message?.message}
          {...form.register("message")}
        />
      </div>
      <div className="sm:col-span-2">
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Sending..." : "Send Message"}
        </Button>
      </div>
      {message ? (
        <p
          className={`sm:col-span-2 text-sm ${status === "success" ? "text-emerald-700" : "text-rose-600"}`}
        >
          {message}
        </p>
      ) : null}
    </form>
  );
}
