"use client";

import { Copy } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/Button";

export function CopyButton({
  value,
  label = "Copy",
}: {
  value: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(value);
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
