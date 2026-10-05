"use client";

import { useActionState, useEffect, useState } from "react";
import "@/features/inventario/md3-theme.css";
import { Md3Button } from "@/components/md3/button";
import { Md3Card } from "@/components/md3/card";
import { Md3TextField, Md3Textarea } from "@/components/md3/text-field";
import { Md3Select } from "@/components/md3/select";
import { formatoMoneda } from "@/lib/moneda";
import { registrarGasto, eliminarGasto } from "./actions";

type Opcion = { id: string; nombre: string };

type Gasto = {
  id: string;
  descripcion: string | null;
  monto: number;
  fecha: string;
  numero_factura: string | null;
  categoria: { nombre: string } | null;
};

export type GastosMd3Props = {
  gastos: Gasto[];
  categorias: Opcion[];
  puedeEscribir: boolean;
  esAdmin: boolean;
};

export function GastosMd3Vista({ gastos, categorias, puedeEscribir, esAdmin }: GastosMd3Props) {
  const [mostrarForm, setMostrarForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleEliminar(id: string, etiqueta: string) {
    if (!window.confirm(`¿Eliminar el gasto "${etiqueta}" definitivamente?`)) return;
    setError(null);
    const resultado = await eliminarGasto(id);
    if ("error" in resultado && resultado.error) setError(resultado.error);
  }

  return (
    <div className="md3-scope space-y-4 rounded-2xl p-4">
      <h1 className="text-2xl font-medium">Gastos</h1>

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
          <h2 className="text-sm font-semibold">Gastos operativos</h2>
          {puedeEscribir && (
            <Md3Button variant={mostrarForm ? "outlined" : "filled"} minWidth={150} onClick={() => setMostrarForm((v) => !v)}>
              {mostrarForm ? "Cancelar" : "Registrar gasto"}
            </Md3Button>
          )}
        </div>

        {mostrarForm && (
          <div className="p-4" style={{ borderBottom: "1px solid var(--md-sys-color-outline-variant)" }}>
            <RegistrarGastoForm categorias={categorias} onGuardado={() => setMostrarForm(false)} />
          </div>
        )}

        <div>
          {gastos.length === 0 && <p className="p-4 text-sm">Sin gastos registrados.</p>}
          {gastos.map((gasto) => {
            const etiqueta = gasto.categoria?.nombre ?? "gasto";
            return (
              <div
                key={gasto.id}
                data-testid="fila-gasto"
                className="p-4"
                style={{ borderBottom: "1px solid var(--md-sys-color-outline-variant)" }}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="mb-1 text-sm font-medium">
                      {gasto.categoria?.nombre ?? "Sin categoría"}
                      {gasto.descripcion ? ` — ${gasto.descripcion}` : ""}
                    </p>
                    <p className="text-xs" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
                      {formatoMoneda(gasto.monto)} · {gasto.fecha}
                      {gasto.numero_factura ? ` · factura ${gasto.numero_factura}` : ""}
                    </p>
                  </div>
                  {esAdmin && (
                    <Md3Button variant="outlined" minWidth={100} onClick={() => handleEliminar(gasto.id, etiqueta)}>
                      Eliminar
                    </Md3Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Md3Card>
    </div>
  );
}

function RegistrarGastoForm({ categorias, onGuardado }: { categorias: Opcion[]; onGuardado: () => void }) {
  const [state, formAction, isPending] = useActionState(registrarGasto, {});
  const hoy = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (state && "success" in state) onGuardado();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} data-testid="form-registrar-gasto" className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Md3Select
          label="Categoría"
          name="categoria_id"
          required
          placeholder="Selecciona una categoría"
          opciones={categorias.map((c) => ({ value: c.id, label: c.nombre }))}
        />
        <Md3TextField label="Monto (₡)" name="monto" type="number" step="0.01" min="0.01" required />
        <Md3TextField label="Fecha" name="fecha" type="date" defaultValue={hoy} />
        <Md3TextField label="N° de factura (opcional)" name="numero_factura" />
        <Md3Textarea label="Descripción (opcional)" name="descripcion" />
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
