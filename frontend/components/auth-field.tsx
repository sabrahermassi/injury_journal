"use client";

import { useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import { cn } from "@/lib/utils";

const FIELD_CLASS =
  "h-14 w-full rounded-2xl bg-popover px-4.5 text-[14.5px] text-foreground ring-1 ring-input outline-none transition-shadow placeholder:text-muted-foreground-subtle focus-visible:ring-2 focus-visible:ring-ring";

export function AuthField({
  label,
  type = "text",
  value,
  onChange,
  autoComplete,
  required,
  hint,
}: {
  label: string;
  type?: "text" | "email";
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  required?: boolean;
  hint?: string;
}) {
  const id = useId();

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-xs font-medium text-muted-foreground"
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
        autoComplete={autoComplete}
        required={required}
        className={FIELD_CLASS}
      />
      {hint && (
        <p className="mt-2 text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

/**
 * The design's password row, with its "Show" affordance. That toggle is the
 * one control on this screen that needs nothing behind it, so unlike the
 * frame's "Keep me signed in", "Forgot password?" and social buttons, it is
 * here and it works.
 */
export function AuthPasswordField({
  label = "Password",
  value,
  onChange,
  autoComplete,
  hint,
}: {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  hint?: string;
}) {
  const id = useId();
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-xs font-medium text-muted-foreground"
      >
        {label}
      </label>

      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.currentTarget.value)}
          autoComplete={autoComplete}
          required
          className={cn(FIELD_CLASS, "pr-24")}
        />

        <button
          type="button"
          onClick={() => setVisible((shown) => !shown)}
          className="absolute inset-y-0 right-0 flex items-center gap-1.5 rounded-r-2xl px-4.5 text-[12.5px] font-medium text-accent-foreground transition-colors hover:text-foreground"
        >
          {visible ? (
            <EyeOff className="size-3.5" aria-hidden="true" />
          ) : (
            <Eye className="size-3.5" aria-hidden="true" />
          )}
          {visible ? "Hide" : "Show"}
        </button>
      </div>

      {hint && <p className="mt-2 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
