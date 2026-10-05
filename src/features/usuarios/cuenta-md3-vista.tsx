"use client";

import { useActionState } from "react";
import "@/features/inventario/md3-theme.css";
import { Md3Button } from "@/components/md3/button";
import { Md3Card } from "@/components/md3/card";
import { Md3TextField } from "@/components/md3/text-field";
import { cambiarPropiaContrasena } from "./actions";

export function CuentaMd3Vista() {
  const [state, formAction, isPending] = useActionState(cambiarPropiaContrasena, {});

  return (
    <div className="md3-scope space-y-4 rounded-2xl p-4">
      <h1 className="text-2xl font-medium">Mi cuenta</h1>

      <Md3Card style={{ padding: 16 }}>
        <h2 className="mb-3 text-sm font-semibold">Cambiar contraseña</h2>
        <form action={formAction} data-testid="form-cambiar-contrasena" className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Md3TextField
              label="Contraseña nueva"
              name="password"
              type="password"
              required
              supportingText="Mínimo 8 caracteres."
            />
            <Md3TextField label="Confirmar contraseña" name="confirmacion" type="password" required />
          </div>

          {state && "error" in state && state.error && (
            <p className="text-sm" style={{ color: "var(--md-sys-color-error)" }}>
              {state.error}
            </p>
          )}
          {state && "success" in state && (
            <p className="text-sm" style={{ color: "var(--md-sys-color-primary)" }}>
              Contraseña actualizada correctamente.
            </p>
          )}

          <Md3Button type="submit" disabled={isPending} minWidth={140}>
            {isPending ? "Guardando..." : "Guardar"}
          </Md3Button>
        </form>
      </Md3Card>
    </div>
  );
}
