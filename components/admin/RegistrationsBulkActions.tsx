"use client";

import { Copy, Download, Mail, MessageSquareShare } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/Button";
import type { ProgramRegistration } from "@/lib/types";

type Props = {
  registrations: ProgramRegistration[];
  selectedProgramName?: string | null;
};

function escapeCsv(value?: string | null) {
  const normalized = (value || "").replace(/"/g, '""');
  return `"${normalized}"`;
}

export function RegistrationsBulkActions({
  registrations,
  selectedProgramName,
}: Props) {
  const [copiedField, setCopiedField] = useState<"emails" | "whatsapp" | null>(null);

  const emails = useMemo(
    () =>
      Array.from(
        new Set(
          registrations
            .map((item) => item.email?.trim())
            .filter((value): value is string => Boolean(value)),
        ),
      ),
    [registrations],
  );

  const whatsappNumbers = useMemo(
    () =>
      Array.from(
        new Set(
          registrations
            .map((item) => item.whatsapp?.trim())
            .filter((value): value is string => Boolean(value)),
        ),
      ),
    [registrations],
  );

  const csvContent = useMemo(() => {
    const headers = [
      "Full Name",
      "Email",
      "WhatsApp",
      "Country",
      "City",
      "Program",
      "Status",
      "Date Registered",
      "How Did You Hear",
      "Message",
    ];

    const rows = registrations.map((item) =>
      [
        item.full_name,
        item.email,
        item.whatsapp,
        item.country,
        item.city,
        item.programs?.title || "Interest registration",
        item.status,
        item.created_at,
        item.how_did_you_hear,
        item.message,
      ]
        .map(escapeCsv)
        .join(","),
    );

    return [headers.map(escapeCsv).join(","), ...rows].join("\n");
  }, [registrations]);

  const mailtoHref = useMemo(() => {
    if (!emails.length) {
      return null;
    }

    const subject = selectedProgramName
      ? `PHOTIZO update for ${selectedProgramName}`
      : "PHOTIZO program registration update";
    const body = selectedProgramName
      ? `Hello and God bless you.\n\nThis is a follow-up update from PHOTIZO Network International regarding ${selectedProgramName}. We will share more details with you shortly.`
      : "Hello and God bless you.\n\nThis is a follow-up update from PHOTIZO Network International. We will share more details with you shortly.";

    return `mailto:?bcc=${encodeURIComponent(emails.join(","))}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }, [emails, selectedProgramName]);

  async function copyValue(field: "emails" | "whatsapp", value: string) {
    if (!value) {
      return;
    }

    await navigator.clipboard.writeText(value);
    setCopiedField(field);
    window.setTimeout(() => setCopiedField(null), 1600);
  }

  function downloadCsv() {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const filenameBase = selectedProgramName
      ? selectedProgramName.toLowerCase().replace(/[^a-z0-9]+/g, "-")
      : "all-program-registrations";

    link.href = url;
    link.download = `${filenameBase}-registrations.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="rounded-[28px] border border-[rgba(72,108,38,0.12)] bg-white p-5 shadow-soft">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[rgba(72,108,38,0.72)]">
            Outreach Toolkit
          </p>
          <h2 className="mt-2 font-display text-3xl font-bold text-[var(--black)]">
            Reach registrants together
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[rgba(11,11,11,0.66)]">
            Copy emails, prepare a BCC email blast, download a CSV export, or pull
            WhatsApp contacts for follow-up and reminders.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-[rgba(72,108,38,0.1)] bg-[var(--honeydew)]/50 px-4 py-3">
            <div className="text-xs uppercase tracking-[0.24em] text-[rgba(72,108,38,0.68)]">
              Registrations
            </div>
            <div className="mt-2 text-2xl font-semibold text-[var(--black)]">
              {registrations.length}
            </div>
          </div>
          <div className="rounded-2xl border border-[rgba(72,108,38,0.1)] bg-[var(--honeydew)]/50 px-4 py-3">
            <div className="text-xs uppercase tracking-[0.24em] text-[rgba(72,108,38,0.68)]">
              Email Contacts
            </div>
            <div className="mt-2 text-2xl font-semibold text-[var(--black)]">
              {emails.length}
            </div>
          </div>
          <div className="rounded-2xl border border-[rgba(72,108,38,0.1)] bg-[var(--honeydew)]/50 px-4 py-3">
            <div className="text-xs uppercase tracking-[0.24em] text-[rgba(72,108,38,0.68)]">
              WhatsApp Contacts
            </div>
            <div className="mt-2 text-2xl font-semibold text-[var(--black)]">
              {whatsappNumbers.length}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-3 lg:grid-cols-4">
        <Button
          type="button"
          variant="ghost"
          onClick={() => copyValue("emails", emails.join(", "))}
          disabled={!emails.length}
          className="w-full"
        >
          <Copy className="h-4 w-4" />
          {copiedField === "emails" ? "Emails copied" : "Copy all emails"}
        </Button>
        {mailtoHref ? (
          <Button href={mailtoHref} variant="secondary" className="w-full">
            <Mail className="h-4 w-4" />
            Email everyone
          </Button>
        ) : (
          <Button type="button" variant="secondary" disabled className="w-full">
            <Mail className="h-4 w-4" />
            Email everyone
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          onClick={() => copyValue("whatsapp", whatsappNumbers.join(", "))}
          disabled={!whatsappNumbers.length}
          className="w-full"
        >
          <MessageSquareShare className="h-4 w-4" />
          {copiedField === "whatsapp" ? "Numbers copied" : "Copy WhatsApp list"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={downloadCsv}
          disabled={!registrations.length}
          className="w-full"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>
    </div>
  );
}
