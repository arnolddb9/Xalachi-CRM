"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import "./md3-theme.css";
import { Md3Button } from "@/components/md3/button";
import { Md3Card } from "@/components/md3/card";
import { Md3Chip, Md3ChipSet } from "@/components/md3/chip";
import { Md3Tabs } from "@/components/md3/tabs";
import { Md3TextField } from "@/components/md3/text-field";
import { Md3Select } from "@/components/md3/select";
import { formatoMoneda } from "@/lib/moneda";
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
  ajustarStockArticulo,
  actualizarPrecioArticulo,
} from "./actions";

type Opcion = { id: string; nombre: string };
type ArticuloOpcion = { id: string; nombre: string; tipo: string };
type PresentacionOpcion = { id: string; nombre: string; peso_gramos: number | null };

type EtapaBase = "cereza" | "pergamino" | "verde";
const ETAPAS_BASE: readonly string[] = ["cereza", "pergamino", "verde"];
const ETAPA_LABEL: Record<EtapaBase, string> = { cereza: "Cereza", pergamino: "Pergamino", verde: "Verde" };
const ETAPA_LABEL_EXTRA: Record<string, string> = { tostado: "Tostado", molido: "Molido" };
const CALIDAD_LABEL: Record<string, string> = {
  primera: "Primera",
  segunda: "Segunda",
  tercera: "Tercera",
  rechazo: "Rechazo",
};
const TIPO_ARTICULO_LABEL: Record<string, string> = { insumo: "Insumo", producto_terminado: "Producto terminado" };

function etiquetaEtapa(etapa: string) {
  if (ETAPAS_BASE.includes(etapa)) return ETAPA_LABEL[etapa as EtapaBase];
  return ETAPA_LABEL_EXTRA[etapa] ?? etapa;
}
function etiquetaBotonProceso(etapa: string) {
  if (etapa === "verde") return "Tostar";
  if (etapa === "tostado") return "Moler";
  return "Aplicar proceso";
}

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
type Articulo = {
  id: string;
  nombre: string;
  tipo: string;
  unidad_medida: string;
  stock_actual: number;
  precio_venta: number;
};
type ValoresFiltro = {
  finca_id: string;
  variedad_id: string;
  proceso_beneficiado_id: string;
  proveedor_id: string;
  etapa: string;
  desde: string;
  hasta: string;
};

export type InventarioMd3Props = {
  lotes: Lote[];
  resumenPorEtapa: { etiqueta: string; totalKg: number }[];
  variedades: Opcion[];
  proveedores: Opcion[];
  fincas: Opcion[];
  procesosBeneficiado: Opcion[];
  perfilesTueste: Opcion[];
  articulos: Articulo[];
  presentaciones: PresentacionOpcion[];
  factorCajuela: number;
  puedeEscribir: boolean;
  esAdmin: boolean;
  valoresFiltroIniciales: ValoresFiltro;
};

export function InventarioMd3Vista(props: InventarioMd3Props) {
  const { articulos } = props;
  const [tab, setTab] = useState<"lotes" | "insumos" | "productos">("lotes");
  const insumos = articulos.filter((a) => a.tipo === "insumo");
  const productos = articulos.filter((a) => a.tipo === "producto_terminado");

  return (
    <div className="md3-scope space-y-4 rounded-2xl p-4">
      <h1 className="text-2xl font-medium">Inventario</h1>

      <Md3Tabs
        activo={tab}
        onCambiar={(id) => setTab(id as typeof tab)}
        tabs={[
          { id: "lotes", label: "Inventario y lotes" },
          { id: "insumos", label: "Insumos" },
          { id: "productos", label: "Productos" },
        ]}
      />

      {tab === "lotes" && <TabLotes {...props} />}
      {tab === "insumos" && (
        <TabArticulos articulos={insumos} puedeEscribir={props.puedeEscribir} titulo="Insumos" />
      )}
      {tab === "productos" && (
        <TabArticulos articulos={productos} puedeEscribir={props.puedeEscribir} titulo="Productos terminados" />
      )}
    </div>
  );
}

function TabLotes({
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
  valoresFiltroIniciales,
}: InventarioMd3Props) {
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [procesandoId, setProcesandoId] = useState<string | null>(null);
  const [clasificandoId, setClasificandoId] = useState<string | null>(null);
  const [empacandoId, setEmpacandoId] = useState<string | null>(null);
  const [isPendingEliminar, startTransitionEliminar] = useTransition();
  const [errorEliminar, setErrorEliminar] = useState<string | null>(null);

  function handleEliminar(id: string, nombre: string) {
    if (!window.confirm(`¿Eliminar el lote "${nombre}" definitivamente? Esta acción no se puede deshacer.`)) return;
    setErrorEliminar(null);
    startTransitionEliminar(async () => {
      const resultado = await eliminarLote(id);
      if ("error" in resultado && resultado.error) setErrorEliminar(resultado.error);
    });
  }

  return (
    <div className="space-y-4">
      <FiltrosLotesMd3
        variedades={variedades}
        proveedores={proveedores}
        fincas={fincas}
        procesosBeneficiado={procesosBeneficiado}
        valoresIniciales={valoresFiltroIniciales}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {resumenPorEtapa.map((r) => (
          <Md3Card key={r.etiqueta} style={{ padding: 12, textAlign: "center" }}>
            <p className="text-xs" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
              {r.etiqueta}
            </p>
            <p className="text-lg font-semibold" style={{ color: "var(--md-sys-color-primary)" }}>
              {r.totalKg.toFixed(1)} kg
            </p>
          </Md3Card>
        ))}
      </div>

      {esAdmin && <FactorCajuelaControl factorActual={factorCajuela} />}

      {errorEliminar && (
        <p
          className="rounded-xl p-3 text-sm"
          style={{
            border: "1px solid var(--md-sys-color-error-container)",
            background: "color-mix(in srgb, var(--md-sys-color-error-container) 50%, transparent)",
            color: "var(--md-sys-color-error)",
          }}
        >
          {errorEliminar}
        </p>
      )}

      <Md3Card>
        <div
          className="flex flex-wrap items-center justify-between gap-2 p-4"
          style={{ borderBottom: "1px solid var(--md-sys-color-outline-variant)" }}
        >
          <h2 className="text-sm font-semibold">Lotes activos</h2>
          {puedeEscribir && (
            <Md3Button
              variant={mostrarForm ? "outlined" : "filled"}
              onClick={() => {
                setEditandoId(null);
                setMostrarForm((v) => !v);
              }}
              minWidth={130}
            >
              {mostrarForm ? "Cancelar" : "Registrar lote"}
            </Md3Button>
          )}
        </div>

        {mostrarForm && (
          <div className="p-4" style={{ borderBottom: "1px solid var(--md-sys-color-outline-variant)" }}>
            <LoteForm
              variedades={variedades}
              proveedores={proveedores}
              fincas={fincas}
              factorCajuela={factorCajuela}
              onGuardado={() => setMostrarForm(false)}
            />
          </div>
        )}

        <div>
          {lotes.length === 0 && <p className="p-4 text-sm">Sin lotes activos.</p>}
          {lotes.map((lote) => {
            const enPergamino = lote.etapa === "pergamino";
            const enVerde = lote.etapa === "verde";
            const enVerdeSinClasificar = enVerde && !lote.calidad;
            const enTostadoOMolido = lote.etapa === "tostado" || lote.etapa === "molido";
            const puedeAvanzar = lote.etapa !== "molido";

            return (
              <div
                key={lote.id}
                data-testid="fila-lote"
                className="p-4"
                style={{ borderBottom: "1px solid var(--md-sys-color-outline-variant)" }}
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
                      <p className="mb-1 text-sm font-medium">{lote.nombre ?? lote.variedad?.nombre ?? "—"}</p>
                      <Md3ChipSet>
                        <Md3Chip label={etiquetaEtapa(lote.etapa)} />
                        {lote.calidad && <Md3Chip label={CALIDAD_LABEL[lote.calidad] ?? lote.calidad} />}
                      </Md3ChipSet>
                      <p className="mt-1 text-xs" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
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
                      <Link href={`/inventario/${lote.id}/historial`}>
                        <Md3Button variant="text" minWidth={110}>
                          Ver historial
                        </Md3Button>
                      </Link>
                      {puedeEscribir && (
                        <>
                          <Md3Button
                            variant="outlined"
                            minWidth={90}
                            onClick={() => {
                              setMostrarForm(false);
                              setProcesandoId(null);
                              setClasificandoId(null);
                              setEditandoId(lote.id);
                            }}
                          >
                            Editar
                          </Md3Button>
                          {puedeAvanzar && (
                            <Md3Button
                              variant="outlined"
                              minWidth={110}
                              onClick={() => {
                                setMostrarForm(false);
                                setEditandoId(null);
                                setClasificandoId(null);
                                setEmpacandoId(null);
                                setProcesandoId(lote.id);
                              }}
                            >
                              {etiquetaBotonProceso(lote.etapa)}
                            </Md3Button>
                          )}
                          {enVerdeSinClasificar && (
                            <Md3Button
                              variant="outlined"
                              minWidth={140}
                              onClick={() => {
                                setMostrarForm(false);
                                setEditandoId(null);
                                setProcesandoId(null);
                                setEmpacandoId(null);
                                setClasificandoId(lote.id);
                              }}
                            >
                              Clasificar calidad
                            </Md3Button>
                          )}
                          {enTostadoOMolido && (
                            <Md3Button
                              variant="outlined"
                              minWidth={100}
                              onClick={() => {
                                setMostrarForm(false);
                                setEditandoId(null);
                                setProcesandoId(null);
                                setClasificandoId(null);
                                setEmpacandoId(lote.id);
                              }}
                            >
                              Empacar
                            </Md3Button>
                          )}
                        </>
                      )}
                      {esAdmin && (
                        <Md3Button
                          variant="outlined"
                          minWidth={100}
                          disabled={isPendingEliminar}
                          onClick={() => handleEliminar(lote.id, lote.nombre ?? lote.variedad?.nombre ?? "este lote")}
                        >
                          Eliminar
                        </Md3Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Md3Card>
    </div>
  );
}

function FiltrosLotesMd3({
  variedades,
  proveedores,
  fincas,
  procesosBeneficiado,
  valoresIniciales,
}: {
  variedades: Opcion[];
  proveedores: Opcion[];
  fincas: Opcion[];
  procesosBeneficiado: Opcion[];
  valoresIniciales: ValoresFiltro;
}) {
  const router = useRouter();
  const [valores, setValores] = useState(valoresIniciales);
  const hayFiltrosActivos = Object.values(valoresIniciales).some((v) => v !== "");

  function actualizar<K extends keyof ValoresFiltro>(campo: K, valor: string) {
    setValores((v) => ({ ...v, [campo]: valor }));
  }
  function aplicar() {
    const params = new URLSearchParams();
    for (const [clave, valor] of Object.entries(valores)) if (valor) params.set(clave, valor);
    const query = params.toString();
    router.push(query ? `/inventario?${query}` : "/inventario");
  }
  function limpiar() {
    setValores({
      finca_id: "",
      variedad_id: "",
      proceso_beneficiado_id: "",
      proveedor_id: "",
      etapa: "",
      desde: "",
      hasta: "",
    });
    router.push("/inventario");
  }

  return (
    <Md3Card testId="filtros-lotes" style={{ padding: 16 }}>
      <div className="flex flex-wrap gap-3">
        <Md3Select
          label="Finca"
          value={valores.finca_id}
          onValueChange={(v) => actualizar("finca_id", v)}
          placeholder="Todas las fincas"
          opciones={fincas.map((f) => ({ value: f.id, label: f.nombre }))}
        />
        <Md3Select
          label="Variedad"
          value={valores.variedad_id}
          onValueChange={(v) => actualizar("variedad_id", v)}
          placeholder="Todas las variedades"
          opciones={variedades.map((v) => ({ value: v.id, label: v.nombre }))}
        />
        <Md3Select
          label="Proceso de beneficiado"
          value={valores.proceso_beneficiado_id}
          onValueChange={(v) => actualizar("proceso_beneficiado_id", v)}
          placeholder="Todos los procesos"
          opciones={procesosBeneficiado.map((p) => ({ value: p.id, label: p.nombre }))}
        />
        <Md3Select
          label="Proveedor"
          value={valores.proveedor_id}
          onValueChange={(v) => actualizar("proveedor_id", v)}
          placeholder="Todos los proveedores"
          opciones={proveedores.map((p) => ({ value: p.id, label: p.nombre }))}
        />
        <Md3Select
          label="Etapa"
          value={valores.etapa}
          onValueChange={(v) => actualizar("etapa", v)}
          placeholder="Todas las etapas"
          opciones={[
            { value: "cereza", label: "Cereza" },
            { value: "pergamino", label: "Pergamino" },
            { value: "verde", label: "Verde" },
            { value: "tostado", label: "Tostado" },
            { value: "molido", label: "Molido" },
          ]}
        />
        <Md3TextField label="Cosecha desde" type="date" value={valores.desde} onValueChange={(v) => actualizar("desde", v)} />
        <Md3TextField label="Cosecha hasta" type="date" value={valores.hasta} onValueChange={(v) => actualizar("hasta", v)} />
        <Md3Button onClick={aplicar} minWidth={110}>
          Filtrar
        </Md3Button>
        {hayFiltrosActivos && (
          <Md3Button variant="outlined" onClick={limpiar} minWidth={110}>
            Limpiar
          </Md3Button>
        )}
      </div>
    </Md3Card>
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
    <form action={formAction} data-testid={lote ? "form-editar-lote" : "form-registrar-lote"} className="space-y-3">
      <div className="flex flex-wrap gap-3">
        <Md3TextField
          label="Nombre del lote (opcional)"
          name="nombre"
          defaultValue={lote?.nombre ?? ""}
          placeholder="ej. Finca El Mirador — lote 3"
          style={{ minWidth: 260 }}
        />
        {lote && <input type="hidden" name="variedad_id" defaultValue={lote.variedad_id} />}
        <Md3Select
          label="Variedad"
          name={lote ? undefined : "variedad_id"}
          required
          defaultValue={lote?.variedad_id ?? ""}
          placeholder="Selecciona una variedad"
          opciones={variedades.map((v) => ({ value: v.id, label: v.nombre }))}
        />
        <Md3Select
          label="Proveedor (opcional)"
          name="proveedor_id"
          defaultValue={lote?.proveedor_id ?? ""}
          placeholder="Sin proveedor"
          opciones={proveedores.map((p) => ({ value: p.id, label: p.nombre }))}
        />
        <Md3Select
          label="Finca (opcional)"
          name="finca_id"
          defaultValue={lote?.finca_id ?? ""}
          placeholder="Sin finca"
          opciones={fincas.map((f) => ({ value: f.id, label: f.nombre }))}
        />
        <Md3TextField label="Número de cama de secado (opcional)" name="numero_cama_secado" defaultValue={lote?.numero_cama_secado ?? ""} />

        {lote ? (
          <>
            <input type="hidden" name="etapa" defaultValue={lote.etapa} />
            <Md3Select
              label='Etapa (no se cambia aquí — usa "Aplicar proceso")'
              value={ETAPAS_BASE.includes(lote.etapa) ? lote.etapa : "cereza"}
              onValueChange={() => {}}
              opciones={[
                { value: "cereza", label: "Cereza" },
                { value: "pergamino", label: "Pergamino" },
                { value: "verde", label: "Verde" },
              ]}
            />
          </>
        ) : (
          <Md3Select
            label="Etapa inicial"
            name="etapa"
            required
            value={etapa}
            onValueChange={(v) => setEtapa(v as EtapaBase)}
            opciones={[
              { value: "cereza", label: "Cereza" },
              { value: "pergamino", label: "Pergamino" },
              { value: "verde", label: "Verde" },
            ]}
          />
        )}

        {etapa === "cereza" ? (
          <Md3TextField
            label="Cajuelas recibidas"
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
        ) : (
          <Md3TextField label="Peso (kg)" name="peso_actual_kg" type="number" step="0.01" min="0.01" required defaultValue={lote?.peso_actual_kg ?? ""} />
        )}

        <Md3TextField label="Fecha de cosecha (opcional)" name="fecha_cosecha" type="date" defaultValue={lote?.fecha_cosecha ?? ""} />
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
  const action = esTrillado ? aplicarTrillado : esTueste ? aplicarTueste : esMolido ? aplicarMolido : iniciarOAvanzarBeneficiado;
  const [state, formAction, isPending] = useActionState(action, {});

  useEffect(() => {
    if (state && "success" in state) onGuardado();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} data-testid="form-aplicar-proceso" className="space-y-3">
      <input type="hidden" name="lote_origen_id" value={lote.id} />
      <p className="text-sm">
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

      <div className="flex flex-wrap gap-3">
        {esInicioBeneficiado && (
          <Md3Select
            label="Proceso de beneficiado"
            name="proceso_beneficiado_id"
            required
            placeholder="Selecciona un proceso"
            opciones={procesosBeneficiado.map((p) => ({ value: p.id, label: p.nombre }))}
          />
        )}
        {esTueste && (
          <Md3Select
            label="Perfil de tueste"
            name="perfil_tueste_id"
            required
            placeholder="Selecciona un perfil"
            opciones={perfilesTueste.map((p) => ({ value: p.id, label: p.nombre }))}
          />
        )}
        {(esTueste || esMolido) && (
          <Md3TextField
            label={esTueste ? "Cantidad a tostar (kg)" : "Cantidad a moler (kg)"}
            name="kg_a_procesar"
            type="number"
            step="0.01"
            min="0.01"
            max={lote.peso_actual_kg}
            required
            defaultValue={lote.peso_actual_kg}
            supportingText={`Disponible: ${lote.peso_actual_kg} kg — puedes procesar solo una parte.`}
          />
        )}
        <Md3TextField label="Merma (%)" name="merma_pct" type="number" step="0.1" min="0" max="100" required />
      </div>

      {state && "error" in state && state.error && (
        <p className="text-sm" style={{ color: "var(--md-sys-color-error)" }}>
          {state.error}
        </p>
      )}

      <Md3Button type="submit" disabled={isPending} minWidth={110}>
        {isPending ? "Aplicando..." : "Aplicar"}
      </Md3Button>
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
    <form action={formAction} data-testid="form-clasificar-calidad" className="space-y-3">
      <input type="hidden" name="lote_origen_id" value={lote.id} />
      <p className="text-sm">Dividir {lote.peso_actual_kg} kg en calidades (la suma no puede exceder el peso disponible):</p>
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
      <Md3Button type="submit" disabled={isPending} minWidth={120}>
        {isPending ? "Clasificando..." : "Clasificar"}
      </Md3Button>
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
    presentacionSeleccionada?.peso_gramos && unidades ? (Number(unidades) * presentacionSeleccionada.peso_gramos) / 1000 : null;

  return (
    <form action={formAction} data-testid="form-empacar" className="space-y-3">
      <input type="hidden" name="lote_origen_id" value={lote.id} />
      <p className="text-sm">Empacar desde {lote.peso_actual_kg} kg disponibles:</p>
      <div className="flex flex-wrap gap-3">
        <Md3Select
          label="Producto terminado"
          name="articulo_id"
          required
          placeholder={productosTerminados.length === 0 ? "No hay productos terminados en el catálogo" : "Selecciona un producto"}
          opciones={productosTerminados.map((a) => ({ value: a.id, label: a.nombre }))}
        />
        <Md3Select
          label="Presentación"
          name="presentacion_id"
          required
          value={presentacionId}
          onValueChange={setPresentacionId}
          placeholder="Selecciona una presentación"
          opciones={presentaciones.map((p) => ({ value: p.id, label: p.peso_gramos ? `${p.nombre} (${p.peso_gramos} g)` : p.nombre }))}
        />
        <Md3TextField
          label="Unidades a empacar"
          name="unidades"
          type="number"
          step="1"
          min="1"
          required
          value={unidades}
          onValueChange={setUnidades}
          supportingText={pesoEstimado !== null ? `≈ ${pesoEstimado.toFixed(2)} kg del lote` : undefined}
        />
        <Md3Select label="Insumo de empaque (opcional)" name="insumo_articulo_id" placeholder="Sin insumo" opciones={insumos.map((a) => ({ value: a.id, label: a.nombre }))} />
      </div>
      {state && "error" in state && state.error && (
        <p className="text-sm" style={{ color: "var(--md-sys-color-error)" }}>
          {state.error}
        </p>
      )}
      <Md3Button type="submit" disabled={isPending} minWidth={110}>
        {isPending ? "Empacando..." : "Empacar"}
      </Md3Button>
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
      <Md3Card testId="factor-cajuela" style={{ padding: 12 }}>
        <div className="flex items-center justify-between text-sm">
          <span>
            Factor cajuela: <span className="font-medium">{factorActual} kg</span>
          </span>
          <Md3Button variant="text" minWidth={80} onClick={() => setEditando(true)}>
            Ajustar
          </Md3Button>
        </div>
      </Md3Card>
    );
  }

  return (
    <Md3Card testId="factor-cajuela" style={{ padding: 12 }}>
      <form action={formAction} className="flex flex-wrap items-end gap-2">
        <Md3TextField label="Kg por cajuela" name="factor_kg_por_cajuela" type="number" step="0.01" min="0.01" required defaultValue={factorActual} minWidth={120} />
        <Md3Button type="submit" disabled={isPending} minWidth={100}>
          Guardar
        </Md3Button>
        <Md3Button type="button" variant="outlined" minWidth={100} onClick={() => setEditando(false)}>
          Cancelar
        </Md3Button>
        {state && "error" in state && state.error && (
          <p className="w-full text-sm" style={{ color: "var(--md-sys-color-error)" }}>
            {state.error}
          </p>
        )}
      </form>
    </Md3Card>
  );
}

function TabArticulos({ articulos, puedeEscribir, titulo }: { articulos: Articulo[]; puedeEscribir: boolean; titulo: string }) {
  const [ajustandoId, setAjustandoId] = useState<string | null>(null);
  const [editandoPrecioId, setEditandoPrecioId] = useState<string | null>(null);

  return (
    <Md3Card>
      <div className="p-4" style={{ borderBottom: "1px solid var(--md-sys-color-outline-variant)" }}>
        <h2 className="text-sm font-semibold">{titulo}</h2>
      </div>
      <div>
        {articulos.length === 0 && (
          <p className="p-4 text-sm">Sin artículos registrados. Se dan de alta en Catálogos → Insumos y productos.</p>
        )}
        {articulos.map((articulo) => (
          <div
            key={articulo.id}
            data-testid="fila-articulo"
            className="p-4"
            style={{ borderBottom: "1px solid var(--md-sys-color-outline-variant)" }}
          >
            {ajustandoId === articulo.id ? (
              <AjustarStockForm articulo={articulo} onGuardado={() => setAjustandoId(null)} />
            ) : editandoPrecioId === articulo.id ? (
              <EditarPrecioForm articulo={articulo} onGuardado={() => setEditandoPrecioId(null)} />
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="mb-1 text-sm font-medium">
                    {articulo.nombre} <Md3Chip label={TIPO_ARTICULO_LABEL[articulo.tipo] ?? articulo.tipo} />
                  </p>
                  <p className="text-xs" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
                    {articulo.stock_actual} {articulo.unidad_medida}
                    {articulo.tipo === "producto_terminado" ? ` · ${formatoMoneda(articulo.precio_venta)}` : ""}
                  </p>
                </div>
                {puedeEscribir && (
                  <div className="flex flex-wrap gap-2">
                    {articulo.tipo === "producto_terminado" && (
                      <Md3Button variant="outlined" minWidth={130} onClick={() => setEditandoPrecioId(articulo.id)}>
                        Editar precio
                      </Md3Button>
                    )}
                    <Md3Button variant="outlined" minWidth={150} onClick={() => setAjustandoId(articulo.id)}>
                      Ajustar existencias
                    </Md3Button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </Md3Card>
  );
}

function AjustarStockForm({ articulo, onGuardado }: { articulo: Articulo; onGuardado: () => void }) {
  const [state, formAction, isPending] = useActionState(ajustarStockArticulo, {});

  useEffect(() => {
    if (state && "success" in state) onGuardado();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} data-testid="form-ajustar-stock" className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="articulo_id" value={articulo.id} />
      <Md3TextField
        label={`Nuevo stock de ${articulo.nombre} (${articulo.unidad_medida})`}
        name="stock_nuevo"
        type="number"
        step="0.01"
        min="0"
        required
        defaultValue={articulo.stock_actual}
        minWidth={140}
      />
      <Md3Button type="submit" disabled={isPending} minWidth={100}>
        Guardar
      </Md3Button>
      <Md3Button type="button" variant="outlined" minWidth={100} onClick={onGuardado}>
        Cancelar
      </Md3Button>
      {state && "error" in state && state.error && (
        <p className="w-full text-sm" style={{ color: "var(--md-sys-color-error)" }}>
          {state.error}
        </p>
      )}
    </form>
  );
}

function EditarPrecioForm({ articulo, onGuardado }: { articulo: Articulo; onGuardado: () => void }) {
  const [state, formAction, isPending] = useActionState(actualizarPrecioArticulo, {});

  useEffect(() => {
    if (state && "success" in state) onGuardado();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} data-testid="form-editar-precio" className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="articulo_id" value={articulo.id} />
      <Md3TextField
        label={`Precio de venta de ${articulo.nombre} (₡)`}
        name="precio_nuevo"
        type="number"
        step="0.01"
        min="0"
        required
        defaultValue={articulo.precio_venta}
        minWidth={140}
      />
      <Md3Button type="submit" disabled={isPending} minWidth={100}>
        Guardar
      </Md3Button>
      <Md3Button type="button" variant="outlined" minWidth={100} onClick={onGuardado}>
        Cancelar
      </Md3Button>
      {state && "error" in state && state.error && (
        <p className="w-full text-sm" style={{ color: "var(--md-sys-color-error)" }}>
          {state.error}
        </p>
      )}
    </form>
  );
}
