"use client";

import { useActionState, useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { registrarCompraLote, registrarCompraArticulo, actualizarCompra, eliminarCompra } from "./actions";

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
  lote: {
    id: string;
    nombre: string | null;
    etapa: string;
    peso_actual_kg: number;
    variedad: { nombre: string } | null;
  } | null;
  articulo: { nombre: string; unidad_medida: string } | null;
};

export function ComprasTabla({
  compras,
  variedades,
  proveedores,
  fincas,
  articulos,
  factorCajuela,
  esAdmin,
}: {
  compras: Compra[];
  variedades: Opcion[];
  proveedores: Opcion[];
  fincas: Opcion[];
  articulos: ArticuloOpcion[];
  factorCajuela: number;
  esAdmin: boolean;
}) {
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [errorEliminar, setErrorEliminar] = useState<string | null>(null);

  async function handleEliminar(id: string, etiqueta: string) {
    if (!window.confirm(`¿Eliminar la compra "${etiqueta}" definitivamente? Esta acción no se puede deshacer.`)) {
      return;
    }
    setErrorEliminar(null);
    const resultado = await eliminarCompra(id);
    if ("error" in resultado && resultado.error) setErrorEliminar(resultado.error);
  }

  return (
    <div className="space-y-4">
      {errorEliminar && (
        <p className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-600">
          {errorEliminar}
        </p>
      )}

      <div className="rounded-lg border border-zinc-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 p-4">
          <h2 className="text-sm font-semibold text-zinc-900">Compras registradas</h2>
          {esAdmin && (
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
              {mostrarForm ? "Cancelar" : "Registrar compra"}
            </button>
          )}
        </div>

        {mostrarForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ duration: 0.2 }}
          >
            <RegistrarCompraForm
              variedades={variedades}
              proveedores={proveedores}
              fincas={fincas}
              articulos={articulos}
              factorCajuela={factorCajuela}
              onGuardado={() => setMostrarForm(false)}
            />
          </motion.div>
        )}

        <div className="divide-y divide-zinc-100">
          {compras.length === 0 && <p className="p-4 text-sm text-zinc-500">Sin compras registradas.</p>}
          {compras.map((compra, i) => {
            const esLote = compra.tipo_compra === "lote";
            const etiqueta = esLote
              ? (compra.lote?.nombre ?? compra.lote?.variedad?.nombre ?? "compra")
              : (compra.articulo?.nombre ?? "compra");
            return (
              <motion.div
                key={compra.id}
                data-testid="fila-compra"
                className="p-4"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18, delay: Math.min(i, 8) * 0.02 }}
              >
                {editandoId === compra.id ? (
                  <EditarCompraForm compra={compra} onGuardado={() => setEditandoId(null)} />
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-zinc-900">
                        {compra.proveedor?.nombre ?? "Sin proveedor"}{" "}
                        <span className="bg-primary-soft text-primary ml-1 rounded px-1.5 py-0.5 text-xs font-medium">
                          {esLote && compra.lote
                            ? (ETAPA_LABEL[compra.lote.etapa] ?? compra.lote.etapa)
                            : TIPO_COMPRA_LABEL[compra.tipo_compra]}
                        </span>
                      </p>
                      {esLote ? (
                        <p className="text-xs text-zinc-500">
                          {compra.lote?.nombre ?? compra.lote?.variedad?.nombre ?? "—"}
                          {compra.lote ? ` · ${compra.lote.peso_actual_kg} kg` : ""}
                          {compra.costo_total !== null ? ` · $${compra.costo_total}` : ""}
                          {compra.numero_factura ? ` · folio ${compra.numero_factura}` : ""}
                          {` · compra ${compra.fecha_compra}`}
                        </p>
                      ) : (
                        <p className="text-xs text-zinc-500">
                          {compra.articulo?.nombre ?? "—"}
                          {compra.cantidad !== null ? ` · ${compra.cantidad} ${compra.articulo?.unidad_medida ?? ""}` : ""}
                          {compra.costo_total !== null ? ` · $${compra.costo_total}` : ""}
                          {compra.numero_factura ? ` · folio ${compra.numero_factura}` : ""}
                          {` · compra ${compra.fecha_compra}`}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {esLote && compra.lote && (
                        <Link
                          href={`/inventario/${compra.lote.id}/historial`}
                          className="flex min-h-9 items-center rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 transition-colors hover:bg-zinc-100"
                        >
                          Ver lote
                        </Link>
                      )}
                      {esAdmin && (
                        <>
                          <button
                            onClick={() => {
                              setMostrarForm(false);
                              setEditandoId(compra.id);
                            }}
                            className="border-primary/30 text-primary hover:bg-primary-soft min-h-9 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleEliminar(compra.id, etiqueta)}
                            className="min-h-9 rounded-md border border-red-200 px-3 py-1.5 text-sm text-red-600 transition-colors hover:bg-red-50"
                          >
                            Eliminar
                          </button>
                        </>
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
    <div className="space-y-3 border-b border-zinc-100 bg-zinc-50 p-4">
      <div>
        <label htmlFor="tipo_compra" className="mb-1 block text-sm text-zinc-600">
          Tipo de compra
        </label>
        <select
          id="tipo_compra"
          value={tipoCompra}
          onChange={(e) => setTipoCompra(e.target.value as TipoCompra)}
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
        >
          <option value="lote">Lote de café</option>
          <option value="insumo">Insumo</option>
          <option value="producto_terminado">Producto terminado</option>
        </select>
      </div>

      {tipoCompra === "lote" ? (
        <RegistrarCompraLoteForm
          variedades={variedades}
          proveedores={proveedores}
          fincas={fincas}
          factorCajuela={factorCajuela}
          onGuardado={onGuardado}
        />
      ) : (
        <RegistrarCompraArticuloForm
          proveedores={proveedores}
          articulos={articulos.filter((a) => a.tipo === tipoCompra)}
          onGuardado={onGuardado}
        />
      )}
    </div>
  );
}

function CamposComerciales({ hoy }: { hoy: string }) {
  return (
    <>
      <div>
        <label htmlFor="fecha_compra" className="mb-1 block text-sm text-zinc-600">
          Fecha de compra
        </label>
        <input
          id="fecha_compra"
          name="fecha_compra"
          type="date"
          defaultValue={hoy}
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
        />
      </div>

      <div>
        <label htmlFor="costo_total" className="mb-1 block text-sm text-zinc-600">
          Costo total (opcional)
        </label>
        <input
          id="costo_total"
          name="costo_total"
          type="number"
          step="0.01"
          min="0"
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
        />
      </div>

      <div>
        <label htmlFor="numero_factura" className="mb-1 block text-sm text-zinc-600">
          Folio / factura (opcional)
        </label>
        <input
          id="numero_factura"
          name="numero_factura"
          type="text"
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
        />
      </div>

      <div>
        <label htmlFor="notas" className="mb-1 block text-sm text-zinc-600">
          Notas (opcional)
        </label>
        <textarea
          id="notas"
          name="notas"
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
        />
      </div>
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
      <div>
        <label htmlFor="proveedor_id" className="mb-1 block text-sm text-zinc-600">
          Proveedor
        </label>
        <select
          id="proveedor_id"
          name="proveedor_id"
          required
          defaultValue=""
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
        >
          <option value="" disabled>
            Selecciona un proveedor
          </option>
          {proveedores.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="variedad_id" className="mb-1 block text-sm text-zinc-600">
          Variedad
        </label>
        <select
          id="variedad_id"
          name="variedad_id"
          required
          defaultValue=""
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
        <label htmlFor="finca_id" className="mb-1 block text-sm text-zinc-600">
          Finca (opcional)
        </label>
        <select
          id="finca_id"
          name="finca_id"
          defaultValue=""
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
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
        />
      </div>

      <div>
        <label htmlFor="etapa" className="mb-1 block text-sm text-zinc-600">
          Etapa en la que se compra
        </label>
        <select
          id="etapa"
          name="etapa"
          required
          value={etapa}
          onChange={(e) => setEtapa(e.target.value as "cereza" | "pergamino" | "verde")}
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
        >
          <option value="cereza">Cereza</option>
          <option value="pergamino">Pergamino</option>
          <option value="verde">Verde</option>
        </select>
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
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
        />
      </div>

      <hr className="border-zinc-200" />

      <CamposComerciales hoy={hoy} />

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
      <div>
        <label htmlFor="proveedor_id_articulo" className="mb-1 block text-sm text-zinc-600">
          Proveedor
        </label>
        <select
          id="proveedor_id_articulo"
          name="proveedor_id"
          required
          defaultValue=""
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
        >
          <option value="" disabled>
            Selecciona un proveedor
          </option>
          {proveedores.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="articulo_id" className="mb-1 block text-sm text-zinc-600">
          Artículo
        </label>
        <select
          id="articulo_id"
          name="articulo_id"
          required
          defaultValue=""
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
        >
          <option value="" disabled>
            {articulos.length === 0 ? "No hay artículos de este tipo en el catálogo" : "Selecciona un artículo"}
          </option>
          {articulos.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nombre}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="cantidad" className="mb-1 block text-sm text-zinc-600">
          Cantidad
        </label>
        <input
          id="cantidad"
          name="cantidad"
          type="number"
          step="0.01"
          min="0.01"
          required
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
        />
      </div>

      <hr className="border-zinc-200" />

      <CamposComerciales hoy={hoy} />

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

function EditarCompraForm({ compra, onGuardado }: { compra: Compra; onGuardado: () => void }) {
  const action = actualizarCompra.bind(null, compra.id);
  const [state, formAction, isPending] = useActionState(action, {});

  useEffect(() => {
    if (state && "success" in state) onGuardado();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form
      action={formAction}
      data-testid="form-editar-compra"
      className="space-y-3 rounded-md bg-zinc-50 p-4"
    >
      <div>
        <label htmlFor="fecha_compra_editar" className="mb-1 block text-sm text-zinc-600">
          Fecha de compra
        </label>
        <input
          id="fecha_compra_editar"
          name="fecha_compra"
          type="date"
          defaultValue={compra.fecha_compra}
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
        />
      </div>

      <div>
        <label htmlFor="costo_total_editar" className="mb-1 block text-sm text-zinc-600">
          Costo total (opcional)
        </label>
        <input
          id="costo_total_editar"
          name="costo_total"
          type="number"
          step="0.01"
          min="0"
          defaultValue={compra.costo_total ?? ""}
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
        />
      </div>

      <div>
        <label htmlFor="numero_factura_editar" className="mb-1 block text-sm text-zinc-600">
          Folio / factura (opcional)
        </label>
        <input
          id="numero_factura_editar"
          name="numero_factura"
          type="text"
          defaultValue={compra.numero_factura ?? ""}
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
        />
      </div>

      <div>
        <label htmlFor="notas_editar" className="mb-1 block text-sm text-zinc-600">
          Notas (opcional)
        </label>
        <textarea
          id="notas_editar"
          name="notas"
          defaultValue={compra.notas ?? ""}
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
