"use client";

import dynamic from "next/dynamic";
import type { InventarioMd3Props } from "./inventario-md3-vista";

// Los componentes de @material/web (Lit) referencian HTMLElement al cargar
// el módulo — solo existen en el navegador, así que se cargan sin SSR.
const InventarioMd3Vista = dynamic<InventarioMd3Props>(
  () => import("./inventario-md3-vista").then((m) => m.InventarioMd3Vista),
  { ssr: false, loading: () => <p className="p-4 text-sm text-zinc-500">Cargando…</p> },
);

export function InventarioMd3Cargador(props: InventarioMd3Props) {
  return <InventarioMd3Vista {...props} />;
}
