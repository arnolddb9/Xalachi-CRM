"use client";

import type { ReactNode } from "react";
import "@material/web/chips/chip-set.js";
import "@material/web/chips/assist-chip.js";

export function Md3ChipSet({ children }: { children: ReactNode }) {
  return <md-chip-set>{children}</md-chip-set>;
}

export function Md3Chip({ label, testId }: { label: string; testId?: string }) {
  return <md-assist-chip label={label} data-testid={testId}></md-assist-chip>;
}
