"use client";

import { Copy } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/Button";

export function CopyButton({
  value,
  path,
  label = "Copy",
}: {
  value?: string;
  path?: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const resolvedValue =
      path && typeof window !== "undefined"
        ? new URL(path, window.location.origin).toString()
        : value;

    if (!resolvedValue) {
      return;
    }

    await navigator.clipboard.writeText(resolvedValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Button type="button" variant="ghost" size="sm" onClick={handleCopy}>
      <Copy className="h-4 w-4" />
      {copied ? "Copied" : label}
    </Button>
  );
}
