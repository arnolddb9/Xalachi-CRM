"use client";

import dynamic from "next/dynamic";
import type { ComprasMd3Props } from "./compras-md3-vista";

const ComprasMd3Vista = dynamic<ComprasMd3Props>(
  () => import("./compras-md3-vista").then((m) => m.ComprasMd3Vista),
  { ssr: false, loading: () => <p className="p-4 text-sm text-zinc-500">Cargando…</p> },
);

export function ComprasMd3Cargador(props: ComprasMd3Props) {
  return <ComprasMd3Vista {...props} />;
}
