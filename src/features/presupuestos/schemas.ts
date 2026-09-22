import { z } from "zod";
import { uuid, opcional } from "@/features/inventario/schemas";

const numeroOpcionalPresupuesto = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .transform((v) => (v ? Number(v) : null));

const registrarPresupuestoBase = z.object({
  cliente_id: uuid,
  etapa_entrada: z.enum(["cereza", "pergamino", "verde", "tostado"], {
    message: "Selecciona una etapa de entrada válida.",
  }),
  cantidad_kg: numeroOpcionalPresupuesto,
  cantidad_cajuelas: numeroOpcionalPresupuesto,
  proceso_beneficiado_id: opcional(uuid),
  notas: opcional(z.string().trim().max(1000)),
});

export const registrarPresupuestoSchema = registrarPresupuestoBase.superRefine((data, ctx) => {
  if (data.etapa_entrada === "cereza") {
    if (!data.cantidad_cajuelas || data.cantidad_cajuelas <= 0) {
      ctx.addIssue({
        code: "custom",
        message: "Indica cuántas cajuelas estima el cliente.",
        path: ["cantidad_cajuelas"],
      });
    }
    if (!data.proceso_beneficiado_id) {
      ctx.addIssue({
        code: "custom",
        message: "Selecciona un proceso de beneficiado.",
        path: ["proceso_beneficiado_id"],
      });
    }
  } else if (!data.cantidad_kg || data.cantidad_kg <= 0) {
    ctx.addIssue({
      code: "custom",
      message: "La cantidad debe ser mayor a 0.",
      path: ["cantidad_kg"],
    });
  }
});

export const agregarItemPresupuestoSchema = z.object({
  presupuesto_id: uuid,
  tipo_proceso: z.enum(["pelado", "clasificacion", "tueste", "molido", "beneficiado"], {
    message: "Selecciona un tipo de proceso válido.",
  }),
  kg_estimado: z
    .string()
    .trim()
    .transform((v) => Number(v))
    .refine((v) => Number.isFinite(v) && v > 0, { message: "La cantidad debe ser mayor a 0." }),
});
