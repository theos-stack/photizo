import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import type { Program } from "@/lib/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(
  value?: string | Date | null,
  options?: Intl.DateTimeFormatOptions,
) {
  if (!value) {
    return "To be announced";
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "To be announced";
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
    ...options,
  }).format(date);
}

export function formatDateTime(date?: string | null, time?: string | null) {
  if (!date && !time) {
    return "Date and time will be announced";
  }

  const formattedDate = formatDate(date);
  return time ? `${formattedDate} at ${time}` : formattedDate;
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function parseTwelveHourTime(value?: string | null) {
  if (!value) {
    return { hour: "", minute: "", period: "" as "" | "AM" | "PM" };
  }

  const match = value.match(
    /^\s*(\d{1,2})(?::(\d{2}))?\s*([AaPp][Mm])(?:\s*[A-Za-z]*)?\s*$/,
  );

  if (!match) {
    return { hour: "", minute: "", period: "" as "" | "AM" | "PM" };
  }

  const hour = String(Number(match[1]));
  const minute = (match[2] || "00").padStart(2, "0");
  const period = match[3].toUpperCase() as "AM" | "PM";

  if (!Number.isInteger(Number(hour)) || Number(hour) < 1 || Number(hour) > 12) {
    return { hour: "", minute: "", period: "" as "" | "AM" | "PM" };
  }

  return { hour, minute, period };
}

export function buildTwelveHourTime(
  hour?: string | null,
  minute?: string | null,
  period?: string | null,
) {
  if (!hour || !minute || !period) {
    return "";
  }

  return `${Number(hour)}:${minute.padStart(2, "0")} ${period.toUpperCase()}`;
}

export function getAbsoluteUrl(path = "/") {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "http://localhost:3000";
  return `${base}${path}`;
}

export function isPastDate(value?: string | null) {
  if (!value) {
    return false;
  }

  const deadline = new Date(`${value}T23:59:59`);
  return !Number.isNaN(deadline.getTime()) && deadline.getTime() < Date.now();
}

export function isProgramRegistrationOpen(
  program: Pick<Program, "status" | "registration_deadline">,
) {
  if (program.status !== "published") {
    return false;
  }

  return !isPastDate(program.registration_deadline);
}

export function formatStatusLabel(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function sanitizePhoneNumber(phone?: string | null) {
  if (!phone) {
    return "";
  }

  return phone.replace(/[^\d]/g, "");
}

export function buildWhatsAppLink(
  phone?: string | null,
  message?: string,
) {
  const sanitized = sanitizePhoneNumber(phone);

  if (!sanitized) {
    return null;
  }

  const base = `https://wa.me/${sanitized}`;
  if (!message) {
    return base;
  }

  return `${base}?text=${encodeURIComponent(message)}`;
}
