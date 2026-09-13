"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
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
    <div className="rounded-lg border border-zinc-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 p-4">
        <h2 className="text-sm font-semibold text-zinc-900">{titulo}</h2>
        {puedeEscribir && (
          <button
            onClick={() => {
              setEditandoId(null);
              setMostrarForm((v) => !v);
            }}
            className={
              mostrarForm
                ? "min-h-9 rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 transition-colors hover:bg-zinc-100"
                : "bg-primary hover:bg-primary-dark min-h-9 rounded-md px-3 py-1.5 text-sm font-medium text-white transition-colors"
            }
          >
            {mostrarForm ? "Cancelar" : "Nuevo"}
          </button>
        )}
      </div>

      {errorEliminar && (
        <p className="border-b border-red-100 bg-red-50 p-3 text-sm text-red-600">
          {errorEliminar}
        </p>
      )}

      {mostrarForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
        >
          <CatalogoForm tabla={tabla} campos={campos} onGuardado={() => setMostrarForm(false)} />
        </motion.div>
      )}

      <div className="divide-y divide-zinc-100">
        {filasIniciales.length === 0 && (
          <p className="p-4 text-sm text-zinc-500">Sin registros todavía.</p>
        )}
        {filasIniciales.map((fila, i) => (
          <motion.div
            key={fila.id}
            data-testid="fila-catalogo"
            className="p-4"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, delay: Math.min(i, 8) * 0.02 }}
          >
            {editandoId === fila.id ? (
              <CatalogoForm
                tabla={tabla}
                campos={campos}
                fila={fila}
                onGuardado={() => setEditandoId(null)}
              />
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-zinc-900">
                    {fila.nombre}{" "}
                    {fila.activo ? (
                      <span className="bg-accent-soft text-accent ml-1 rounded px-1.5 py-0.5 text-xs font-medium">
                        activo
                      </span>
                    ) : (
                      <span className="ml-1 rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-500">
                        inactivo
                      </span>
                    )}
                  </p>
                  {campos
                    .filter((c) => c.name !== "nombre" && fila[c.name])
                    .map((c) => (
                      <p key={c.name} className="text-xs text-zinc-500">
                        {String(fila[c.name])}
                      </p>
                    ))}
                </div>
                <div className="flex gap-2">
                  {verDetallePrefijo && (
                    <Link
                      href={`${verDetallePrefijo}/${fila.id}`}
                      className="border-primary/30 text-primary hover:bg-primary-soft flex min-h-9 items-center rounded-md border px-3 py-1.5 text-sm font-medium transition-colors"
                    >
                      Ver pasos
                    </Link>
                  )}
                  {puedeEscribir && (
                    <>
                    <button
                      onClick={() => {
                        setMostrarForm(false);
                        setEditandoId(fila.id);
                      }}
                      className="border-primary/30 text-primary hover:bg-primary-soft min-h-9 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors"
                    >
                      Editar
                    </button>
                    <button
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
                      className="min-h-9 rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 transition-colors hover:bg-zinc-100 disabled:opacity-50"
                    >
                      {fila.activo ? "Desactivar" : "Reactivar"}
                    </button>
                    {esAdmin && (
                      <button
                        disabled={isPending}
                        onClick={() => handleEliminar(fila.id, fila.nombre)}
                        className="min-h-9 rounded-md border border-red-200 px-3 py-1.5 text-sm text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                      >
                        Eliminar
                      </button>
                    )}
                    </>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>
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
  const action = fila
    ? actualizarCatalogoGestionable.bind(null, tabla, fila.id)
    : crearCatalogoGestionable.bind(null, tabla);
  const [state, formAction, isPending] = useActionState(action, {});

  useEffect(() => {
    if (state && "success" in state) onGuardado();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} className="space-y-3 border-b border-zinc-100 bg-zinc-50 p-4">
      {campos.map((campo) => (
        <div key={campo.name}>
          <label htmlFor={campo.name} className="mb-1 block text-sm text-zinc-600">
            {campo.label}
          </label>
          {campo.type === "textarea" ? (
            <textarea
              id={campo.name}
              name={campo.name}
              defaultValue={fila ? String(fila[campo.name] ?? "") : ""}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
              rows={2}
            />
          ) : campo.type === "select" ? (
            <select
              id={campo.name}
              name={campo.name}
              defaultValue={fila ? String(fila[campo.name] ?? "") : ""}
              required={campo.requerido}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
            >
              <option value="" disabled>
                Selecciona una opción
              </option>
              {campo.opciones.map((op) => (
                <option key={op.value} value={op.value}>
                  {op.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              id={campo.name}
              type={campo.type === "number" ? "number" : "text"}
              name={campo.name}
              defaultValue={fila ? String(fila[campo.name] ?? "") : ""}
              required={campo.requerido}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
            />
          )}
        </div>
      ))}

      {state && "error" in state && state.error && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="bg-primary hover:bg-primary-dark min-h-10 rounded-md px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50"
      >
        {isPending ? "Guardando..." : "Guardar"}
      </button>
    </form>
  );
}
