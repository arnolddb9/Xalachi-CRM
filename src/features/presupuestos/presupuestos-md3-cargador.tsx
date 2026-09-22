"use client";

import dynamic from "next/dynamic";
import type { PresupuestosMd3Props } from "./presupuestos-md3-vista";

const PresupuestosMd3Vista = dynamic<PresupuestosMd3Props>(
  () => import("./presupuestos-md3-vista").then((m) => m.PresupuestosMd3Vista),
  { ssr: false, loading: () => <p className="p-4 text-sm text-zinc-500">Cargando…</p> },
);

export function PresupuestosMd3Cargador(props: PresupuestosMd3Props) {
  return <PresupuestosMd3Vista {...props} />;
}
