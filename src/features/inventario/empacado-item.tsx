"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { eliminarEmpacado } from "./actions";

type Empacado = {
  id: string;
  unidades: number;
  creado_en: string;
  articulo: { nombre: string } | null;
  presentacion: { nombre: string } | null;
};

export function EmpacadoItem({ empacado, esAdmin }: { empacado: Empacado; esAdmin: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleEliminar() {
    if (
      !window.confirm(
        "¿Eliminar este empacado? Se revierte el peso al lote y el stock del producto (y del insumo, si aplica).",
      )
    ) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const resultado = await eliminarEmpacado(empacado.id);
      if ("error" in resultado && resultado.error) {
        setError(resultado.error);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div
      data-testid="fila-empacado"
      className="mb-3 flex flex-wrap items-center justify-between gap-2 pl-4 text-xs text-zinc-500"
    >
      <span>
        Empacado: {empacado.unidades} unidades de {empacado.articulo?.nombre ?? "producto"}
        {empacado.presentacion?.nombre ? ` (${empacado.presentacion.nombre})` : ""}
        {" · "}
        {new Date(empacado.creado_en).toLocaleString("es")}
      </span>
      {esAdmin && (
        <button
          onClick={handleEliminar}
          disabled={isPending}
          className="text-red-600 hover:underline disabled:opacity-50"
        >
          Eliminar
        </button>
      )}
      {error && <p className="w-full text-red-600">{error}</p>}
    </div>
  );
}
