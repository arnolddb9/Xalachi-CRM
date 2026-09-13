"use client";

import { useActionState, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  crearPasoBeneficiado,
  actualizarPasoBeneficiado,
  eliminarPasoBeneficiado,
} from "./actions";

type Paso = { id: string; orden: number; nombre: string };

export function PasosBeneficiado({
  procesoBeneficiadoId,
  pasos,
  puedeEscribir,
}: {
  procesoBeneficiadoId: string;
  pasos: Paso[];
  puedeEscribir: boolean;
}) {
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);

  return (
    <div className="rounded-lg border border-zinc-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 p-4">
        <h2 className="text-sm font-semibold text-zinc-900">Pasos del flujo</h2>
        {puedeEscribir && (
          <button
            onClick={() => {
              setEditandoId(null);
              setMostrarForm((v) => !v);
            }}
            className={
              mostrarForm
                ? "min-h-9 rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-100"
                : "bg-primary hover:bg-primary-dark min-h-9 rounded-md px-3 py-1.5 text-sm font-medium text-white transition-colors"
            }
          >
            {mostrarForm ? "Cancelar" : "Agregar paso"}
          </button>
        )}
      </div>

      {mostrarForm && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
          <PasoForm procesoBeneficiadoId={procesoBeneficiadoId} onGuardado={() => setMostrarForm(false)} />
        </motion.div>
      )}

      <div className="divide-y divide-zinc-100">
        {pasos.length === 0 && (
          <p className="p-4 text-sm text-zinc-500">
            Sin pasos configurados — el beneficiado con este proceso irá directo de cereza a pergamino.
          </p>
        )}
        {pasos.map((paso) => (
          <div key={paso.id} data-testid="fila-paso" className="p-4">
            {editandoId === paso.id ? (
              <PasoForm
                procesoBeneficiadoId={procesoBeneficiadoId}
                paso={paso}
                onGuardado={() => setEditandoId(null)}
              />
            ) : (
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm text-zinc-900">
                  <span className="text-primary font-mono text-xs">{paso.orden}.</span> {paso.nombre}
                </p>
                {puedeEscribir && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setMostrarForm(false);
                        setEditandoId(paso.id);
                      }}
                      className="border-primary/30 text-primary hover:bg-primary-soft min-h-9 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => eliminarPasoBeneficiado(procesoBeneficiadoId, paso.id)}
                      className="min-h-9 rounded-md border border-red-200 px-3 py-1.5 text-sm text-red-600 transition-colors hover:bg-red-50"
                    >
                      Eliminar
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function PasoForm({
  procesoBeneficiadoId,
  paso,
  onGuardado,
}: {
  procesoBeneficiadoId: string;
  paso?: Paso;
  onGuardado: () => void;
}) {
  const action = paso
    ? actualizarPasoBeneficiado.bind(null, procesoBeneficiadoId, paso.id)
    : crearPasoBeneficiado.bind(null, procesoBeneficiadoId);
  const [state, formAction, isPending] = useActionState(action, {});

  useEffect(() => {
    if (state && "success" in state) onGuardado();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} className="space-y-3 border-b border-zinc-100 bg-zinc-50 p-4">
      <div>
        <label htmlFor="orden" className="mb-1 block text-sm text-zinc-600">
          Orden
        </label>
        <input
          id="orden"
          name="orden"
          type="number"
          min="1"
          step="1"
          required
          defaultValue={paso?.orden ?? ""}
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
        />
      </div>
      <div>
        <label htmlFor="nombre" className="mb-1 block text-sm text-zinc-600">
          Nombre del paso
        </label>
        <input
          id="nombre"
          name="nombre"
          type="text"
          required
          defaultValue={paso?.nombre ?? ""}
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
        />
      </div>

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
