"use client";

import { useActionState, useEffect, useState } from "react";
import "@/features/inventario/md3-theme.css";
import { Md3Button } from "@/components/md3/button";
import { Md3Card } from "@/components/md3/card";
import { Md3Chip } from "@/components/md3/chip";
import { Md3TextField } from "@/components/md3/text-field";
import { Md3Select } from "@/components/md3/select";
import { crearUsuario, cambiarRolUsuario, suspenderUsuario, reactivarUsuario } from "./actions";
import { ROLES } from "./schemas";

const ROL_LABEL: Record<string, string> = {
  admin: "Administrador",
  operador: "Operador",
  vendedor: "Vendedor",
};
const ROL_OPCIONES = ROLES.map((r) => ({ value: r, label: ROL_LABEL[r] }));

type Usuario = {
  id: string;
  nombre: string;
  email: string;
  role: string;
  activo: boolean;
  creado_en: string;
};

export type UsuariosMd3Props = {
  usuarios: Usuario[];
  propioId: string;
};

export function UsuariosMd3Vista({ usuarios, propioId }: UsuariosMd3Props) {
  const [mostrarForm, setMostrarForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCambiarRol(id: string, role: string) {
    setError(null);
    const resultado = await cambiarRolUsuario(id, role as (typeof ROLES)[number]);
    if ("error" in resultado && resultado.error) setError(resultado.error);
  }
  async function handleSuspender(id: string, nombre: string) {
    if (!window.confirm(`¿Suspender a "${nombre}"? No podrá iniciar sesión hasta que lo reactives.`)) return;
    setError(null);
    const resultado = await suspenderUsuario(id);
    if ("error" in resultado && resultado.error) setError(resultado.error);
  }
  async function handleReactivar(id: string) {
    setError(null);
    const resultado = await reactivarUsuario(id);
    if ("error" in resultado && resultado.error) setError(resultado.error);
  }

  return (
    <div className="md3-scope space-y-4 rounded-2xl p-4">
      <h1 className="text-2xl font-medium">Usuarios</h1>

      {error && (
        <p
          className="rounded-xl p-3 text-sm"
          style={{
            border: "1px solid var(--md-sys-color-error-container)",
            background: "color-mix(in srgb, var(--md-sys-color-error-container) 50%, transparent)",
            color: "var(--md-sys-color-error)",
          }}
        >
          {error}
        </p>
      )}

      <Md3Card>
        <div className="flex flex-wrap items-center justify-between gap-2 p-4" style={{ borderBottom: "1px solid var(--md-sys-color-outline-variant)" }}>
          <h2 className="text-sm font-semibold">Usuarios</h2>
          <Md3Button variant={mostrarForm ? "outlined" : "filled"} minWidth={150} onClick={() => setMostrarForm((v) => !v)}>
            {mostrarForm ? "Cancelar" : "Crear usuario"}
          </Md3Button>
        </div>

        {mostrarForm && (
          <div className="p-4" style={{ borderBottom: "1px solid var(--md-sys-color-outline-variant)" }}>
            <CrearUsuarioForm onGuardado={() => setMostrarForm(false)} />
          </div>
        )}

        <div>
          {usuarios.length === 0 && <p className="p-4 text-sm">Sin usuarios registrados.</p>}
          {usuarios.map((usuario) => (
            <div
              key={usuario.id}
              data-testid="fila-usuario"
              className="p-4"
              style={{ borderBottom: "1px solid var(--md-sys-color-outline-variant)" }}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="mb-1 text-sm font-medium">
                    {usuario.nombre}{" "}
                    <Md3Chip testId="badge-estado" label={usuario.activo ? "Activo" : "Suspendido"} />
                  </p>
                  <p className="text-xs" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
                    {usuario.email}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Md3Select
                    label="Rol"
                    name="role"
                    value={usuario.role}
                    onValueChange={(v) => handleCambiarRol(usuario.id, v)}
                    opciones={ROL_OPCIONES}
                    minWidth={160}
                  />
                  {usuario.activo ? (
                    <Md3Button variant="outlined" minWidth={100} onClick={() => handleSuspender(usuario.id, usuario.nombre)}>
                      Suspender
                    </Md3Button>
                  ) : (
                    <Md3Button variant="outlined" minWidth={100} onClick={() => handleReactivar(usuario.id)}>
                      Reactivar
                    </Md3Button>
                  )}
                </div>
              </div>
              {usuario.id === propioId && (
                <p className="mt-1 text-xs" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
                  Este es tu usuario.
                </p>
              )}
            </div>
          ))}
        </div>
      </Md3Card>
    </div>
  );
}

function CrearUsuarioForm({ onGuardado }: { onGuardado: () => void }) {
  const [state, formAction, isPending] = useActionState(crearUsuario, {});

  useEffect(() => {
    if (state && "success" in state) onGuardado();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} data-testid="form-crear-usuario" className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Md3TextField label="Nombre" name="nombre" required />
        <Md3TextField label="Correo" name="email" type="email" required />
        <Md3TextField
          label="Contraseña temporal"
          name="password"
          type="password"
          required
          supportingText="Mínimo 8 caracteres. Comunícala al usuario para que la cambie en Mi cuenta."
        />
        <Md3Select label="Rol" name="role" required placeholder="Selecciona un rol" opciones={ROL_OPCIONES} />
      </div>

      {state && "error" in state && state.error && (
        <p className="text-sm" style={{ color: "var(--md-sys-color-error)" }}>
          {state.error}
        </p>
      )}

      <Md3Button type="submit" disabled={isPending} minWidth={120}>
        {isPending ? "Creando..." : "Crear"}
      </Md3Button>
    </form>
  );
}
