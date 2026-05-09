"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/Button";
import { FormInput } from "@/components/forms/FormInput";
import { siteSettingsSchema } from "@/lib/schemas";
import type { SiteSettings } from "@/lib/types";

type FormValues = z.input<typeof siteSettingsSchema>;

export function SettingsForm({ settings }: { settings: SiteSettings }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const form = useForm<FormValues>({
    resolver: zodResolver(siteSettingsSchema),
    defaultValues: {
      email: settings.email ?? "",
      whatsapp: settings.whatsapp ?? "",
      instagram: settings.instagram ?? "",
      facebook: settings.facebook ?? "",
      youtube: settings.youtube ?? "",
      telegram: settings.telegram ?? "",
    },
  });

  async function onSubmit(values: FormValues) {
    const response = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const payload = await response.json();

    if (!response.ok) {
      setMessage(payload.error || "Unable to update settings.");
      return;
    }

    setMessage("Settings updated.");
    router.refresh();
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="grid gap-5 rounded-[32px] border border-[rgba(72,108,38,0.12)] bg-white p-6 shadow-soft md:grid-cols-2"
    >
      <FormInput label="Website email" error={form.formState.errors.email?.message} {...form.register("email")} />
      <FormInput label="WhatsApp number" error={form.formState.errors.whatsapp?.message} {...form.register("whatsapp")} />
      <FormInput label="Instagram link" error={form.formState.errors.instagram?.message} {...form.register("instagram")} />
      <FormInput label="Facebook link" error={form.formState.errors.facebook?.message} {...form.register("facebook")} />
      <FormInput label="YouTube link" error={form.formState.errors.youtube?.message} {...form.register("youtube")} />
      <FormInput label="Telegram link" error={form.formState.errors.telegram?.message} {...form.register("telegram")} />
      <div className="md:col-span-2 flex items-center gap-4">
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Saving..." : "Save Settings"}
        </Button>
        {message ? <p className="text-sm text-[var(--dark-moss-green)]">{message}</p> : null}
      </div>
    </form>
  );
}
