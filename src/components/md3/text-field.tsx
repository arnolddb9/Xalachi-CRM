"use client";

import { useId, useRef, useState, type CSSProperties, type FormEvent } from "react";
import "@material/web/textfield/outlined-text-field.js";

type Md3El = HTMLElement & { value: string };

// Los componentes de @material/web no son "form-associated": su valor NO
// llega al FormData de un <form action={formAction}>. Este wrapper puentea
// eso con un <input type="hidden"> nativo sincronizado por evento "input",
// para que el resto del sistema (Server Actions, useActionState, Zod) siga
// funcionando exactamente igual sin cambios.
export function Md3TextField({
  label,
  name,
  id,
  type = "text",
  required,
  min,
  max,
  step,
  placeholder,
  defaultValue,
  value,
  onValueChange,
  style,
  minWidth = 160,
  supportingText,
}: {
  label: string;
  name?: string;
  id?: string;
  type?: "text" | "number" | "date" | "email" | "tel";
  required?: boolean;
  min?: string | number;
  max?: string | number;
  step?: string | number;
  placeholder?: string;
  defaultValue?: string | number;
  value?: string;
  onValueChange?: (value: string) => void;
  style?: CSSProperties;
  minWidth?: number;
  supportingText?: string;
}) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(String(value ?? defaultValue ?? ""));
  const hiddenRef = useRef<HTMLInputElement>(null);

  function sincronizar(el: Md3El) {
    const v = el.value ?? "";
    setInternalValue(v);
    if (hiddenRef.current) hiddenRef.current.value = v;
    onValueChange?.(v);
  }

  return (
    <span style={{ display: "inline-flex", flexDirection: "column", minWidth, flexShrink: 0, ...style }}>
      <md-outlined-text-field
        id={inputId}
        label={label}
        type={type}
        required={required}
        min={min}
        max={max}
        step={step}
        placeholder={placeholder}
        value={isControlled ? value : defaultValue !== undefined ? String(defaultValue) : ""}
        supporting-text={supportingText}
        onInput={(e: FormEvent<HTMLElement>) => sincronizar(e.currentTarget as Md3El)}
        onChange={(e: FormEvent<HTMLElement>) => sincronizar(e.currentTarget as Md3El)}
      />
      {name && <input ref={hiddenRef} type="hidden" name={name} defaultValue={internalValue} />}
    </span>
  );
}

export function Md3Textarea({
  label,
  name,
  id,
  required,
  placeholder,
  defaultValue,
  rows = 3,
  style,
}: {
  label: string;
  name?: string;
  id?: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
  rows?: number;
  style?: CSSProperties;
}) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const [internalValue, setInternalValue] = useState(defaultValue ?? "");
  const hiddenRef = useRef<HTMLInputElement>(null);

  function sincronizar(el: Md3El) {
    const v = el.value ?? "";
    setInternalValue(v);
    if (hiddenRef.current) hiddenRef.current.value = v;
  }

  return (
    <span style={{ display: "block", width: "100%", ...style }}>
      <md-outlined-text-field
        id={inputId}
        label={label}
        type="textarea"
        rows={rows}
        required={required}
        placeholder={placeholder}
        value={defaultValue ?? ""}
        style={{ width: "100%" }}
        onInput={(e: FormEvent<HTMLElement>) => sincronizar(e.currentTarget as Md3El)}
        onChange={(e: FormEvent<HTMLElement>) => sincronizar(e.currentTarget as Md3El)}
      />
      {name && <input ref={hiddenRef} type="hidden" name={name} defaultValue={internalValue} />}
    </span>
  );
}
