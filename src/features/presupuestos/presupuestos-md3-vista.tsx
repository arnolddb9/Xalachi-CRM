"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import "@/features/inventario/md3-theme.css";
import { Md3Button } from "@/components/md3/button";
import { Md3Card } from "@/components/md3/card";
import { Md3Chip } from "@/components/md3/chip";
import { Md3TextField, Md3Textarea } from "@/components/md3/text-field";
import { Md3Select } from "@/components/md3/select";
import { formatoMoneda } from "@/lib/moneda";
import { registrarPresupuesto, aprobarPresupuesto, rechazarPresupuesto, eliminarPresupuesto } from "./actions";

type Opcion = { id: string; nombre: string };

const ETAPA_LABEL: Record<string, string> = {
  cereza: "Cereza",
  pergamino: "Pergamino",
  verde: "Verde",
  tostado: "Tostado",
};
const ESTADO_LABEL: Record<string, string> = {
  borrador: "Borrador",
  aprobado: "Aprobado",
  rechazado: "Rechazado",
};

type Presupuesto = {
  id: string;
  etapa_entrada: string;
  cantidad_kg: number | null;
  cantidad_cajuelas: number | null;
  estado: string;
  orden_servicio_id: string | null;
  creado_en: string;
  cliente: { nombre: string } | null;
  costoTotal: number;
};

export type PresupuestosMd3Props = {
  presupuestos: Presupuesto[];
  clientes: Opcion[];
  procesosBeneficiado: Opcion[];
  factorCajuela: number;
  puedeEscribir: boolean;
  esAdmin: boolean;
};

export function PresupuestosMd3Vista({
  presupuestos,
  clientes,
  procesosBeneficiado,
  factorCajuela,
  puedeEscribir,
  esAdmin,
}: PresupuestosMd3Props) {
  const [mostrarForm, setMostrarForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAprobar(id: string) {
    setError(null);
    const resultado = await aprobarPresupuesto(id);
    if ("error" in resultado && resultado.error) setError(resultado.error);
  }
  async function handleRechazar(id: string) {
    if (!window.confirm("¿Rechazar este presupuesto? No se creará una orden de servicio.")) return;
    setError(null);
    const resultado = await rechazarPresupuesto(id);
    if ("error" in resultado && resultado.error) setError(resultado.error);
  }
  async function handleEliminar(id: string, etiqueta: string) {
    if (!window.confirm(`¿Eliminar el presupuesto de "${etiqueta}" definitivamente?`)) return;
    setError(null);
    const resultado = await eliminarPresupuesto(id);
    if ("error" in resultado && resultado.error) setError(resultado.error);
  }

  return (
    <div className="md3-scope space-y-4 rounded-2xl p-4">
      <h1 className="text-2xl font-medium">Presupuestos</h1>

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
          <h2 className="text-sm font-semibold">Presupuestos</h2>
          {puedeEscribir && (
            <Md3Button variant={mostrarForm ? "outlined" : "filled"} minWidth={160} onClick={() => setMostrarForm((v) => !v)}>
              {mostrarForm ? "Cancelar" : "Registrar presupuesto"}
            </Md3Button>
          )}
        </div>

        {mostrarForm && (
          <div className="p-4" style={{ borderBottom: "1px solid var(--md-sys-color-outline-variant)" }}>
            <RegistrarPresupuestoForm
              clientes={clientes}
              procesosBeneficiado={procesosBeneficiado}
              factorCajuela={factorCajuela}
              onGuardado={() => setMostrarForm(false)}
            />
          </div>
        )}

        <div>
          {presupuestos.length === 0 && <p className="p-4 text-sm">Sin presupuestos registrados.</p>}
          {presupuestos.map((presupuesto) => {
            const etiqueta = presupuesto.cliente?.nombre ?? "presupuesto";
            return (
              <div
                key={presupuesto.id}
                data-testid="fila-presupuesto"
                className="p-4"
                style={{ borderBottom: "1px solid var(--md-sys-color-outline-variant)" }}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="mb-1 text-sm font-medium">
                      {presupuesto.cliente?.nombre ?? "Sin cliente"}{" "}
                      <Md3Chip testId="badge-estado" label={ESTADO_LABEL[presupuesto.estado] ?? presupuesto.estado} />
                    </p>
                    <p className="text-xs" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
                      {ETAPA_LABEL[presupuesto.etapa_entrada] ?? presupuesto.etapa_entrada}
                      {presupuesto.cantidad_cajuelas ? ` · ${presupuesto.cantidad_cajuelas} cajuelas` : ""}
                      {presupuesto.cantidad_kg ? ` · ${presupuesto.cantidad_kg} kg` : ""}
                      {` · total estimado ${formatoMoneda(presupuesto.costoTotal)}`}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/presupuestos/${presupuesto.id}`}>
                      <Md3Button variant="outlined" minWidth={110}>
                        Ver detalle
                      </Md3Button>
                    </Link>
                    {presupuesto.estado === "aprobado" && presupuesto.orden_servicio_id && (
                      <Link href={`/servicios/${presupuesto.orden_servicio_id}`}>
                        <Md3Button variant="outlined" minWidth={100}>
                          Ver orden
                        </Md3Button>
                      </Link>
                    )}
                    {puedeEscribir && presupuesto.estado === "borrador" && (
                      <>
                        <Md3Button variant="outlined" minWidth={90} onClick={() => handleAprobar(presupuesto.id)}>
                          Aprobar
                        </Md3Button>
                        <Md3Button variant="outlined" minWidth={90} onClick={() => handleRechazar(presupuesto.id)}>
                          Rechazar
                        </Md3Button>
                      </>
                    )}
                    {esAdmin && (
                      <Md3Button variant="outlined" minWidth={100} onClick={() => handleEliminar(presupuesto.id, etiqueta)}>
                        Eliminar
                      </Md3Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Md3Card>
    </div>
  );
}

function RegistrarPresupuestoForm({
  clientes,
  procesosBeneficiado,
  factorCajuela,
  onGuardado,
}: {
  clientes: Opcion[];
  procesosBeneficiado: Opcion[];
  factorCajuela: number;
  onGuardado: () => void;
}) {
  const [state, formAction, isPending] = useActionState(registrarPresupuesto, {});
  const [etapaEntrada, setEtapaEntrada] = useState<"cereza" | "pergamino" | "verde" | "tostado">("verde");
  const [cajuelas, setCajuelas] = useState("");
  const pesoEstimado = etapaEntrada === "cereza" && cajuelas ? Number(cajuelas) * factorCajuela : null;

  useEffect(() => {
    if (state && "success" in state) onGuardado();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} data-testid="form-registrar-presupuesto" className="space-y-3">
      <div className="flex flex-wrap gap-3">
        <Md3Select
          label="Cliente"
          name="cliente_id"
          required
          placeholder="Selecciona un cliente"
          opciones={clientes.map((c) => ({ value: c.id, label: c.nombre }))}
        />
        <Md3Select
          label="Etapa en la que llegaría el café"
          name="etapa_entrada"
          required
          value={etapaEntrada}
          onValueChange={(v) => setEtapaEntrada(v as typeof etapaEntrada)}
          opciones={[
            { value: "cereza", label: "Cereza" },
            { value: "pergamino", label: "Pergamino" },
            { value: "verde", label: "Verde" },
            { value: "tostado", label: "Tostado" },
          ]}
        />

        {etapaEntrada === "cereza" ? (
          <>
            <Md3Select
              label="Proceso de beneficiado"
              name="proceso_beneficiado_id"
              required
              placeholder="Selecciona un proceso"
              opciones={procesosBeneficiado.map((p) => ({ value: p.id, label: p.nombre }))}
            />
            <Md3TextField
              label="Cajuelas estimadas"
              name="cantidad_cajuelas"
              type="number"
              step="0.1"
              min="0.1"
              required
              value={cajuelas}
              onValueChange={setCajuelas}
              supportingText={
                pesoEstimado !== null
                  ? `≈ ${pesoEstimado.toFixed(2)} kg (${factorCajuela} kg/cajuela)`
                  : `Factor actual: ${factorCajuela} kg por cajuela`
              }
            />
          </>
        ) : (
          <Md3TextField label="Cantidad estimada (kg)" name="cantidad_kg" type="number" step="0.01" min="0.01" required />
        )}
        <Md3Textarea label="Notas (opcional)" name="notas" />
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
