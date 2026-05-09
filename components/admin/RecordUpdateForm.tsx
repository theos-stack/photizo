"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/Button";

type RecordUpdateFormProps = {
  endpoint: string;
  status: string;
  statusOptions: string[];
  assignedTo?: string | null;
  nextFollowUpDate?: string | null;
  internalNotes?: string | null;
  responseNotes?: string | null;
};

export function RecordUpdateForm({
  endpoint,
  status,
  statusOptions,
  assignedTo,
  nextFollowUpDate,
  internalNotes,
  responseNotes,
}: RecordUpdateFormProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");

  async function onSubmit(formData: FormData) {
    const payload = {
      status: String(formData.get("status") || status),
      assigned_to: String(formData.get("assigned_to") || ""),
      next_follow_up_date: String(formData.get("next_follow_up_date") || ""),
      internal_notes: String(formData.get("internal_notes") || ""),
      response_notes: String(formData.get("response_notes") || ""),
    };

    const response = await fetch(endpoint, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = await response.json();

    if (!response.ok) {
      setMessage(body.error || "Unable to update this record.");
      return;
    }

    setMessage("Record updated.");
    router.refresh();
  }

  return (
    <form
      action={onSubmit}
      className="space-y-4 rounded-[28px] border border-[rgba(72,108,38,0.12)] bg-white p-6 shadow-soft"
    >
      <label className="block space-y-2">
        <span className="text-sm font-medium">Status</span>
        <select
          name="status"
          defaultValue={status}
          className="min-h-12 w-full rounded-2xl border border-[rgba(72,108,38,0.14)] bg-white px-4 py-3 text-sm"
        >
          {statusOptions.map((option) => (
            <option key={option} value={option}>
              {option.replaceAll("_", " ")}
            </option>
          ))}
        </select>
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-medium">Assigned follow-up person</span>
        <input
          name="assigned_to"
          defaultValue={assignedTo || ""}
          className="min-h-12 w-full rounded-2xl border border-[rgba(72,108,38,0.14)] bg-white px-4 py-3 text-sm"
        />
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-medium">Next follow-up date</span>
        <input
          type="date"
          name="next_follow_up_date"
          defaultValue={nextFollowUpDate || ""}
          className="min-h-12 w-full rounded-2xl border border-[rgba(72,108,38,0.14)] bg-white px-4 py-3 text-sm"
        />
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-medium">Internal notes</span>
        <textarea
          name="internal_notes"
          defaultValue={internalNotes || ""}
          className="min-h-28 w-full rounded-2xl border border-[rgba(72,108,38,0.14)] bg-white px-4 py-3 text-sm"
        />
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-medium">Response notes</span>
        <textarea
          name="response_notes"
          defaultValue={responseNotes || ""}
          className="min-h-28 w-full rounded-2xl border border-[rgba(72,108,38,0.14)] bg-white px-4 py-3 text-sm"
        />
      </label>
      <div className="flex items-center gap-4">
        <Button type="submit">Save Update</Button>
        {message ? <p className="text-sm text-[var(--dark-moss-green)]">{message}</p> : null}
      </div>
    </form>
  );
}
