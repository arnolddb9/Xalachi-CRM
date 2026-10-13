"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import type { RecetaInsumos } from "./receta-insumos";

// Mismo motivo que el resto de los componentes md3: Lit (@material/web) solo
// existe en el navegador.
const RecetaInsumosVista = dynamic(() => import("./receta-insumos").then((m) => m.RecetaInsumos), {
  ssr: false,
  loading: () => <p className="p-4 text-sm text-zinc-500">Cargando…</p>,
});

export function RecetaInsumosCargador(props: ComponentProps<typeof RecetaInsumos>) {
  return <RecetaInsumosVista {...props} />;
}
