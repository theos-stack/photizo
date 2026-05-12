import { useId, useMemo } from "react";

import { buildTwelveHourTime, cn, parseTwelveHourTime } from "@/lib/utils";

type TimePickerFieldProps = {
  label: string;
  value?: string | null;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  className?: string;
  helperText?: string;
};

export function TimePickerField({
  label,
  value,
  onChange,
  error,
  disabled,
  className,
  helperText,
}: TimePickerFieldProps) {
  const listId = useId();
  const suggestions = useMemo(() => {
    const values: string[] = [];

    for (let hour = 0; hour < 24; hour += 1) {
      for (let minute = 0; minute < 60; minute += 15) {
        const period = hour >= 12 ? "PM" : "AM";
        const normalizedHour = hour % 12 || 12;
        values.push(`${normalizedHour}:${String(minute).padStart(2, "0")} ${period}`);
      }
    }

    return values;
  }, []);

  function normalizeInput(rawValue: string) {
    const parsed = parseTwelveHourTime(rawValue);
    return buildTwelveHourTime(parsed.hour, parsed.minute, parsed.period);
  }

  function handleBlur(rawValue: string) {
    if (!rawValue.trim()) {
      onChange("");
      return;
    }

    const normalized = normalizeInput(rawValue);
    if (normalized) {
      onChange(normalized);
    }
  }

  return (
    <label className={cn("block space-y-2", className)}>
      <span className="text-sm font-medium text-[var(--black)]">{label}</span>
      <input
        list={listId}
        value={value || ""}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        onBlur={(event) => handleBlur(event.target.value)}
        placeholder="5:00 PM"
        className="min-h-12 w-full rounded-2xl border border-[rgba(72,108,38,0.14)] bg-white px-4 py-3 text-sm text-[var(--black)] outline-none ring-0 placeholder:text-[rgba(11,11,11,0.35)] focus:border-[var(--gold)] focus:shadow-[0_0_0_4px_rgba(255,214,0,0.14)]"
      />
      <datalist id={listId}>
        {suggestions.map((time) => (
          <option key={time} value={time} />
        ))}
      </datalist>
      {helperText ? (
        <p className="text-xs leading-6 text-[rgba(11,11,11,0.55)]">{helperText}</p>
      ) : null}
      {error ? <span className="text-sm text-rose-600">{error}</span> : null}
    </label>
  );
}
