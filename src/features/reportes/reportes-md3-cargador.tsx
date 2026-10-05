"use client";

import dynamic from "next/dynamic";
import type { ReportesMd3Props } from "./reportes-md3-vista";

const ReportesMd3Vista = dynamic<ReportesMd3Props>(
  () => import("./reportes-md3-vista").then((m) => m.ReportesMd3Vista),
  { ssr: false, loading: () => <p className="p-4 text-sm text-zinc-500">Cargando…</p> },
);

export function ReportesMd3Cargador(props: ReportesMd3Props) {
  return <ReportesMd3Vista {...props} />;
}
