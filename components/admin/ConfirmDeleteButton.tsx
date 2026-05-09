"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/Button";

export function ConfirmDeleteButton({
  endpoint,
  label = "Delete",
  confirmMessage = "Are you sure you want to delete this item?",
}: {
  endpoint: string;
  label?: string;
  confirmMessage?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!window.confirm(confirmMessage)) {
      return;
    }

    setLoading(true);

    const response = await fetch(endpoint, {
      method: "DELETE",
    });

    setLoading(false);

    if (response.ok) {
      router.refresh();
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleDelete}
      disabled={loading}
      className="text-rose-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
    >
      <Trash2 className="h-4 w-4" />
      {loading ? "Deleting..." : label}
    </Button>
  );
}
