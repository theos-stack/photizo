import * as React from "react";

import { cn } from "@/lib/utils";

type FormInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, className, ...props }, ref) => (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-[var(--black)]">{label}</span>
      <input
        ref={ref}
        className={cn(
          "min-h-12 w-full rounded-2xl border border-[rgba(72,108,38,0.14)] bg-white px-4 py-3 text-sm text-[var(--black)] outline-none ring-0 placeholder:text-[rgba(11,11,11,0.35)] focus:border-[var(--gold)] focus:shadow-[0_0_0_4px_rgba(255,214,0,0.14)]",
          className,
        )}
        {...props}
      />
      {error ? <span className="text-sm text-rose-600">{error}</span> : null}
    </label>
  ),
);

FormInput.displayName = "FormInput";
