"use client";

import dynamic from "next/dynamic";
import type { ServiciosMd3Props } from "./servicios-md3-vista";

const ServiciosMd3Vista = dynamic<ServiciosMd3Props>(
  () => import("./servicios-md3-vista").then((m) => m.ServiciosMd3Vista),
  { ssr: false, loading: () => <p className="p-4 text-sm text-zinc-500">Cargando…</p> },
);

export function ServiciosMd3Cargador(props: ServiciosMd3Props) {
  return <ServiciosMd3Vista {...props} />;
}
