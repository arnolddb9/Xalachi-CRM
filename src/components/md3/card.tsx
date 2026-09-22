"use client";

import type { ReactNode, CSSProperties } from "react";
import "@material/web/labs/card/outlined-card.js";
import "@material/web/labs/card/elevated-card.js";

export function Md3Card({
  variant = "outlined",
  children,
  style,
  testId,
}: {
  variant?: "outlined" | "elevated";
  children: ReactNode;
  style?: CSSProperties;
  testId?: string;
}) {
  const Tag = (variant === "elevated" ? "md-elevated-card" : "md-outlined-card") as unknown as "md-outlined-card";
  return (
    <Tag data-testid={testId} style={{ display: "block", ...style }}>
      {children}
    </Tag>
  );
}
