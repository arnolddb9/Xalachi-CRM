"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import type { PasosBeneficiado as PasosBeneficiadoType } from "./pasos-beneficiado";

type Props = ComponentProps<typeof PasosBeneficiadoType>;

const PasosBeneficiado = dynamic<Props>(
  () => import("./pasos-beneficiado").then((m) => m.PasosBeneficiado),
  { ssr: false, loading: () => <p className="p-4 text-sm text-zinc-500">Cargando…</p> },
);

export function PasosBeneficiadoCargador(props: Props) {
  return <PasosBeneficiado {...props} />;
}
