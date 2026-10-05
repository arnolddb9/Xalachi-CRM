"use client";

import dynamic from "next/dynamic";

const CuentaMd3Vista = dynamic(() => import("./cuenta-md3-vista").then((m) => m.CuentaMd3Vista), {
  ssr: false,
  loading: () => <p className="p-4 text-sm text-zinc-500">Cargando…</p>,
});

export function CuentaMd3Cargador() {
  return <CuentaMd3Vista />;
}
