"use client";

import type { ReactNode, CSSProperties, MouseEvent } from "react";
import "@material/web/iconbutton/icon-button.js";
import "@material/web/iconbutton/filled-icon-button.js";
import "@material/web/iconbutton/filled-tonal-icon-button.js";
import "@material/web/iconbutton/outlined-icon-button.js";

type Variant = "standard" | "filled" | "tonal" | "outlined";

const TAG: Record<Variant, string> = {
  standard: "md-icon-button",
  filled: "md-filled-icon-button",
  tonal: "md-filled-tonal-icon-button",
  outlined: "md-outlined-icon-button",
};

export function Md3IconButton({
  variant = "standard",
  children,
  onClick,
  ariaLabel,
  style,
}: {
  variant?: Variant;
  children: ReactNode;
  onClick?: () => void;
  ariaLabel: string;
  style?: CSSProperties;
}) {
  const Tag = TAG[variant] as unknown as "md-icon-button";

  function handleClick(e: MouseEvent<HTMLElement>) {
    e.preventDefault();
    onClick?.();
  }

  return (
    <Tag type="button" aria-label={ariaLabel} onClick={handleClick} style={style}>
      {children}
    </Tag>
  );
}
