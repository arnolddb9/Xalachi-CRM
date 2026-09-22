"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import type { SimpleCatalogo as SimpleCatalogoType } from "./simple-catalogo";

type Props = ComponentProps<typeof SimpleCatalogoType>;

const SimpleCatalogo = dynamic<Props>(
  () => import("./simple-catalogo").then((m) => m.SimpleCatalogo),
  { ssr: false, loading: () => <p className="p-4 text-sm text-zinc-500">Cargando…</p> },
);

export function SimpleCatalogoCargador(props: Props) {
  return <SimpleCatalogo {...props} />;
}
