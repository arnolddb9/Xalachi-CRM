"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  registrarLote,
  actualizarLote,
  eliminarLote,
  iniciarOAvanzarBeneficiado,
  aplicarTrillado,
  aplicarTueste,
  aplicarMolido,
  empacarLote,
  clasificarCalidadLote,
  actualizarFactorCajuela,
} from "./actions";

type Opcion = { id: string; nombre: string };
type ArticuloOpcion = { id: string; nombre: string; tipo: string };
type PresentacionOpcion = { id: string; nombre: string; peso_gramos: number | null };

type EtapaBase = "cereza" | "pergamino" | "verde";
const ETAPAS_BASE: readonly string[] = ["cereza", "pergamino", "verde"];
const ETAPA_LABEL: Record<EtapaBase, string> = {
  cereza: "Cereza",
  pergamino: "Pergamino",
  verde: "Verde",
};
// Etapas conocidas de M4, sumadas a las de M2: no son "pasos configurados"
// de beneficiado (esos usan el nombre libre que el usuario les dio).
const ETAPA_LABEL_EXTRA: Record<string, string> = { tostado: "Tostado", molido: "Molido" };
const ETAPAS_CONOCIDAS: readonly string[] = [...ETAPAS_BASE, "tostado", "molido"];
const CALIDAD_LABEL: Record<string, string> = {
  primera: "Primera",
  segunda: "Segunda",
  tercera: "Tercera",
  rechazo: "Rechazo",
};

type Lote = {
  id: string;
  nombre: string | null;
  variedad_id: string;
  proveedor_id: string | null;
  finca_id: string | null;
  numero_cama_secado: string | null;
  etapa: string;
  peso_actual_kg: number;
  cantidad_cajuelas: number | null;
  fecha_cosecha: string | null;
  calidad: string | null;
  variedad: { nombre: string } | null;
  proveedor: { nombre: string } | null;
  finca: { nombre: string } | null;
  perfil_tueste: { nombre: string } | null;
};

function etiquetaEtapa(etapa: string) {
  if (ETAPAS_BASE.includes(etapa)) return ETAPA_LABEL[etapa as EtapaBase];
  return ETAPA_LABEL_EXTRA[etapa] ?? etapa;
}

function etiquetaBotonProceso(etapa: string) {
  if (etapa === "verde") return "Tostar";
  if (etapa === "tostado") return "Moler";
  return "Aplicar proceso";
}

export function LotesTabla({
  lotes,
  resumenPorEtapa,
  variedades,
  proveedores,
  fincas,
  procesosBeneficiado,
  perfilesTueste,
  articulos,
  presentaciones,
  factorCajuela,
  puedeEscribir,
  esAdmin,
}: {
  lotes: Lote[];
  resumenPorEtapa: { etiqueta: string; totalKg: number }[];
  variedades: Opcion[];
  proveedores: Opcion[];
  fincas: Opcion[];
  procesosBeneficiado: Opcion[];
  perfilesTueste: Opcion[];
  articulos: ArticuloOpcion[];
  presentaciones: PresentacionOpcion[];
  factorCajuela: number;
  puedeEscribir: boolean;
  esAdmin: boolean;
}) {
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [procesandoId, setProcesandoId] = useState<string | null>(null);
  const [clasificandoId, setClasificandoId] = useState<string | null>(null);
  const [empacandoId, setEmpacandoId] = useState<string | null>(null);
  const [isPendingEliminar, startTransitionEliminar] = useTransition();
  const [errorEliminar, setErrorEliminar] = useState<string | null>(null);

  function handleEliminar(id: string, nombre: string) {
    if (!window.confirm(`¿Eliminar el lote "${nombre}" definitivamente? Esta acción no se puede deshacer.`)) {
      return;
    }
    setErrorEliminar(null);
    startTransitionEliminar(async () => {
      const resultado = await eliminarLote(id);
      if ("error" in resultado && resultado.error) setErrorEliminar(resultado.error);
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {resumenPorEtapa.map((r) => (
          <div key={r.etiqueta} className="rounded-lg border border-zinc-200 bg-white p-3 text-center">
            <p className="text-xs text-zinc-500">{r.etiqueta}</p>
            <p className="text-primary text-lg font-semibold">{r.totalKg.toFixed(1)} kg</p>
          </div>
        ))}
      </div>

      {esAdmin && <FactorCajuelaControl factorActual={factorCajuela} />}

      {errorEliminar && (
        <p className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-600">
          {errorEliminar}
        </p>
      )}

      <div className="rounded-lg border border-zinc-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 p-4">
          <h2 className="text-sm font-semibold text-zinc-900">Lotes activos</h2>
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
              {mostrarForm ? "Cancelar" : "Registrar lote"}
            </button>
          )}
        </div>

        {mostrarForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ duration: 0.2 }}
          >
            <LoteForm
              variedades={variedades}
              proveedores={proveedores}
              fincas={fincas}
              factorCajuela={factorCajuela}
              onGuardado={() => setMostrarForm(false)}
            />
          </motion.div>
        )}

        <div className="divide-y divide-zinc-100">
          {lotes.length === 0 && <p className="p-4 text-sm text-zinc-500">Sin lotes activos.</p>}
          {lotes.map((lote, i) => {
            const esEtapaConocida = ETAPAS_CONOCIDAS.includes(lote.etapa);
            const enPergamino = lote.etapa === "pergamino";
            const enVerde = lote.etapa === "verde";
            const enVerdeSinClasificar = enVerde && !lote.calidad;
            const enTostadoOMolido = lote.etapa === "tostado" || lote.etapa === "molido";
            // Cereza, paso intermedio de beneficiado, pergamino, verde o
            // tostado: todos tienen una siguiente transformación posible.
            // Molido es terminal para "Aplicar proceso" — de ahí solo se empaca.
            const puedeAvanzar = lote.etapa !== "molido";

            return (
              <motion.div
                key={lote.id}
                data-testid="fila-lote"
                className="p-4"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18, delay: Math.min(i, 8) * 0.02 }}
              >
                {editandoId === lote.id ? (
                  <LoteForm
                    lote={lote}
                    variedades={variedades}
                    proveedores={proveedores}
                    fincas={fincas}
                    factorCajuela={factorCajuela}
                    onGuardado={() => setEditandoId(null)}
                  />
                ) : procesandoId === lote.id ? (
                  <ProcesoForm
                    lote={lote}
                    esInicioBeneficiado={lote.etapa === "cereza"}
                    esTrillado={enPergamino}
                    esTueste={enVerde}
                    esMolido={lote.etapa === "tostado"}
                    procesosBeneficiado={procesosBeneficiado}
                    perfilesTueste={perfilesTueste}
                    onGuardado={() => setProcesandoId(null)}
                  />
                ) : clasificandoId === lote.id ? (
                  <ClasificarCalidadForm lote={lote} onGuardado={() => setClasificandoId(null)} />
                ) : empacandoId === lote.id ? (
                  <EmpacarForm
                    lote={lote}
                    articulos={articulos}
                    presentaciones={presentaciones}
                    onGuardado={() => setEmpacandoId(null)}
                  />
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-zinc-900">
                        {lote.nombre ?? lote.variedad?.nombre ?? "—"}{" "}
                        <span
                          className={
                            esEtapaConocida
                              ? "bg-primary-soft text-primary ml-1 rounded px-1.5 py-0.5 text-xs font-medium"
                              : "ml-1 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-700"
                          }
                        >
                          {etiquetaEtapa(lote.etapa)}
                        </span>
                        {lote.calidad && (
                          <span className="bg-accent-soft text-accent ml-1 rounded px-1.5 py-0.5 text-xs font-medium">
                            {CALIDAD_LABEL[lote.calidad] ?? lote.calidad}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {lote.nombre && lote.variedad?.nombre ? `${lote.variedad.nombre} · ` : ""}
                        {lote.peso_actual_kg} kg
                        {lote.cantidad_cajuelas ? ` (${lote.cantidad_cajuelas} cajuelas)` : ""}
                        {lote.proveedor?.nombre ? ` · ${lote.proveedor.nombre}` : ""}
                        {lote.finca?.nombre ? ` · ${lote.finca.nombre}` : ""}
                        {lote.numero_cama_secado ? ` · cama ${lote.numero_cama_secado}` : ""}
                        {lote.perfil_tueste?.nombre ? ` · ${lote.perfil_tueste.nombre}` : ""}
                        {lote.fecha_cosecha ? ` · cosecha ${lote.fecha_cosecha}` : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/inventario/${lote.id}/historial`}
                        className="flex min-h-9 items-center rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 transition-colors hover:bg-zinc-100"
                      >
                        Ver historial
                      </Link>
                    {puedeEscribir && (
                      <>
                        <button
                          onClick={() => {
                            setMostrarForm(false);
                            setProcesandoId(null);
                            setClasificandoId(null);
                            setEditandoId(lote.id);
                          }}
                          className="border-primary/30 text-primary hover:bg-primary-soft min-h-9 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors"
                        >
                          Editar
                        </button>
                        {puedeAvanzar && (
                          <button
                            onClick={() => {
                              setMostrarForm(false);
                              setEditandoId(null);
                              setClasificandoId(null);
                              setEmpacandoId(null);
                              setProcesandoId(lote.id);
                            }}
                            className="min-h-9 rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 transition-colors hover:bg-zinc-100"
                          >
                            {etiquetaBotonProceso(lote.etapa)}
                          </button>
                        )}
                        {enVerdeSinClasificar && (
                          <button
                            onClick={() => {
                              setMostrarForm(false);
                              setEditandoId(null);
                              setProcesandoId(null);
                              setEmpacandoId(null);
                              setClasificandoId(lote.id);
                            }}
                            className="min-h-9 rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 transition-colors hover:bg-zinc-100"
                          >
                            Clasificar calidad
                          </button>
                        )}
                        {enTostadoOMolido && (
                          <button
                            onClick={() => {
                              setMostrarForm(false);
                              setEditandoId(null);
                              setProcesandoId(null);
                              setClasificandoId(null);
                              setEmpacandoId(lote.id);
                            }}
                            className="min-h-9 rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 transition-colors hover:bg-zinc-100"
                          >
                            Empacar
                          </button>
                        )}
                      </>
                    )}
                    {esAdmin && (
                      <button
                        disabled={isPendingEliminar}
                        onClick={() => handleEliminar(lote.id, lote.nombre ?? lote.variedad?.nombre ?? "este lote")}
                        className="min-h-9 rounded-md border border-red-200 px-3 py-1.5 text-sm text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                      >
                        Eliminar
                      </button>
                    )}
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function LoteForm({
  lote,
  variedades,
  proveedores,
  fincas,
  factorCajuela,
  onGuardado,
}: {
  lote?: Lote;
  variedades: Opcion[];
  proveedores: Opcion[];
  fincas: Opcion[];
  factorCajuela: number;
  onGuardado: () => void;
}) {
  const action = lote ? actualizarLote.bind(null, lote.id) : registrarLote;
  const [state, formAction, isPending] = useActionState(action, {});
  const [etapa, setEtapa] = useState<EtapaBase>(
    lote && ETAPAS_BASE.includes(lote.etapa) ? (lote.etapa as EtapaBase) : "cereza",
  );
  const [cajuelas, setCajuelas] = useState(lote?.cantidad_cajuelas ? String(lote.cantidad_cajuelas) : "");

  useEffect(() => {
    if (state && "success" in state) onGuardado();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const pesoEstimado = etapa === "cereza" && cajuelas ? Number(cajuelas) * factorCajuela : null;

  return (
    <form
      action={formAction}
      data-testid={lote ? "form-editar-lote" : "form-registrar-lote"}
      className="space-y-3 border-b border-zinc-100 bg-zinc-50 p-4"
    >
      <div>
        <label htmlFor="nombre" className="mb-1 block text-sm text-zinc-600">
          Nombre del lote (opcional)
        </label>
        <input
          id="nombre"
          name="nombre"
          type="text"
          placeholder="ej. Finca El Mirador — lote 3"
          defaultValue={lote?.nombre ?? ""}
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
        />
      </div>

      <div>
        <label htmlFor="variedad_id" className="mb-1 block text-sm text-zinc-600">
          Variedad
        </label>
        <select
          id="variedad_id"
          name="variedad_id"
          required
          defaultValue={lote?.variedad_id ?? ""}
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
        >
          <option value="" disabled>
            Selecciona una variedad
          </option>
          {variedades.map((v) => (
            <option key={v.id} value={v.id}>
              {v.nombre}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="proveedor_id" className="mb-1 block text-sm text-zinc-600">
          Proveedor (opcional)
        </label>
        <select
          id="proveedor_id"
          name="proveedor_id"
          defaultValue={lote?.proveedor_id ?? ""}
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
        >
          <option value="">Sin proveedor</option>
          {proveedores.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="finca_id" className="mb-1 block text-sm text-zinc-600">
          Finca (opcional)
        </label>
        <select
          id="finca_id"
          name="finca_id"
          defaultValue={lote?.finca_id ?? ""}
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
        >
          <option value="">Sin finca</option>
          {fincas.map((f) => (
            <option key={f.id} value={f.id}>
              {f.nombre}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="numero_cama_secado" className="mb-1 block text-sm text-zinc-600">
          Número de cama de secado (opcional)
        </label>
        <input
          id="numero_cama_secado"
          name="numero_cama_secado"
          type="text"
          defaultValue={lote?.numero_cama_secado ?? ""}
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
        />
      </div>

      <div>
        <label htmlFor="etapa" className="mb-1 block text-sm text-zinc-600">
          {lote ? "Etapa (no se cambia aquí — usa \"Aplicar proceso\")" : "Etapa inicial"}
        </label>
        {lote ? (
          // Un <select disabled> no envía su valor en el submit; se fija con un
          // hidden y se muestra un select solo visual, deshabilitado, aparte.
          <>
            <input type="hidden" name="etapa" value={lote.etapa} />
            <select
              disabled
              value={ETAPAS_BASE.includes(lote.etapa) ? lote.etapa : "cereza"}
              className="w-full rounded-md border border-zinc-300 bg-zinc-100 px-3 py-2 text-sm text-zinc-500"
            >
              <option value="cereza">Cereza</option>
              <option value="pergamino">Pergamino</option>
              <option value="verde">Verde</option>
            </select>
            {!ETAPAS_BASE.includes(lote.etapa) && (
              <p className="mt-1 text-xs text-zinc-500">
                Este lote está en un paso intermedio de beneficiado: {lote.etapa}
              </p>
            )}
          </>
        ) : (
          <select
            id="etapa"
            name="etapa"
            required
            value={etapa}
            onChange={(e) => setEtapa(e.target.value as EtapaBase)}
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
          >
            <option value="cereza">Cereza</option>
            <option value="pergamino">Pergamino</option>
            <option value="verde">Verde</option>
          </select>
        )}
      </div>

      {etapa === "cereza" ? (
        <div>
          <label htmlFor="cantidad_cajuelas" className="mb-1 block text-sm text-zinc-600">
            Cajuelas recibidas
          </label>
          <input
            id="cantidad_cajuelas"
            name="cantidad_cajuelas"
            type="number"
            step="0.1"
            min="0.1"
            required
            value={cajuelas}
            onChange={(e) => setCajuelas(e.target.value)}
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
          />
          <p className="mt-1 text-xs text-zinc-500">
            {pesoEstimado !== null
              ? `≈ ${pesoEstimado.toFixed(2)} kg (${factorCajuela} kg/cajuela)`
              : `Factor actual: ${factorCajuela} kg por cajuela`}
          </p>
        </div>
      ) : (
        <div>
          <label htmlFor="peso_actual_kg" className="mb-1 block text-sm text-zinc-600">
            Peso (kg)
          </label>
          <input
            id="peso_actual_kg"
            name="peso_actual_kg"
            type="number"
            step="0.01"
            min="0.01"
            required
            defaultValue={lote?.peso_actual_kg ?? ""}
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
          />
        </div>
      )}

      <div>
        <label htmlFor="fecha_cosecha" className="mb-1 block text-sm text-zinc-600">
          Fecha de cosecha (opcional)
        </label>
        <input
          id="fecha_cosecha"
          name="fecha_cosecha"
          type="date"
          defaultValue={lote?.fecha_cosecha ?? ""}
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

function ProcesoForm({
  lote,
  esInicioBeneficiado,
  esTrillado,
  esTueste,
  esMolido,
  procesosBeneficiado,
  perfilesTueste,
  onGuardado,
}: {
  lote: Lote;
  esInicioBeneficiado: boolean;
  esTrillado: boolean;
  esTueste: boolean;
  esMolido: boolean;
  procesosBeneficiado: Opcion[];
  perfilesTueste: Opcion[];
  onGuardado: () => void;
}) {
  const action = esTrillado
    ? aplicarTrillado
    : esTueste
      ? aplicarTueste
      : esMolido
        ? aplicarMolido
        : iniciarOAvanzarBeneficiado;
  const [state, formAction, isPending] = useActionState(action, {});

  useEffect(() => {
    if (state && "success" in state) onGuardado();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form
      action={formAction}
      data-testid="form-aplicar-proceso"
      className="space-y-3 rounded-md bg-zinc-50 p-4"
    >
      <input type="hidden" name="lote_origen_id" value={lote.id} />

      <p className="text-sm text-zinc-600">
        {esTrillado
          ? "Trillado: pergamino → verde"
          : esTueste
            ? "Tueste: verde → tostado"
            : esMolido
              ? "Molido: tostado → molido"
              : esInicioBeneficiado
                ? "Iniciar beneficiado"
                : `Continuar beneficiado (paso actual: ${lote.etapa})`}
      </p>

      {esInicioBeneficiado && (
        <div>
          <label htmlFor="proceso_beneficiado_id" className="mb-1 block text-sm text-zinc-600">
            Proceso de beneficiado
          </label>
          <select
            id="proceso_beneficiado_id"
            name="proceso_beneficiado_id"
            required
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
          >
            <option value="" disabled defaultValue="">
              Selecciona un proceso
            </option>
            {procesosBeneficiado.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
        </div>
      )}

      {esTueste && (
        <div>
          <label htmlFor="perfil_tueste_id" className="mb-1 block text-sm text-zinc-600">
            Perfil de tueste
          </label>
          <select
            id="perfil_tueste_id"
            name="perfil_tueste_id"
            required
            defaultValue=""
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
          >
            <option value="" disabled>
              Selecciona un perfil
            </option>
            {perfilesTueste.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label htmlFor="merma_pct" className="mb-1 block text-sm text-zinc-600">
          Merma (%)
        </label>
        <input
          id="merma_pct"
          name="merma_pct"
          type="number"
          step="0.1"
          min="0"
          max="100"
          required
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
        {isPending ? "Aplicando..." : "Aplicar"}
      </button>
    </form>
  );
}

function ClasificarCalidadForm({ lote, onGuardado }: { lote: Lote; onGuardado: () => void }) {
  const [state, formAction, isPending] = useActionState(clasificarCalidadLote, {});

  useEffect(() => {
    if (state && "success" in state) onGuardado();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form
      action={formAction}
      data-testid="form-clasificar-calidad"
      className="space-y-3 rounded-md bg-zinc-50 p-4"
    >
      <input type="hidden" name="lote_origen_id" value={lote.id} />
      <p className="text-sm text-zinc-600">
        Dividir {lote.peso_actual_kg} kg en calidades (la suma no puede exceder el peso disponible):
      </p>

      <div className="grid grid-cols-2 gap-3">
        {(["primera", "segunda", "tercera", "rechazo"] as const).map((calidad) => (
          <div key={calidad}>
            <label htmlFor={`${calidad}_kg`} className="mb-1 block text-sm text-zinc-600">
              {CALIDAD_LABEL[calidad]} (kg)
            </label>
            <input
              id={`${calidad}_kg`}
              name={`${calidad}_kg`}
              type="number"
              step="0.01"
              min="0"
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
            />
          </div>
        ))}
      </div>

      {state && "error" in state && state.error && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="bg-primary hover:bg-primary-dark min-h-10 rounded-md px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50"
      >
        {isPending ? "Clasificando..." : "Clasificar"}
      </button>
    </form>
  );
}

function EmpacarForm({
  lote,
  articulos,
  presentaciones,
  onGuardado,
}: {
  lote: Lote;
  articulos: ArticuloOpcion[];
  presentaciones: PresentacionOpcion[];
  onGuardado: () => void;
}) {
  const [state, formAction, isPending] = useActionState(empacarLote, {});
  const [presentacionId, setPresentacionId] = useState("");
  const [unidades, setUnidades] = useState("");

  useEffect(() => {
    if (state && "success" in state) onGuardado();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const productosTerminados = articulos.filter((a) => a.tipo === "producto_terminado");
  const insumos = articulos.filter((a) => a.tipo === "insumo");
  const presentacionSeleccionada = presentaciones.find((p) => p.id === presentacionId);
  const pesoEstimado =
    presentacionSeleccionada?.peso_gramos && unidades
      ? (Number(unidades) * presentacionSeleccionada.peso_gramos) / 1000
      : null;

  return (
    <form action={formAction} data-testid="form-empacar" className="space-y-3 rounded-md bg-zinc-50 p-4">
      <input type="hidden" name="lote_origen_id" value={lote.id} />
      <p className="text-sm text-zinc-600">Empacar desde {lote.peso_actual_kg} kg disponibles:</p>

      <div>
        <label htmlFor="articulo_id" className="mb-1 block text-sm text-zinc-600">
          Producto terminado
        </label>
        <select
          id="articulo_id"
          name="articulo_id"
          required
          defaultValue=""
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
        >
          <option value="" disabled>
            {productosTerminados.length === 0 ? "No hay productos terminados en el catálogo" : "Selecciona un producto"}
          </option>
          {productosTerminados.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nombre}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="presentacion_id" className="mb-1 block text-sm text-zinc-600">
          Presentación
        </label>
        <select
          id="presentacion_id"
          name="presentacion_id"
          required
          value={presentacionId}
          onChange={(e) => setPresentacionId(e.target.value)}
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
        >
          <option value="" disabled>
            Selecciona una presentación
          </option>
          {presentaciones.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
              {p.peso_gramos ? ` (${p.peso_gramos} g)` : ""}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="unidades" className="mb-1 block text-sm text-zinc-600">
          Unidades a empacar
        </label>
        <input
          id="unidades"
          name="unidades"
          type="number"
          step="1"
          min="1"
          required
          value={unidades}
          onChange={(e) => setUnidades(e.target.value)}
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
        />
        {pesoEstimado !== null && (
          <p className="mt-1 text-xs text-zinc-500">≈ {pesoEstimado.toFixed(2)} kg del lote</p>
        )}
      </div>

      <div>
        <label htmlFor="insumo_articulo_id" className="mb-1 block text-sm text-zinc-600">
          Insumo de empaque (opcional)
        </label>
        <select
          id="insumo_articulo_id"
          name="insumo_articulo_id"
          defaultValue=""
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
        >
          <option value="">Sin insumo</option>
          {insumos.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nombre}
            </option>
          ))}
        </select>
      </div>

      {state && "error" in state && state.error && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="bg-primary hover:bg-primary-dark min-h-10 rounded-md px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50"
      >
        {isPending ? "Empacando..." : "Empacar"}
      </button>
    </form>
  );
}

function FactorCajuelaControl({ factorActual }: { factorActual: number }) {
  const [editando, setEditando] = useState(false);
  const [state, formAction, isPending] = useActionState(actualizarFactorCajuela, {});

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- cierra el form tras un submit exitoso
    if (state && "success" in state) setEditando(false);
  }, [state]);

  if (!editando) {
    return (
      <div
        data-testid="factor-cajuela"
        className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-3 text-sm"
      >
        <span className="text-zinc-600">
          Factor cajuela: <span className="font-medium text-zinc-900">{factorActual} kg</span>
        </span>
        <button
          onClick={() => setEditando(true)}
          className="text-primary text-sm font-medium hover:underline"
        >
          Ajustar
        </button>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      data-testid="factor-cajuela"
      className="flex flex-wrap items-end gap-2 rounded-lg border border-zinc-200 bg-white p-3"
    >
      <div>
        <label htmlFor="factor_kg_por_cajuela" className="mb-1 block text-sm text-zinc-600">
          Kg por cajuela
        </label>
        <input
          id="factor_kg_por_cajuela"
          name="factor_kg_por_cajuela"
          type="number"
          step="0.01"
          min="0.01"
          required
          defaultValue={factorActual}
          className="w-32 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="bg-primary hover:bg-primary-dark min-h-10 rounded-md px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        Guardar
      </button>
      <button
        type="button"
        onClick={() => setEditando(false)}
        className="min-h-10 rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100"
      >
        Cancelar
      </button>
      {state && "error" in state && state.error && (
        <p className="w-full text-sm text-red-600">{state.error}</p>
      )}
    </form>
  );
}
