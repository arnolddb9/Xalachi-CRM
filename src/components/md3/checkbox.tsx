"use client";

import type { FormEvent } from "react";
import "@material/web/checkbox/checkbox.js";

type Md3El = HTMLElement & { checked: boolean };

export function Md3Checkbox({
  checked,
  onCheckedChange,
  label,
  id,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  id?: string;
}) {
  return (
    <label htmlFor={id} className="flex items-center gap-2 text-sm" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
      <md-checkbox
        id={id}
        checked={checked}
        onChange={(e: FormEvent<HTMLElement>) => onCheckedChange((e.currentTarget as Md3El).checked)}
      />
      {label}
    </label>
  );
}
