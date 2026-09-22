"use client";

import dynamic from "next/dynamic";

const CatalogosMd3Vista = dynamic(
  () => import("./catalogos-md3-vista").then((m) => m.CatalogosMd3Vista),
  { ssr: false, loading: () => <p className="p-4 text-sm text-zinc-500">Cargando…</p> },
);

export function CatalogosMd3Cargador() {
  return <CatalogosMd3Vista />;
}
