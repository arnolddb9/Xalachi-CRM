"use client";

import dynamic from "next/dynamic";
import type { UsuariosMd3Props } from "./usuarios-md3-vista";

const UsuariosMd3Vista = dynamic<UsuariosMd3Props>(
  () => import("./usuarios-md3-vista").then((m) => m.UsuariosMd3Vista),
  { ssr: false, loading: () => <p className="p-4 text-sm text-zinc-500">Cargando…</p> },
);

export function UsuariosMd3Cargador(props: UsuariosMd3Props) {
  return <UsuariosMd3Vista {...props} />;
}
