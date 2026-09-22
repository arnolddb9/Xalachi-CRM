"use client";

import dynamic from "next/dynamic";
import type { ServicioDetalleMd3Props } from "./servicio-detalle-md3-vista";

const ServicioDetalleMd3Vista = dynamic<ServicioDetalleMd3Props>(
  () => import("./servicio-detalle-md3-vista").then((m) => m.ServicioDetalleMd3Vista),
  { ssr: false, loading: () => <p className="p-4 text-sm text-zinc-500">Cargando…</p> },
);

export function ServicioDetalleMd3Cargador(props: ServicioDetalleMd3Props) {
  return <ServicioDetalleMd3Vista {...props} />;
}
