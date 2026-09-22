"use client";

import dynamic from "next/dynamic";
import type { VentasMd3Props } from "./ventas-md3-vista";

const VentasMd3Vista = dynamic<VentasMd3Props>(
  () => import("./ventas-md3-vista").then((m) => m.VentasMd3Vista),
  { ssr: false, loading: () => <p className="p-4 text-sm text-zinc-500">Cargando…</p> },
);

export function VentasMd3Cargador(props: VentasMd3Props) {
  return <VentasMd3Vista {...props} />;
}
