"use client";

import dynamic from "next/dynamic";
import type { ProduccionMd3Props } from "./produccion-md3-vista";

const ProduccionMd3Vista = dynamic<ProduccionMd3Props>(
  () => import("./produccion-md3-vista").then((m) => m.ProduccionMd3Vista),
  { ssr: false, loading: () => <p className="p-4 text-sm text-zinc-500">Cargando…</p> },
);

export function ProduccionMd3Cargador(props: ProduccionMd3Props) {
  return <ProduccionMd3Vista {...props} />;
}
