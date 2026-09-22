"use client";

import { useActionState, useEffect, useState } from "react";
import "@/features/inventario/md3-theme.css";
import { Md3Button } from "@/components/md3/button";
import { Md3Card } from "@/components/md3/card";
import { Md3TextField } from "@/components/md3/text-field";
import { crearPasoBeneficiado, actualizarPasoBeneficiado, eliminarPasoBeneficiado } from "./actions";

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
    <div className="md3-scope rounded-2xl">
      <Md3Card>
        <div className="flex flex-wrap items-center justify-between gap-2 p-4" style={{ borderBottom: "1px solid var(--md-sys-color-outline-variant)" }}>
          <h2 className="text-sm font-semibold">Pasos del flujo</h2>
          {puedeEscribir && (
            <Md3Button
              variant={mostrarForm ? "outlined" : "filled"}
              minWidth={110}
              onClick={() => {
                setEditandoId(null);
                setMostrarForm((v) => !v);
              }}
            >
              {mostrarForm ? "Cancelar" : "Agregar paso"}
            </Md3Button>
          )}
        </div>

        {mostrarForm && (
          <div className="p-4" style={{ borderBottom: "1px solid var(--md-sys-color-outline-variant)" }}>
            <PasoForm procesoBeneficiadoId={procesoBeneficiadoId} onGuardado={() => setMostrarForm(false)} />
          </div>
        )}

        <div>
          {pasos.length === 0 && <p className="p-4 text-sm">Sin pasos configurados — el beneficiado con este proceso irá directo de cereza a pergamino.</p>}
          {pasos.map((paso) => (
            <div key={paso.id} data-testid="fila-paso" className="p-4" style={{ borderBottom: "1px solid var(--md-sys-color-outline-variant)" }}>
              {editandoId === paso.id ? (
                <PasoForm procesoBeneficiadoId={procesoBeneficiadoId} paso={paso} onGuardado={() => setEditandoId(null)} />
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm">
                    <span className="font-mono text-xs" style={{ color: "var(--md-sys-color-primary)" }}>
                      {paso.orden}.
                    </span>{" "}
                    {paso.nombre}
                  </p>
                  {puedeEscribir && (
                    <div className="flex gap-2">
                      <Md3Button
                        variant="outlined"
                        minWidth={80}
                        onClick={() => {
                          setMostrarForm(false);
                          setEditandoId(paso.id);
                        }}
                      >
                        Editar
                      </Md3Button>
                      <Md3Button variant="outlined" minWidth={90} onClick={() => eliminarPasoBeneficiado(procesoBeneficiadoId, paso.id)}>
                        Eliminar
                      </Md3Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </Md3Card>
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
    <form action={formAction} className="space-y-3">
      <div className="flex flex-wrap gap-3">
        <Md3TextField label="Orden" name="orden" type="number" min="1" step="1" required defaultValue={paso?.orden ?? ""} minWidth={100} />
        <Md3TextField label="Nombre del paso" name="nombre" required defaultValue={paso?.nombre ?? ""} />
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
