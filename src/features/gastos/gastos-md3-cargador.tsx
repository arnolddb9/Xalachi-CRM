"use client";

import dynamic from "next/dynamic";
import type { GastosMd3Props } from "./gastos-md3-vista";

const GastosMd3Vista = dynamic<GastosMd3Props>(
  () => import("./gastos-md3-vista").then((m) => m.GastosMd3Vista),
  { ssr: false, loading: () => <p className="p-4 text-sm text-zinc-500">Cargando…</p> },
);

export function GastosMd3Cargador(props: GastosMd3Props) {
  return <GastosMd3Vista {...props} />;
}
