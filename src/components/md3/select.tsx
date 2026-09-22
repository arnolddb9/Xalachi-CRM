"use client";

import { useId, useRef, useState, type CSSProperties, type FormEvent } from "react";
import "@material/web/select/outlined-select.js";
import "@material/web/select/select-option.js";

type Md3El = HTMLElement & { value: string };
export type OpcionSelect = { value: string; label: string };

// Mismo puente de formulario que Md3TextField — ver ese archivo para el
// porqué (@material/web no es form-associated).
export function Md3Select({
  label,
  name,
  id,
  required,
  placeholder,
  opciones,
  defaultValue = "",
  value,
  onValueChange,
  style,
  minWidth = 160,
}: {
  label: string;
  name?: string;
  id?: string;
  required?: boolean;
  placeholder?: string;
  opciones: OpcionSelect[];
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  style?: CSSProperties;
  minWidth?: number;
}) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const isControlled = value !== undefined;
  const actual = isControlled ? value : defaultValue;
  const [internalValue, setInternalValue] = useState(actual);
  const hiddenRef = useRef<HTMLInputElement>(null);

  function sincronizar(el: Md3El) {
    const v = el.value ?? "";
    setInternalValue(v);
    if (hiddenRef.current) hiddenRef.current.value = v;
    onValueChange?.(v);
  }

  return (
    <span
      data-testid={name ? `select-${name}` : undefined}
      style={{ display: "inline-flex", flexDirection: "column", minWidth, flexShrink: 0, ...style }}
    >
      <md-outlined-select
        id={inputId}
        label={label}
        required={required}
        value={actual}
        onInput={(e: FormEvent<HTMLElement>) => sincronizar(e.currentTarget as Md3El)}
        onChange={(e: FormEvent<HTMLElement>) => sincronizar(e.currentTarget as Md3El)}
      >
        {placeholder && <md-select-option value="" headline={placeholder}></md-select-option>}
        {opciones.map((o) => (
          <md-select-option key={o.value} value={o.value} headline={o.label}></md-select-option>
        ))}
      </md-outlined-select>
      {name && <input ref={hiddenRef} type="hidden" name={name} defaultValue={internalValue} />}
    </span>
  );
}
