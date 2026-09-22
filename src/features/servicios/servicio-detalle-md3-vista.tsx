"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import "@/features/inventario/md3-theme.css";
import { Md3Button } from "@/components/md3/button";
import { Md3Card } from "@/components/md3/card";
import { Md3Chip } from "@/components/md3/chip";
import { Md3TextField } from "@/components/md3/text-field";
import { Md3Select } from "@/components/md3/select";
import { formatoMoneda } from "@/lib/moneda";
import type { NodoServicio } from "./arbol";
import {
  aplicarPeladoServicio,
  aplicarBeneficiadoServicio,
  aplicarClasificacionServicio,
  aplicarTuesteServicio,
  aplicarMolidoServicio,
} from "./actions";
import { CompartirOrdenBoton } from "./compartir-orden-boton";

type Opcion = { id: string; nombre: string };

const ETAPAS_CONOCIDAS = ["cereza", "pergamino", "verde", "tostado", "molido"];
const ETAPA_LABEL: Record<string, string> = {
  cereza: "Cereza",
  pergamino: "Pergamino",
  verde: "Verde",
  tostado: "Tostado",
  molido: "Molido",
};
const CALIDAD_LABEL: Record<string, string> = {
  primera: "Primera",
  segunda: "Segunda",
  tercera: "Tercera",
  rechazo: "Rechazo",
};
const TIPO_PROCESO_LABEL: Record<string, string> = {
  beneficiado: "Beneficiado",
  pelado: "Pelado",
  clasificacion: "Clasificación",
  tueste: "Tueste",
  molido: "Molido",
};

type Paso = {
  id: string;
  tipo_proceso: string;
  peso_procesado_kg: number;
  tarifa_kg: number;
  costo_total: number;
};

export type ServicioDetalleMd3Props = {
  clienteNombre: string;
  etapaEntrada: string;
  cantidadKg: number;
  fechaRecepcion: string;
  notas: string | null;
  arbol: NodoServicio | null;
  perfilesTueste: Opcion[];
  puedeEscribir: boolean;
  pasos: Paso[];
  costoTotal: number;
};

export function ServicioDetalleMd3Vista({
  clienteNombre,
  etapaEntrada,
  cantidadKg,
  fechaRecepcion,
  notas,
  arbol,
  perfilesTueste,
  puedeEscribir,
  pasos,
  costoTotal,
}: ServicioDetalleMd3Props) {
  return (
    <div className="md3-scope space-y-4 rounded-2xl p-4">
      <Link href="/servicios" className="inline-flex items-center gap-1.5 text-sm font-medium" style={{ color: "var(--md-sys-color-primary)" }}>
        <ArrowLeft size={16} />
        Volver a servicios
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-medium">Servicio para {clienteNombre}</h1>
        <CompartirOrdenBoton
          clienteNombre={clienteNombre}
          etapaEntrada={etapaEntrada}
          cantidadKg={cantidadKg}
          fechaRecepcion={fechaRecepcion}
          notas={notas}
          arbol={arbol}
          pasos={pasos}
          costoTotal={costoTotal}
        />
      </div>
      <p className="text-sm" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
        {cantidadKg} kg recibidos el {fechaRecepcion}
        {notas ? ` · ${notas}` : ""}
      </p>

      {arbol ? (
        <LoteServicioArbol nodo={arbol} perfilesTueste={perfilesTueste} puedeEscribir={puedeEscribir} />
      ) : (
        <p className="text-sm">No se encontró el café de esta orden.</p>
      )}

      <Md3Card>
        <div className="p-4" style={{ borderBottom: "1px solid var(--md-sys-color-outline-variant)" }}>
          <h2 className="text-sm font-semibold">Desglose de costo</h2>
        </div>
        <div>
          {pasos.length === 0 && <p className="p-4 text-sm">Aún no se ha aplicado ningún proceso.</p>}
          {pasos.map((paso) => (
            <div
              key={paso.id}
              className="flex items-center justify-between p-3 text-sm"
              style={{ borderBottom: "1px solid var(--md-sys-color-outline-variant)" }}
            >
              <span>
                {TIPO_PROCESO_LABEL[paso.tipo_proceso] ?? paso.tipo_proceso} — {paso.peso_procesado_kg} kg × {formatoMoneda(paso.tarifa_kg)}/kg
              </span>
              <span className="font-medium">{formatoMoneda(paso.costo_total)}</span>
            </div>
          ))}
        </div>
        {pasos.length > 0 && (
          <div data-testid="costo-total" className="flex items-center justify-between p-4" style={{ borderTop: "1px solid var(--md-sys-color-outline-variant)" }}>
            <span className="text-sm font-semibold">Total</span>
            <span className="text-base font-semibold" style={{ color: "var(--md-sys-color-primary)" }}>
              {formatoMoneda(costoTotal)}
            </span>
          </div>
        )}
      </Md3Card>
    </div>
  );
}

type Accion = "beneficiado" | "pelado" | "clasificacion" | "tueste" | "molido" | null;

function LoteServicioArbol({
  nodo,
  perfilesTueste,
  puedeEscribir,
  nivel = 0,
}: {
  nodo: NodoServicio;
  perfilesTueste: Opcion[];
  puedeEscribir: boolean;
  nivel?: number;
}) {
  const [accion, setAccion] = useState<Accion>(null);
  const disponible = nodo.lote.peso_actual_kg > 0;

  return (
    <div style={{ marginLeft: nivel > 0 ? 20 : 0 }} className={nivel > 0 ? "border-l pl-4" : ""} data-md3-border={nivel > 0}>
      {nodo.pasoEntrada && (
        <div className="mb-2 text-xs" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
          <span className="font-medium" style={{ color: "var(--md-sys-color-on-surface)" }}>
            {TIPO_PROCESO_LABEL[nodo.pasoEntrada.tipo_proceso] ?? nodo.pasoEntrada.tipo_proceso}
          </span>
          {` — ${nodo.pasoEntrada.peso_procesado_kg} kg procesados · merma ${nodo.pasoEntrada.merma_pct}%`}
          {` · ${formatoMoneda(nodo.pasoEntrada.tarifa_kg)}/kg · costo ${formatoMoneda(nodo.pasoEntrada.costo_total)}`}
          {nodo.pasoEntrada.usuario?.nombre && ` · ${nodo.pasoEntrada.usuario.nombre}`}
          {" · "}
          {new Date(nodo.pasoEntrada.creado_en).toLocaleString("es")}
        </div>
      )}

      <Md3Card style={{ padding: 12, marginBottom: 12 }} testId="fila-lote-servicio">
        <p className="text-sm font-medium">
          <Md3Chip label={ETAPA_LABEL[nodo.lote.etapa] ?? nodo.lote.etapa} />
          {nodo.lote.calidad && <span className="ml-1"><Md3Chip label={CALIDAD_LABEL[nodo.lote.calidad] ?? nodo.lote.calidad} /></span>}
        </p>
        <p className="mt-1 text-xs" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
          {nodo.lote.peso_actual_kg} kg disponibles (de {nodo.lote.peso_inicial_kg} kg)
          {nodo.lote.cantidad_cajuelas ? ` · ${nodo.lote.cantidad_cajuelas} cajuelas` : ""}
          {nodo.lote.proceso_beneficiado?.nombre ? ` · ${nodo.lote.proceso_beneficiado.nombre}` : ""}
        </p>

        {puedeEscribir && disponible && accion === null && (
          <div className="mt-2 flex flex-wrap gap-2">
            {(nodo.lote.etapa === "cereza" || (!ETAPAS_CONOCIDAS.includes(nodo.lote.etapa) && nodo.lote.proceso_beneficiado)) && (
              <Md3Button variant="outlined" minWidth={140} onClick={() => setAccion("beneficiado")}>
                Aplicar beneficiado
              </Md3Button>
            )}
            {nodo.lote.etapa === "pergamino" && (
              <Md3Button variant="outlined" minWidth={80} onClick={() => setAccion("pelado")}>
                Pelar
              </Md3Button>
            )}
            {nodo.lote.etapa === "verde" && (
              <>
                {!nodo.lote.calidad && (
                  <Md3Button variant="outlined" minWidth={100} onClick={() => setAccion("clasificacion")}>
                    Clasificar
                  </Md3Button>
                )}
                <Md3Button variant="outlined" minWidth={80} onClick={() => setAccion("tueste")}>
                  Tostar
                </Md3Button>
              </>
            )}
            {nodo.lote.etapa === "tostado" && (
              <Md3Button variant="outlined" minWidth={80} onClick={() => setAccion("molido")}>
                Moler
              </Md3Button>
            )}
          </div>
        )}

        {accion === "beneficiado" && <BeneficiadoForm loteServicioId={nodo.lote.id} onGuardado={() => setAccion(null)} />}
        {accion === "pelado" && <PeladoForm loteServicioId={nodo.lote.id} onGuardado={() => setAccion(null)} />}
        {accion === "clasificacion" && (
          <ClasificacionForm loteServicioId={nodo.lote.id} pesoDisponible={nodo.lote.peso_actual_kg} onGuardado={() => setAccion(null)} />
        )}
        {accion === "tueste" && <TuesteForm loteServicioId={nodo.lote.id} perfilesTueste={perfilesTueste} onGuardado={() => setAccion(null)} />}
        {accion === "molido" && <MolidoForm loteServicioId={nodo.lote.id} onGuardado={() => setAccion(null)} />}
      </Md3Card>

      {nodo.hijos.map((hijo) => (
        <LoteServicioArbol key={hijo.lote.id} nodo={hijo} perfilesTueste={perfilesTueste} puedeEscribir={puedeEscribir} nivel={nivel + 1} />
      ))}
    </div>
  );
}

function CamposKgYMerma({ etiquetaKg }: { etiquetaKg: string }) {
  return (
    <>
      <Md3TextField label={etiquetaKg} name="kg_a_procesar" type="number" step="0.01" min="0.01" required />
      <Md3TextField label="Merma (%)" name="merma_pct" type="number" step="0.1" min="0" max="100" required />
    </>
  );
}

function BeneficiadoForm({ loteServicioId, onGuardado }: { loteServicioId: string; onGuardado: () => void }) {
  const [state, formAction, isPending] = useActionState(aplicarBeneficiadoServicio, {});

  useEffect(() => {
    if (state && "success" in state) onGuardado();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} data-testid="form-beneficiado-servicio" className="mt-3 space-y-3">
      <input type="hidden" name="lote_servicio_origen_id" value={loteServicioId} />
      <div className="flex flex-wrap gap-3">
        <CamposKgYMerma etiquetaKg="Cantidad a avanzar (kg)" />
      </div>
      {state && "error" in state && state.error && (
        <p className="text-sm" style={{ color: "var(--md-sys-color-error)" }}>
          {state.error}
        </p>
      )}
      <Md3Button type="submit" disabled={isPending} minWidth={90}>
        {isPending ? "Aplicando..." : "Avanzar"}
      </Md3Button>
    </form>
  );
}

function PeladoForm({ loteServicioId, onGuardado }: { loteServicioId: string; onGuardado: () => void }) {
  const [state, formAction, isPending] = useActionState(aplicarPeladoServicio, {});

  useEffect(() => {
    if (state && "success" in state) onGuardado();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} data-testid="form-pelado-servicio" className="mt-3 space-y-3">
      <input type="hidden" name="lote_servicio_origen_id" value={loteServicioId} />
      <div className="flex flex-wrap gap-3">
        <CamposKgYMerma etiquetaKg="Cantidad a pelar (kg)" />
      </div>
      {state && "error" in state && state.error && (
        <p className="text-sm" style={{ color: "var(--md-sys-color-error)" }}>
          {state.error}
        </p>
      )}
      <Md3Button type="submit" disabled={isPending} minWidth={70}>
        {isPending ? "Aplicando..." : "Pelar"}
      </Md3Button>
    </form>
  );
}

function TuesteForm({
  loteServicioId,
  perfilesTueste,
  onGuardado,
}: {
  loteServicioId: string;
  perfilesTueste: Opcion[];
  onGuardado: () => void;
}) {
  const [state, formAction, isPending] = useActionState(aplicarTuesteServicio, {});

  useEffect(() => {
    if (state && "success" in state) onGuardado();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} data-testid="form-tueste-servicio" className="mt-3 space-y-3">
      <input type="hidden" name="lote_servicio_origen_id" value={loteServicioId} />
      <div className="flex flex-wrap gap-3">
        <Md3Select
          label="Perfil de tueste"
          name="perfil_tueste_id"
          required
          placeholder="Selecciona un perfil"
          opciones={perfilesTueste.map((p) => ({ value: p.id, label: p.nombre }))}
        />
        <CamposKgYMerma etiquetaKg="Cantidad a tostar (kg)" />
      </div>
      {state && "error" in state && state.error && (
        <p className="text-sm" style={{ color: "var(--md-sys-color-error)" }}>
          {state.error}
        </p>
      )}
      <Md3Button type="submit" disabled={isPending} minWidth={80}>
        {isPending ? "Aplicando..." : "Tostar"}
      </Md3Button>
    </form>
  );
}

function MolidoForm({ loteServicioId, onGuardado }: { loteServicioId: string; onGuardado: () => void }) {
  const [state, formAction, isPending] = useActionState(aplicarMolidoServicio, {});

  useEffect(() => {
    if (state && "success" in state) onGuardado();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} data-testid="form-molido-servicio" className="mt-3 space-y-3">
      <input type="hidden" name="lote_servicio_origen_id" value={loteServicioId} />
      <div className="flex flex-wrap gap-3">
        <CamposKgYMerma etiquetaKg="Cantidad a moler (kg)" />
      </div>
      {state && "error" in state && state.error && (
        <p className="text-sm" style={{ color: "var(--md-sys-color-error)" }}>
          {state.error}
        </p>
      )}
      <Md3Button type="submit" disabled={isPending} minWidth={70}>
        {isPending ? "Aplicando..." : "Moler"}
      </Md3Button>
    </form>
  );
}

function ClasificacionForm({
  loteServicioId,
  pesoDisponible,
  onGuardado,
}: {
  loteServicioId: string;
  pesoDisponible: number;
  onGuardado: () => void;
}) {
  const [state, formAction, isPending] = useActionState(aplicarClasificacionServicio, {});

  useEffect(() => {
    if (state && "success" in state) onGuardado();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} data-testid="form-clasificacion-servicio" className="mt-3 space-y-3">
      <input type="hidden" name="lote_servicio_origen_id" value={loteServicioId} />
      <p className="text-sm">Dividir {pesoDisponible} kg en calidades (la suma no puede exceder el peso disponible):</p>
      <div className="flex flex-wrap gap-3">
        {(["primera", "segunda", "tercera", "rechazo"] as const).map((calidad) => (
          <Md3TextField key={calidad} label={`${CALIDAD_LABEL[calidad]} (kg)`} name={`${calidad}_kg`} type="number" step="0.01" min="0" />
        ))}
      </div>
      {state && "error" in state && state.error && (
        <p className="text-sm" style={{ color: "var(--md-sys-color-error)" }}>
          {state.error}
        </p>
      )}
      <Md3Button type="submit" disabled={isPending} minWidth={100}>
        {isPending ? "Clasificando..." : "Clasificar"}
      </Md3Button>
    </form>
  );
}
