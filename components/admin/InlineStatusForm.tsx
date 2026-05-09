"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/Button";

export function InlineStatusForm({
  endpoint,
  currentStatus,
  options,
}: {
  endpoint: string;
  currentStatus: string;
  options: string[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    const response = await fetch(endpoint, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: String(formData.get("status") || currentStatus),
      }),
    });

    setLoading(false);

    if (response.ok) {
      router.refresh();
    }
  }

  return (
    <form action={onSubmit} className="flex items-center gap-2">
      <select
        name="status"
        defaultValue={currentStatus}
        className="min-h-10 rounded-full border border-[rgba(72,108,38,0.14)] px-3 text-xs"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option.replaceAll("_", " ")}
          </option>
        ))}
      </select>
      <Button type="submit" size="sm" variant="ghost" disabled={loading}>
        {loading ? "Saving..." : "Save"}
      </Button>
    </form>
  );
}
