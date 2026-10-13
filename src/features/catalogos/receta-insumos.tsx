"use client";

import { useActionState, useEffect, useState } from "react";
import "@/features/inventario/md3-theme.css";
import { Md3Button } from "@/components/md3/button";
import { Md3Card } from "@/components/md3/card";
import { Md3TextField } from "@/components/md3/text-field";
import { Md3Select } from "@/components/md3/select";
import { crearArticuloInsumo, actualizarArticuloInsumo, eliminarArticuloInsumo } from "./actions";

type ItemReceta = {
  id: string;
  insumo_articulo_id: string;
  cantidad_por_unidad: number;
  insumo: { nombre: string; unidad_medida: string } | null;
};
type InsumoOpcion = { id: string; nombre: string; unidad_medida: string };

export function RecetaInsumos({
  articuloId,
  items,
  insumosDisponibles,
  puedeEscribir,
}: {
  articuloId: string;
  items: ItemReceta[];
  insumosDisponibles: InsumoOpcion[];
  puedeEscribir: boolean;
}) {
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);

  return (
    <div className="md3-scope rounded-2xl">
      <Md3Card>
        <div className="flex flex-wrap items-center justify-between gap-2 p-4" style={{ borderBottom: "1px solid var(--md-sys-color-outline-variant)" }}>
          <h2 className="text-sm font-semibold">Insumos requeridos</h2>
          {puedeEscribir && (
            <Md3Button
              variant={mostrarForm ? "outlined" : "filled"}
              minWidth={110}
              onClick={() => {
                setEditandoId(null);
                setMostrarForm((v) => !v);
              }}
            >
              {mostrarForm ? "Cancelar" : "Agregar insumo"}
            </Md3Button>
          )}
        </div>

        {mostrarForm && (
          <div className="p-4" style={{ borderBottom: "1px solid var(--md-sys-color-outline-variant)" }}>
            <ItemForm
              articuloId={articuloId}
              insumosDisponibles={insumosDisponibles.filter((i) => !items.some((it) => it.insumo_articulo_id === i.id))}
              onGuardado={() => setMostrarForm(false)}
            />
          </div>
        )}

        <div>
          {items.length === 0 && (
            <p className="p-4 text-sm">Sin insumos configurados — al empacar este producto no se descontará ningún insumo automáticamente.</p>
          )}
          {items.map((item) => (
            <div key={item.id} data-testid="fila-receta-insumo" className="p-4" style={{ borderBottom: "1px solid var(--md-sys-color-outline-variant)" }}>
              {editandoId === item.id ? (
                <ItemForm
                  articuloId={articuloId}
                  item={item}
                  insumosDisponibles={insumosDisponibles}
                  onGuardado={() => setEditandoId(null)}
                />
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm">
                    {item.insumo?.nombre ?? "—"}{" "}
                    <span style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
                      · {item.cantidad_por_unidad} {item.insumo?.unidad_medida ?? ""} por unidad
                    </span>
                  </p>
                  {puedeEscribir && (
                    <div className="flex gap-2">
                      <Md3Button
                        variant="outlined"
                        minWidth={80}
                        onClick={() => {
                          setMostrarForm(false);
                          setEditandoId(item.id);
                        }}
                      >
                        Editar
                      </Md3Button>
                      <Md3Button variant="outlined" minWidth={90} onClick={() => eliminarArticuloInsumo(articuloId, item.id)}>
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

function ItemForm({
  articuloId,
  item,
  insumosDisponibles,
  onGuardado,
}: {
  articuloId: string;
  item?: ItemReceta;
  insumosDisponibles: InsumoOpcion[];
  onGuardado: () => void;
}) {
  const action = item
    ? actualizarArticuloInsumo.bind(null, articuloId, item.id)
    : crearArticuloInsumo.bind(null, articuloId);
  const [state, formAction, isPending] = useActionState(action, {});

  useEffect(() => {
    if (state && "success" in state) onGuardado();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Md3Select
          label="Insumo"
          name="insumo_articulo_id"
          required
          defaultValue={item?.insumo_articulo_id ?? ""}
          placeholder={insumosDisponibles.length === 0 ? "No hay insumos disponibles" : "Selecciona un insumo"}
          opciones={insumosDisponibles.map((i) => ({ value: i.id, label: i.nombre }))}
        />
        <Md3TextField
          label="Cantidad por unidad"
          name="cantidad_por_unidad"
          type="number"
          step="0.01"
          min="0.01"
          required
          defaultValue={item?.cantidad_por_unidad ?? ""}
          supportingText={item?.insumo?.unidad_medida ? `en ${item.insumo.unidad_medida}` : undefined}
        />
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
