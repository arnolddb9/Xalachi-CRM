"use client";

import type { ReactNode, CSSProperties, MouseEvent } from "react";
import "@material/web/button/filled-button.js";
import "@material/web/button/outlined-button.js";
import "@material/web/button/text-button.js";
import "@material/web/button/filled-tonal-button.js";

type Variant = "filled" | "outlined" | "text" | "tonal";

const TAG: Record<Variant, string> = {
  filled: "md-filled-button",
  outlined: "md-outlined-button",
  text: "md-text-button",
  tonal: "md-filled-tonal-button",
};

// min-width evita el colapso de ancho que sufren estos componentes cuando
// son hijos directos de un contenedor flex sin una medida explícita (bug
// real encontrado durante el prototipo — ver /inventario-md3).
//
// El botón siempre se renderiza como type="button" (nunca "submit"): el
// <button> nativo interno vive en su shadow DOM, y cuando el navegador
// activa un submit ahí dentro, el "submitter" del SubmitEvent se
// re-targetea al host (el propio Custom Element) — React 19 intenta
// construir `new FormData(form, submitter)` con ese submitter, y el
// navegador lo rechaza por no ser un botón de verdad ("the specified
// element is not a submit button"). Se evita disparando el submit
// manualmente vía `form.requestSubmit()` sin submitter.
export function Md3Button({
  variant = "filled",
  children,
  onClick,
  type = "button",
  disabled,
  style,
  minWidth = 100,
}: {
  variant?: Variant;
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  style?: CSSProperties;
  minWidth?: number;
}) {
  const Tag = TAG[variant] as unknown as "md-filled-button";

  function handleClick(e: MouseEvent<HTMLElement>) {
    onClick?.();
    if (type === "submit") {
      (e.currentTarget as HTMLElement).closest("form")?.requestSubmit();
    }
  }

  return (
    <Tag type="button" disabled={disabled} onClick={handleClick} style={{ flexShrink: 0, minWidth, ...style }}>
      {children}
    </Tag>
  );
}
