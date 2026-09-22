"use client";

import { useState } from "react";
import type { NodoServicio } from "./arbol";
import { formatoMonedaPdf, TIPO_PROCESO_LABEL, ETAPA_LABEL, CALIDAD_LABEL } from "@/lib/pdf-servicio";
import { Md3Button } from "@/components/md3/button";

type Paso = {
  tipo_proceso: string;
  peso_procesado_kg: number;
  tarifa_kg: number;
  costo_total: number;
};

type NodoPlano = {
  nivel: number;
  pasoEntrada: NodoServicio["pasoEntrada"];
  lote: NodoServicio["lote"];
};

function aplanarArbol(nodo: NodoServicio, nivel = 0): NodoPlano[] {
  return [
    { nivel, pasoEntrada: nodo.pasoEntrada, lote: nodo.lote },
    ...nodo.hijos.flatMap((hijo) => aplanarArbol(hijo, nivel + 1)),
  ];
}

export function CompartirOrdenBoton({
  clienteNombre,
  etapaEntrada,
  cantidadKg,
  fechaRecepcion,
  notas,
  arbol,
  pasos,
  costoTotal,
}: {
  clienteNombre: string;
  etapaEntrada: string;
  cantidadKg: number;
  fechaRecepcion: string;
  notas: string | null;
  arbol: NodoServicio | null;
  pasos: Paso[];
  costoTotal: number;
}) {
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generarPdf() {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    let y = 20;

    doc.setFontSize(16);
    doc.text("Xalachi — Orden de servicio", 14, y);
    y += 10;

    doc.setFontSize(11);
    doc.text(`Cliente: ${clienteNombre}`, 14, y);
    y += 7;
    doc.text(`Café recibido en: ${ETAPA_LABEL[etapaEntrada] ?? etapaEntrada} · ${cantidadKg} kg`, 14, y);
    y += 7;
    doc.text(`Fecha de recepción: ${fechaRecepcion}`, 14, y);
    y += 7;
    if (notas) {
      doc.text(`Notas: ${notas}`, 14, y);
      y += 7;
    }

    if (arbol) {
      y += 5;
      doc.setFontSize(12);
      doc.text("Detalle del procesado", 14, y);
      y += 8;
      doc.setFontSize(9);

      for (const nodo of aplanarArbol(arbol)) {
        const sangria = 14 + nodo.nivel * 8;

        if (y > 275) {
          doc.addPage();
          y = 20;
        }

        if (nodo.pasoEntrada) {
          const etiqueta = TIPO_PROCESO_LABEL[nodo.pasoEntrada.tipo_proceso] ?? nodo.pasoEntrada.tipo_proceso;
          doc.setFont("helvetica", "bold");
          doc.text(
            `${etiqueta} — ${nodo.pasoEntrada.peso_procesado_kg} kg procesados · merma ${nodo.pasoEntrada.merma_pct}%`,
            sangria,
            y,
          );
          y += 5;
          doc.setFont("helvetica", "normal");
          doc.text(
            `${formatoMonedaPdf(nodo.pasoEntrada.tarifa_kg)}/kg · costo ${formatoMonedaPdf(nodo.pasoEntrada.costo_total)}` +
              (nodo.pasoEntrada.usuario?.nombre ? ` · ${nodo.pasoEntrada.usuario.nombre}` : "") +
              ` · ${new Date(nodo.pasoEntrada.creado_en).toLocaleString("es")}`,
            sangria,
            y,
          );
          y += 6;
        }

        const etapaTexto = ETAPA_LABEL[nodo.lote.etapa] ?? nodo.lote.etapa;
        const calidadTexto = nodo.lote.calidad ? ` [${CALIDAD_LABEL[nodo.lote.calidad] ?? nodo.lote.calidad}]` : "";
        doc.text(`${etapaTexto}${calidadTexto}`, sangria, y);
        y += 5;
        doc.text(
          `${nodo.lote.peso_actual_kg} kg disponibles (de ${nodo.lote.peso_inicial_kg} kg)` +
            (nodo.lote.cantidad_cajuelas ? ` · ${nodo.lote.cantidad_cajuelas} cajuelas` : "") +
            (nodo.lote.proceso_beneficiado?.nombre ? ` · ${nodo.lote.proceso_beneficiado.nombre}` : ""),
          sangria,
          y,
        );
        y += 8;
      }
    }

    y += 3;
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(12);
    doc.text("Desglose de costo", 14, y);
    y += 8;
    doc.setFontSize(10);

    if (pasos.length === 0) {
      doc.text("Aún no se ha aplicado ningún proceso.", 14, y);
      y += 7;
    } else {
      for (const paso of pasos) {
        if (y > 275) {
          doc.addPage();
          y = 20;
        }
        const etiqueta = TIPO_PROCESO_LABEL[paso.tipo_proceso] ?? paso.tipo_proceso;
        doc.text(
          `${etiqueta} — ${paso.peso_procesado_kg} kg × ${formatoMonedaPdf(paso.tarifa_kg)}/kg`,
          14,
          y,
        );
        doc.text(formatoMonedaPdf(paso.costo_total), 180, y, { align: "right" });
        y += 7;
      }
    }

    y += 3;
    doc.setDrawColor(200);
    doc.line(14, y, 196, y);
    y += 8;
    doc.setFontSize(12);
    doc.text("Total", 14, y);
    doc.text(formatoMonedaPdf(costoTotal), 180, y, { align: "right" });

    return doc;
  }

  async function handleCompartir() {
    setError(null);
    setGenerando(true);
    try {
      const doc = await generarPdf();
      const nombreArchivo = `orden-servicio-${clienteNombre.replace(/\s+/g, "-").toLowerCase()}.pdf`;
      const blob = doc.output("blob");
      const archivo = new File([blob], nombreArchivo, { type: "application/pdf" });

      if (typeof navigator.share === "function" && navigator.canShare?.({ files: [archivo] })) {
        await navigator.share({
          files: [archivo],
          title: "Orden de servicio",
          text: `Orden de servicio para ${clienteNombre}`,
        });
      } else {
        const url = URL.createObjectURL(blob);
        const enlace = document.createElement("a");
        enlace.href = url;
        enlace.download = nombreArchivo;
        enlace.click();
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      // El usuario cancelando el share nativo también cae aquí (AbortError) — no es un error real.
      if (e instanceof Error && e.name !== "AbortError") {
        setError("No se pudo generar el PDF. Intenta de nuevo.");
      }
    } finally {
      setGenerando(false);
    }
  }

  return (
    <div>
      <Md3Button variant="outlined" minWidth={110} disabled={generando} onClick={handleCompartir}>
        {generando ? "Generando..." : "Compartir"}
      </Md3Button>
      {error && (
        <p className="mt-1 text-sm" style={{ color: "var(--md-sys-color-error)" }}>
          {error}
        </p>
      )}
    </div>
  );
}
