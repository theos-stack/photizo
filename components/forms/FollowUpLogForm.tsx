"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/Button";
import { FormInput } from "@/components/forms/FormInput";
import { FormTextarea } from "@/components/forms/FormTextarea";
import { followUpLogSchema } from "@/lib/schemas";

type FormValues = z.input<typeof followUpLogSchema>;

export function FollowUpLogForm({
  recordId,
  recordType,
}: {
  recordId: string;
  recordType: string;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const form = useForm<FormValues>({
    resolver: zodResolver(followUpLogSchema),
    defaultValues: {
      record_id: recordId,
      record_type: recordType,
      note: "",
      next_action: "",
      next_follow_up_date: "",
    },
  });

  async function onSubmit(values: FormValues) {
    const response = await fetch("/api/admin/follow-up-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const payload = await response.json();

    if (!response.ok) {
      setMessage(payload.error || "Unable to save the follow-up note.");
      return;
    }

    form.reset({
      record_id: recordId,
      record_type: recordType,
      note: "",
      next_action: "",
      next_follow_up_date: "",
    });
    setMessage("Follow-up log added.");
    router.refresh();
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-4 rounded-[28px] border border-[rgba(72,108,38,0.12)] bg-white p-6 shadow-soft"
    >
      <FormTextarea label="Follow-up note" error={form.formState.errors.note?.message} {...form.register("note")} />
      <FormInput label="Next action" error={form.formState.errors.next_action?.message} {...form.register("next_action")} />
      <FormInput
        label="Next follow-up date"
        type="date"
        error={form.formState.errors.next_follow_up_date?.message}
        {...form.register("next_follow_up_date")}
      />
      <div className="flex items-center gap-4">
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Saving..." : "Add Follow-Up Log"}
        </Button>
        {message ? <p className="text-sm text-[var(--dark-moss-green)]">{message}</p> : null}
      </div>
    </form>
  );
}
