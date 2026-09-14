"use client";

import { useActionState, useEffect, useState } from "react";
import { ajustarStockArticulo } from "./actions";

type Articulo = {
  id: string;
  nombre: string;
  tipo: string;
  unidad_medida: string;
  stock_actual: number;
};

const TIPO_LABEL: Record<string, string> = {
  insumo: "Insumo",
  producto_terminado: "Producto terminado",
};

export function ArticulosTabla({
  articulos,
  puedeEscribir,
}: {
  articulos: Articulo[];
  puedeEscribir: boolean;
}) {
  const [ajustandoId, setAjustandoId] = useState<string | null>(null);

  return (
    <div className="rounded-lg border border-zinc-200 bg-white">
      <div className="border-b border-zinc-200 p-4">
        <h2 className="text-sm font-semibold text-zinc-900">Insumos y productos</h2>
      </div>
      <div className="divide-y divide-zinc-100">
        {articulos.length === 0 && (
          <p className="p-4 text-sm text-zinc-500">
            Sin artículos registrados. Se dan de alta en Catálogos → Insumos y productos.
          </p>
        )}
        {articulos.map((articulo) => (
          <div key={articulo.id} data-testid="fila-articulo" className="p-4">
            {ajustandoId === articulo.id ? (
              <AjustarStockForm articulo={articulo} onGuardado={() => setAjustandoId(null)} />
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-zinc-900">
                    {articulo.nombre}{" "}
                    <span className="bg-primary-soft text-primary ml-1 rounded px-1.5 py-0.5 text-xs font-medium">
                      {TIPO_LABEL[articulo.tipo] ?? articulo.tipo}
                    </span>
                  </p>
                  <p className="text-xs text-zinc-500">
                    {articulo.stock_actual} {articulo.unidad_medida}
                  </p>
                </div>
                {puedeEscribir && (
                  <button
                    onClick={() => setAjustandoId(articulo.id)}
                    className="border-primary/30 text-primary hover:bg-primary-soft min-h-9 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors"
                  >
                    Ajustar existencias
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function AjustarStockForm({ articulo, onGuardado }: { articulo: Articulo; onGuardado: () => void }) {
  const [state, formAction, isPending] = useActionState(ajustarStockArticulo, {});

  useEffect(() => {
    if (state && "success" in state) onGuardado();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form
      action={formAction}
      data-testid="form-ajustar-stock"
      className="flex flex-wrap items-end gap-2"
    >
      <input type="hidden" name="articulo_id" value={articulo.id} />
      <div>
        <label htmlFor={`stock_nuevo_${articulo.id}`} className="mb-1 block text-sm text-zinc-600">
          Nuevo stock de {articulo.nombre} ({articulo.unidad_medida})
        </label>
        <input
          id={`stock_nuevo_${articulo.id}`}
          name="stock_nuevo"
          type="number"
          step="0.01"
          min="0"
          required
          defaultValue={articulo.stock_actual}
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
        onClick={onGuardado}
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
