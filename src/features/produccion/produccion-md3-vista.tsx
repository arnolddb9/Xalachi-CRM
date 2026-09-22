"use client";

import Link from "next/link";
import "@/features/inventario/md3-theme.css";
import { Md3Card } from "@/components/md3/card";
import { Md3Button } from "@/components/md3/button";

const TIPO_PROCESO_LABEL: Record<string, string> = {
  beneficiado: "Beneficiado",
  trillado: "Trillado",
  tueste: "Tueste",
  molido: "Molido",
  clasificacion_calidad: "Clasificación de calidad",
};

type EventoProceso = {
  id: string;
  tipo: "proceso";
  tipoProceso: string;
  loteOrigenId: string;
  loteOrigenNombre: string | null;
  loteDestinoId: string;
  loteDestinoNombre: string | null;
  loteDestinoEtapa: string;
  procesoBeneficiado: string | null;
  mermaPct: number;
  usuario: string | null;
  creadoEn: string;
};

type EventoEmpacado = {
  id: string;
  tipo: "empacado";
  loteOrigenId: string;
  loteOrigenNombre: string | null;
  articulo: string | null;
  presentacion: string | null;
  unidades: number;
  pesoKg: number;
  usuario: string | null;
  creadoEn: string;
};

export type ProduccionMd3Props = {
  eventos: (EventoProceso | EventoEmpacado)[];
};

export function ProduccionMd3Vista({ eventos }: ProduccionMd3Props) {
  return (
    <div className="md3-scope space-y-4 rounded-2xl p-4">
      <h1 className="text-2xl font-medium">Producción</h1>
      <p className="text-sm" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
        Bitácora de todas las transformaciones de lotes: beneficiado, trillado, tueste, molido, clasificación de
        calidad y empacado.
      </p>

      <Md3Card>
        <div>
          {eventos.length === 0 && <p className="p-4 text-sm">Sin actividad de producción todavía.</p>}
          {eventos.map((evento) =>
            evento.tipo === "proceso" ? (
              <div
                key={`proceso-${evento.id}`}
                className="space-y-1 p-4"
                style={{ borderBottom: "1px solid var(--md-sys-color-outline-variant)" }}
              >
                <p className="text-sm font-medium">
                  {TIPO_PROCESO_LABEL[evento.tipoProceso] ?? evento.tipoProceso}
                  {evento.procesoBeneficiado && ` (${evento.procesoBeneficiado})`}
                </p>
                <p className="text-xs" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
                  {evento.loteOrigenNombre ?? "lote"} → {evento.loteDestinoNombre ?? "lote"}
                  {" · merma "}
                  {evento.mermaPct}%
                  {evento.usuario ? ` · ${evento.usuario}` : ""}
                  {" · "}
                  {new Date(evento.creadoEn).toLocaleString("es")}
                </p>
                <Link href={`/inventario/${evento.loteDestinoId}/historial`}>
                  <Md3Button variant="text" minWidth={100}>
                    Ver historial
                  </Md3Button>
                </Link>
              </div>
            ) : (
              <div
                key={`empacado-${evento.id}`}
                className="space-y-1 p-4"
                style={{ borderBottom: "1px solid var(--md-sys-color-outline-variant)" }}
              >
                <p className="text-sm font-medium">Empacado</p>
                <p className="text-xs" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
                  {evento.loteOrigenNombre ?? "lote"} → {evento.unidades} unidades de {evento.articulo ?? "producto"}
                  {evento.presentacion ? ` (${evento.presentacion})` : ""}
                  {` · ${evento.pesoKg} kg`}
                  {evento.usuario ? ` · ${evento.usuario}` : ""}
                  {" · "}
                  {new Date(evento.creadoEn).toLocaleString("es")}
                </p>
                <Link href={`/inventario/${evento.loteOrigenId}/historial`}>
                  <Md3Button variant="text" minWidth={100}>
                    Ver historial
                  </Md3Button>
                </Link>
              </div>
            ),
          )}
        </div>
      </Md3Card>
    </div>
  );
}
