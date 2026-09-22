"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import "@/features/inventario/md3-theme.css";
import { Md3Button } from "@/components/md3/button";
import { Md3Card } from "@/components/md3/card";
import { Md3Chip } from "@/components/md3/chip";
import { Md3TextField, Md3Textarea } from "@/components/md3/text-field";
import { Md3Select } from "@/components/md3/select";
import { registrarCompraLote, registrarCompraArticulo, actualizarCompra, eliminarCompra } from "./actions";
import { formatoMoneda } from "@/lib/moneda";

type Opcion = { id: string; nombre: string };
type ArticuloOpcion = { id: string; nombre: string; tipo: string };

const ETAPA_LABEL: Record<string, string> = { cereza: "Cereza", pergamino: "Pergamino", verde: "Verde" };
const TIPO_COMPRA_LABEL: Record<string, string> = {
  lote: "Lote de café",
  insumo: "Insumo",
  producto_terminado: "Producto terminado",
};

type Compra = {
  id: string;
  tipo_compra: string;
  fecha_compra: string;
  costo_total: number | null;
  numero_factura: string | null;
  notas: string | null;
  cantidad: number | null;
  proveedor: { nombre: string } | null;
  lote: { id: string; nombre: string | null; etapa: string; peso_actual_kg: number; variedad: { nombre: string } | null } | null;
  articulo: { nombre: string; unidad_medida: string } | null;
};

export type ComprasMd3Props = {
  compras: Compra[];
  variedades: Opcion[];
  proveedores: Opcion[];
  fincas: Opcion[];
  articulos: ArticuloOpcion[];
  factorCajuela: number;
  esAdmin: boolean;
};

export function ComprasMd3Vista({ compras, variedades, proveedores, fincas, articulos, factorCajuela, esAdmin }: ComprasMd3Props) {
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [errorEliminar, setErrorEliminar] = useState<string | null>(null);

  async function handleEliminar(id: string, etiqueta: string) {
    if (!window.confirm(`¿Eliminar la compra "${etiqueta}" definitivamente? Esta acción no se puede deshacer.`)) return;
    setErrorEliminar(null);
    const resultado = await eliminarCompra(id);
    if ("error" in resultado && resultado.error) setErrorEliminar(resultado.error);
  }

  return (
    <div className="md3-scope space-y-4 rounded-2xl p-4">
      <h1 className="text-2xl font-medium">Compras</h1>

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
          <h2 className="text-sm font-semibold">Compras registradas</h2>
          {esAdmin && (
            <Md3Button
              variant={mostrarForm ? "outlined" : "filled"}
              minWidth={140}
              onClick={() => {
                setEditandoId(null);
                setMostrarForm((v) => !v);
              }}
            >
              {mostrarForm ? "Cancelar" : "Registrar compra"}
            </Md3Button>
          )}
        </div>

        {mostrarForm && (
          <div className="p-4" style={{ borderBottom: "1px solid var(--md-sys-color-outline-variant)" }}>
            <RegistrarCompraForm
              variedades={variedades}
              proveedores={proveedores}
              fincas={fincas}
              articulos={articulos}
              factorCajuela={factorCajuela}
              onGuardado={() => setMostrarForm(false)}
            />
          </div>
        )}

        <div>
          {compras.length === 0 && <p className="p-4 text-sm">Sin compras registradas.</p>}
          {compras.map((compra) => {
            const esLote = compra.tipo_compra === "lote";
            const etiqueta = esLote ? (compra.lote?.nombre ?? compra.lote?.variedad?.nombre ?? "compra") : (compra.articulo?.nombre ?? "compra");
            return (
              <div
                key={compra.id}
                data-testid="fila-compra"
                className="p-4"
                style={{ borderBottom: "1px solid var(--md-sys-color-outline-variant)" }}
              >
                {editandoId === compra.id ? (
                  <EditarCompraForm compra={compra} onGuardado={() => setEditandoId(null)} />
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="mb-1 text-sm font-medium">
                        {compra.proveedor?.nombre ?? "Sin proveedor"}{" "}
                        <Md3Chip label={esLote && compra.lote ? (ETAPA_LABEL[compra.lote.etapa] ?? compra.lote.etapa) : TIPO_COMPRA_LABEL[compra.tipo_compra]} />
                      </p>
                      {esLote ? (
                        <p className="text-xs" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
                          {compra.lote?.nombre ?? compra.lote?.variedad?.nombre ?? "—"}
                          {compra.lote ? ` · ${compra.lote.peso_actual_kg} kg` : ""}
                          {compra.costo_total !== null ? ` · ${formatoMoneda(compra.costo_total)}` : ""}
                          {compra.numero_factura ? ` · folio ${compra.numero_factura}` : ""}
                          {` · compra ${compra.fecha_compra}`}
                        </p>
                      ) : (
                        <p className="text-xs" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
                          {compra.articulo?.nombre ?? "—"}
                          {compra.cantidad !== null ? ` · ${compra.cantidad} ${compra.articulo?.unidad_medida ?? ""}` : ""}
                          {compra.costo_total !== null ? ` · ${formatoMoneda(compra.costo_total)}` : ""}
                          {compra.numero_factura ? ` · folio ${compra.numero_factura}` : ""}
                          {` · compra ${compra.fecha_compra}`}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {esLote && compra.lote && (
                        <Link href={`/inventario/${compra.lote.id}/historial`}>
                          <Md3Button variant="text" minWidth={80}>
                            Ver lote
                          </Md3Button>
                        </Link>
                      )}
                      {esAdmin && (
                        <>
                          <Md3Button
                            variant="outlined"
                            minWidth={90}
                            onClick={() => {
                              setMostrarForm(false);
                              setEditandoId(compra.id);
                            }}
                          >
                            Editar
                          </Md3Button>
                          <Md3Button variant="outlined" minWidth={100} onClick={() => handleEliminar(compra.id, etiqueta)}>
                            Eliminar
                          </Md3Button>
                        </>
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

type TipoCompra = "lote" | "insumo" | "producto_terminado";

function RegistrarCompraForm({
  variedades,
  proveedores,
  fincas,
  articulos,
  factorCajuela,
  onGuardado,
}: {
  variedades: Opcion[];
  proveedores: Opcion[];
  fincas: Opcion[];
  articulos: ArticuloOpcion[];
  factorCajuela: number;
  onGuardado: () => void;
}) {
  const [tipoCompra, setTipoCompra] = useState<TipoCompra>("lote");

  return (
    <div className="space-y-3">
      <Md3Select
        label="Tipo de compra"
        name="tipo_compra_ui"
        value={tipoCompra}
        onValueChange={(v) => setTipoCompra(v as TipoCompra)}
        opciones={[
          { value: "lote", label: "Lote de café" },
          { value: "insumo", label: "Insumo" },
          { value: "producto_terminado", label: "Producto terminado" },
        ]}
        style={{ minWidth: 220 }}
      />

      {tipoCompra === "lote" ? (
        <RegistrarCompraLoteForm variedades={variedades} proveedores={proveedores} fincas={fincas} factorCajuela={factorCajuela} onGuardado={onGuardado} />
      ) : (
        <RegistrarCompraArticuloForm proveedores={proveedores} articulos={articulos.filter((a) => a.tipo === tipoCompra)} onGuardado={onGuardado} />
      )}
    </div>
  );
}

function CamposComerciales({ hoy }: { hoy: string }) {
  return (
    <>
      <Md3TextField label="Fecha de compra" name="fecha_compra" type="date" defaultValue={hoy} />
      <Md3TextField label="Costo total (opcional)" name="costo_total" type="number" step="0.01" min="0" />
      <Md3TextField label="Folio / factura (opcional)" name="numero_factura" />
      <Md3Textarea label="Notas (opcional)" name="notas" />
    </>
  );
}

function RegistrarCompraLoteForm({
  variedades,
  proveedores,
  fincas,
  factorCajuela,
  onGuardado,
}: {
  variedades: Opcion[];
  proveedores: Opcion[];
  fincas: Opcion[];
  factorCajuela: number;
  onGuardado: () => void;
}) {
  const [state, formAction, isPending] = useActionState(registrarCompraLote, {});
  const [etapa, setEtapa] = useState<"cereza" | "pergamino" | "verde">("cereza");
  const [cajuelas, setCajuelas] = useState("");

  useEffect(() => {
    if (state && "success" in state) onGuardado();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const pesoEstimado = etapa === "cereza" && cajuelas ? Number(cajuelas) * factorCajuela : null;
  const hoy = new Date().toISOString().slice(0, 10);

  return (
    <form action={formAction} data-testid="form-registrar-compra-lote" className="space-y-3">
      <div className="flex flex-wrap gap-3">
        <Md3TextField label="Nombre del lote (opcional)" name="nombre" placeholder="ej. Finca El Mirador — lote 3" style={{ minWidth: 260 }} />
        <Md3Select label="Proveedor" name="proveedor_id" required placeholder="Selecciona un proveedor" opciones={proveedores.map((p) => ({ value: p.id, label: p.nombre }))} />
        <Md3Select label="Variedad" name="variedad_id" required placeholder="Selecciona una variedad" opciones={variedades.map((v) => ({ value: v.id, label: v.nombre }))} />
        <Md3Select label="Finca (opcional)" name="finca_id" placeholder="Sin finca" opciones={fincas.map((f) => ({ value: f.id, label: f.nombre }))} />
        <Md3TextField label="Número de cama de secado (opcional)" name="numero_cama_secado" />
        <Md3Select
          label="Etapa en la que se compra"
          name="etapa"
          required
          value={etapa}
          onValueChange={(v) => setEtapa(v as typeof etapa)}
          opciones={[
            { value: "cereza", label: "Cereza" },
            { value: "pergamino", label: "Pergamino" },
            { value: "verde", label: "Verde" },
          ]}
        />
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
            supportingText={pesoEstimado !== null ? `≈ ${pesoEstimado.toFixed(2)} kg (${factorCajuela} kg/cajuela)` : `Factor actual: ${factorCajuela} kg por cajuela`}
          />
        ) : (
          <Md3TextField label="Peso (kg)" name="peso_actual_kg" type="number" step="0.01" min="0.01" required />
        )}
        <Md3TextField label="Fecha de cosecha (opcional)" name="fecha_cosecha" type="date" />
        <CamposComerciales hoy={hoy} />
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

function RegistrarCompraArticuloForm({
  proveedores,
  articulos,
  onGuardado,
}: {
  proveedores: Opcion[];
  articulos: ArticuloOpcion[];
  onGuardado: () => void;
}) {
  const [state, formAction, isPending] = useActionState(registrarCompraArticulo, {});
  const hoy = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (state && "success" in state) onGuardado();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} data-testid="form-registrar-compra-articulo" className="space-y-3">
      <div className="flex flex-wrap gap-3">
        <Md3Select label="Proveedor" name="proveedor_id" required placeholder="Selecciona un proveedor" opciones={proveedores.map((p) => ({ value: p.id, label: p.nombre }))} />
        <Md3Select
          label="Artículo"
          name="articulo_id"
          required
          placeholder={articulos.length === 0 ? "No hay artículos de este tipo en el catálogo" : "Selecciona un artículo"}
          opciones={articulos.map((a) => ({ value: a.id, label: a.nombre }))}
        />
        <Md3TextField label="Cantidad" name="cantidad" type="number" step="0.01" min="0.01" required />
        <CamposComerciales hoy={hoy} />
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

function EditarCompraForm({ compra, onGuardado }: { compra: Compra; onGuardado: () => void }) {
  const action = actualizarCompra.bind(null, compra.id);
  const [state, formAction, isPending] = useActionState(action, {});

  useEffect(() => {
    if (state && "success" in state) onGuardado();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} data-testid="form-editar-compra" className="space-y-3">
      <div className="flex flex-wrap gap-3">
        <Md3TextField label="Fecha de compra" name="fecha_compra" type="date" defaultValue={compra.fecha_compra} />
        <Md3TextField label="Costo total (opcional)" name="costo_total" type="number" step="0.01" min="0" defaultValue={compra.costo_total ?? ""} />
        <Md3TextField label="Folio / factura (opcional)" name="numero_factura" defaultValue={compra.numero_factura ?? ""} />
        <Md3Textarea label="Notas (opcional)" name="notas" defaultValue={compra.notas ?? ""} />
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
