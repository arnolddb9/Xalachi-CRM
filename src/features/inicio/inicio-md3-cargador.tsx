"use client";

import dynamic from "next/dynamic";
import type { InicioMd3Props } from "./inicio-md3-vista";

const InicioMd3Vista = dynamic<InicioMd3Props>(
  () => import("./inicio-md3-vista").then((m) => m.InicioMd3Vista),
  { ssr: false, loading: () => <p className="p-4 text-sm text-zinc-500">Cargando…</p> },
);

export function InicioMd3Cargador(props: InicioMd3Props) {
  return <InicioMd3Vista {...props} />;
}
