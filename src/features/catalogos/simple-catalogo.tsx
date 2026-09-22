"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import "@/features/inventario/md3-theme.css";
import { Md3Button } from "@/components/md3/button";
import { Md3Card } from "@/components/md3/card";
import { Md3Chip } from "@/components/md3/chip";
import { Md3TextField, Md3Textarea } from "@/components/md3/text-field";
import { Md3Select } from "@/components/md3/select";
import {
  actualizarCatalogoGestionable,
  crearCatalogoGestionable,
  desactivarCatalogoGestionable,
  eliminarCatalogoGestionable,
  reactivarCatalogoGestionable,
} from "./actions";
import type { CatalogoGestionable } from "./schemas";

type Campo =
  | { name: string; label: string; type: "text" | "textarea"; requerido?: boolean }
  | { name: string; label: string; type: "number"; requerido?: boolean }
  | {
      name: string;
      label: string;
      type: "select";
      opciones: { value: string; label: string }[];
      requerido?: boolean;
    };

type Fila = {
  id: string;
  nombre: string;
  activo: boolean;
  [key: string]: unknown;
};

export function SimpleCatalogo({
  tabla,
  titulo,
  campos,
  filasIniciales,
  puedeEscribir,
  esAdmin,
  verDetallePrefijo,
}: {
  tabla: CatalogoGestionable;
  titulo: string;
  campos: Campo[];
  filasIniciales: Fila[];
  puedeEscribir: boolean;
  esAdmin: boolean;
  // Prefijo de ruta (string, no función: no se puede pasar una función de un
  // Server Component a este Client Component a través de la frontera RSC).
  verDetallePrefijo?: string;
}) {
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [errorEliminar, setErrorEliminar] = useState<string | null>(null);

  function handleEliminar(id: string, nombre: string) {
    if (!window.confirm(`¿Eliminar "${nombre}" definitivamente? Esta acción no se puede deshacer.`)) {
      return;
    }
    setErrorEliminar(null);
    startTransition(async () => {
      const resultado = await eliminarCatalogoGestionable(tabla, id);
      if ("error" in resultado && resultado.error) setErrorEliminar(resultado.error);
    });
  }

  return (
    <div className="md3-scope rounded-2xl">
      <Md3Card>
        <div className="flex flex-wrap items-center justify-between gap-2 p-4" style={{ borderBottom: "1px solid var(--md-sys-color-outline-variant)" }}>
          <h2 className="text-sm font-semibold">{titulo}</h2>
          {puedeEscribir && (
            <Md3Button
              variant={mostrarForm ? "outlined" : "filled"}
              minWidth={90}
              onClick={() => {
                setEditandoId(null);
                setMostrarForm((v) => !v);
              }}
            >
              {mostrarForm ? "Cancelar" : "Nuevo"}
            </Md3Button>
          )}
        </div>

        {errorEliminar && (
          <p
            className="p-3 text-sm"
            style={{ borderBottom: "1px solid var(--md-sys-color-error-container)", color: "var(--md-sys-color-error)" }}
          >
            {errorEliminar}
          </p>
        )}

        {mostrarForm && (
          <div className="p-4" style={{ borderBottom: "1px solid var(--md-sys-color-outline-variant)" }}>
            <CatalogoForm tabla={tabla} campos={campos} onGuardado={() => setMostrarForm(false)} />
          </div>
        )}

        <div>
          {filasIniciales.length === 0 && <p className="p-4 text-sm">Sin registros todavía.</p>}
          {filasIniciales.map((fila) => (
            <div key={fila.id} data-testid="fila-catalogo" className="p-4" style={{ borderBottom: "1px solid var(--md-sys-color-outline-variant)" }}>
              {editandoId === fila.id ? (
                <CatalogoForm tabla={tabla} campos={campos} fila={fila} onGuardado={() => setEditandoId(null)} />
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="mb-1 text-sm font-medium">
                      {fila.nombre} <Md3Chip label={fila.activo ? "Activo" : "Inactivo"} />
                    </p>
                    {campos
                      .filter((c) => c.name !== "nombre" && fila[c.name])
                      .map((c) => (
                        <p key={c.name} className="text-xs" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
                          {String(fila[c.name])}
                        </p>
                      ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {verDetallePrefijo && (
                      <Link href={`${verDetallePrefijo}/${fila.id}`}>
                        <Md3Button variant="outlined" minWidth={90}>
                          Ver pasos
                        </Md3Button>
                      </Link>
                    )}
                    {puedeEscribir && (
                      <>
                        <Md3Button
                          variant="outlined"
                          minWidth={80}
                          onClick={() => {
                            setMostrarForm(false);
                            setEditandoId(fila.id);
                          }}
                        >
                          Editar
                        </Md3Button>
                        <Md3Button
                          variant="outlined"
                          minWidth={100}
                          disabled={isPending}
                          onClick={() =>
                            startTransition(async () => {
                              if (fila.activo) {
                                await desactivarCatalogoGestionable(tabla, fila.id);
                              } else {
                                await reactivarCatalogoGestionable(tabla, fila.id);
                              }
                            })
                          }
                        >
                          {fila.activo ? "Desactivar" : "Reactivar"}
                        </Md3Button>
                        {esAdmin && (
                          <Md3Button variant="outlined" minWidth={90} disabled={isPending} onClick={() => handleEliminar(fila.id, fila.nombre)}>
                            Eliminar
                          </Md3Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </Md3Card>
    </div>
  );
}

function CatalogoForm({
  tabla,
  campos,
  fila,
  onGuardado,
}: {
  tabla: CatalogoGestionable;
  campos: Campo[];
  fila?: Fila;
  onGuardado: () => void;
}) {
  const action = fila ? actualizarCatalogoGestionable.bind(null, tabla, fila.id) : crearCatalogoGestionable.bind(null, tabla);
  const [state, formAction, isPending] = useActionState(action, {});

  useEffect(() => {
    if (state && "success" in state) onGuardado();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {campos.map((campo) =>
          campo.type === "textarea" ? (
            <Md3Textarea key={campo.name} label={campo.label} name={campo.name} defaultValue={fila ? String(fila[campo.name] ?? "") : ""} />
          ) : campo.type === "select" ? (
            <Md3Select
              key={campo.name}
              label={campo.label}
              name={campo.name}
              required={campo.requerido}
              defaultValue={fila ? String(fila[campo.name] ?? "") : ""}
              placeholder="Selecciona una opción"
              opciones={campo.opciones}
            />
          ) : (
            <Md3TextField
              key={campo.name}
              label={campo.label}
              name={campo.name}
              type={campo.type === "number" ? "number" : "text"}
              required={campo.requerido}
              defaultValue={fila ? String(fila[campo.name] ?? "") : ""}
            />
          ),
        )}
      </div>

      {state && "error" in state && state.error && (
        <p className="text-sm" style={{ color: "var(--md-sys-color-error)" }}>
          {state.error}
        </p>
      )}

      <Md3Button type="submit" disabled={isPending} minWidth={120}>
        {isPending ? "Guardando..." : "Guardar"}
      </Md3Button>
    </form>
  );
}
