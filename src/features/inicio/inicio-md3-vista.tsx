"use client";

import "@/features/inventario/md3-theme.css";
import { Md3Card } from "@/components/md3/card";
import LogoutButton from "@/features/auth/components/logout-button";

export type InicioMd3Props = {
  email: string;
  rol: string;
};

export function InicioMd3Vista({ email, rol }: InicioMd3Props) {
  return (
    <div className="md3-scope rounded-2xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-medium">Sistema de gestión — Xalachi</h1>
        <LogoutButton />
      </div>

      <Md3Card variant="outlined" style={{ padding: 16 }}>
        <p className="text-sm" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
          Sesión activa
        </p>
        <p className="mt-1 text-sm break-words">
          <span style={{ color: "var(--md-sys-color-on-surface-variant)" }}>Correo:</span> {email}
        </p>
        <p className="text-sm">
          <span style={{ color: "var(--md-sys-color-on-surface-variant)" }}>Rol asignado:</span>{" "}
          <span
            className="rounded px-1.5 py-0.5 font-mono text-xs font-medium"
            style={{
              background: "var(--md-sys-color-primary-container)",
              color: "var(--md-sys-color-on-primary-container)",
            }}
          >
            {rol}
          </span>
        </p>
      </Md3Card>

      <p className="mt-4 text-xs" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
        Si ves &quot;sin rol asignado&quot; aquí, revisa que el Auth Hook esté activo en Dashboard →
        Authentication → Hooks, y que exista tu fila en la tabla <code>usuarios</code>.
      </p>
    </div>
  );
}
