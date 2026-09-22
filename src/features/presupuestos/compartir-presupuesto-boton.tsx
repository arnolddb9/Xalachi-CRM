"use client";

import { useState } from "react";
import { formatoMonedaPdf, TIPO_PROCESO_LABEL, ETAPA_LABEL } from "@/lib/pdf-servicio";
import { Md3Button } from "@/components/md3/button";

type Item = {
  tipo_proceso: string;
  kg_estimado: number;
  tarifa_kg: number;
  costo_estimado: number;
};

export function CompartirPresupuestoBoton({
  clienteNombre,
  etapaEntrada,
  cantidadKg,
  cantidadCajuelas,
  procesoBeneficiadoNombre,
  notas,
  estado,
  items,
  costoTotal,
}: {
  clienteNombre: string;
  etapaEntrada: string;
  cantidadKg: number | null;
  cantidadCajuelas: number | null;
  procesoBeneficiadoNombre: string | null;
  notas: string | null;
  estado: string;
  items: Item[];
  costoTotal: number;
}) {
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generarPdf() {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    let y = 20;

    doc.setFontSize(16);
    doc.text("Xalachi — Presupuesto de servicio", 14, y);
    y += 10;

    doc.setFontSize(11);
    doc.text(`Cliente: ${clienteNombre}`, 14, y);
    y += 7;
    doc.text(
      `Café recibiría en: ${ETAPA_LABEL[etapaEntrada] ?? etapaEntrada}` +
        (cantidadCajuelas ? ` · ${cantidadCajuelas} cajuelas` : "") +
        (cantidadKg ? ` · ${cantidadKg} kg` : "") +
        (procesoBeneficiadoNombre ? ` · ${procesoBeneficiadoNombre}` : ""),
      14,
      y,
    );
    y += 7;
    doc.text(`Estado: ${estado === "borrador" ? "Borrador" : estado === "aprobado" ? "Aprobado" : "Rechazado"}`, 14, y);
    y += 7;
    if (notas) {
      doc.text(`Notas: ${notas}`, 14, y);
      y += 7;
    }

    y += 5;
    doc.setFontSize(12);
    doc.text("Procesos estimados", 14, y);
    y += 8;
    doc.setFontSize(10);

    if (items.length === 0) {
      doc.text("Sin procesos agregados todavía.", 14, y);
      y += 7;
    } else {
      for (const item of items) {
        if (y > 275) {
          doc.addPage();
          y = 20;
        }
        const etiqueta = TIPO_PROCESO_LABEL[item.tipo_proceso] ?? item.tipo_proceso;
        doc.text(`${etiqueta} — ${item.kg_estimado} kg × ${formatoMonedaPdf(item.tarifa_kg)}/kg`, 14, y);
        doc.text(formatoMonedaPdf(item.costo_estimado), 180, y, { align: "right" });
        y += 7;
      }
    }

    y += 3;
    doc.setDrawColor(200);
    doc.line(14, y, 196, y);
    y += 8;
    doc.setFontSize(12);
    doc.text("Total estimado", 14, y);
    doc.text(formatoMonedaPdf(costoTotal), 180, y, { align: "right" });

    return doc;
  }

  async function handleCompartir() {
    setError(null);
    setGenerando(true);
    try {
      const doc = await generarPdf();
      const nombreArchivo = `presupuesto-${clienteNombre.replace(/\s+/g, "-").toLowerCase()}.pdf`;
      const blob = doc.output("blob");
      const archivo = new File([blob], nombreArchivo, { type: "application/pdf" });

      if (typeof navigator.share === "function" && navigator.canShare?.({ files: [archivo] })) {
        await navigator.share({
          files: [archivo],
          title: "Presupuesto de servicio",
          text: `Presupuesto de servicio para ${clienteNombre}`,
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
