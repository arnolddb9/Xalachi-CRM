import { z } from "zod";
import { uuid, opcional } from "@/features/inventario/schemas";

const mermaSchema = z
  .string()
  .trim()
  .transform((v) => Number(v))
  .refine((v) => Number.isFinite(v) && v >= 0 && v <= 100, {
    message: "La merma debe estar entre 0 y 100.",
  });

const kgAProcesarSchema = z
  .string()
  .trim()
  .transform((v) => Number(v))
  .refine((v) => Number.isFinite(v) && v > 0, { message: "La cantidad debe ser mayor a 0." });

const numeroOpcionalServicio = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .transform((v) => (v ? Number(v) : null));

const registrarOrdenServicioBase = z.object({
  cliente_id: uuid,
  etapa_entrada: z.enum(["cereza", "pergamino", "verde", "tostado"], {
    message: "Selecciona una etapa de entrada válida.",
  }),
  cantidad_kg: numeroOpcionalServicio,
  cantidad_cajuelas: numeroOpcionalServicio,
  proceso_beneficiado_id: opcional(uuid),
  fecha_recepcion: opcional(z.string()),
  notas: opcional(z.string().trim().max(1000)),
});

export const registrarOrdenServicioSchema = registrarOrdenServicioBase.superRefine((data, ctx) => {
  if (data.etapa_entrada === "cereza") {
    if (!data.cantidad_cajuelas || data.cantidad_cajuelas <= 0) {
      ctx.addIssue({
        code: "custom",
        message: "Indica cuántas cajuelas se recibieron.",
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

export const aplicarPeladoSchema = z.object({
  lote_servicio_origen_id: uuid,
  kg_a_procesar: kgAProcesarSchema,
  merma_pct: mermaSchema,
});

export const aplicarBeneficiadoServicioSchema = z.object({
  lote_servicio_origen_id: uuid,
  kg_a_procesar: kgAProcesarSchema,
  merma_pct: mermaSchema,
});

export const aplicarTuesteServicioSchema = z.object({
  lote_servicio_origen_id: uuid,
  perfil_tueste_id: uuid,
  kg_a_procesar: kgAProcesarSchema,
  merma_pct: mermaSchema,
});

export const aplicarMolidoServicioSchema = z.object({
  lote_servicio_origen_id: uuid,
  kg_a_procesar: kgAProcesarSchema,
  merma_pct: mermaSchema,
});

const kgOpcional = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .transform((v) => (v ? Number(v) : 0))
  .refine((v) => Number.isFinite(v) && v >= 0, { message: "Debe ser un número mayor o igual a 0." });

export const aplicarClasificacionServicioSchema = z
  .object({
    lote_servicio_origen_id: uuid,
    primera_kg: kgOpcional,
    segunda_kg: kgOpcional,
    tercera_kg: kgOpcional,
    rechazo_kg: kgOpcional,
  })
  .refine((d) => d.primera_kg + d.segunda_kg + d.tercera_kg + d.rechazo_kg > 0, {
    message: "Indica al menos un peso mayor a 0 en alguna calidad.",
    path: ["primera_kg"],
  });

export const tarifasServicioSchema = z.object({
  pelado: z
    .string()
    .trim()
    .transform((v) => Number(v))
    .refine((v) => Number.isFinite(v) && v >= 0, { message: "La tarifa debe ser mayor o igual a 0." }),
  clasificacion: z
    .string()
    .trim()
    .transform((v) => Number(v))
    .refine((v) => Number.isFinite(v) && v >= 0, { message: "La tarifa debe ser mayor o igual a 0." }),
  tueste: z
    .string()
    .trim()
    .transform((v) => Number(v))
    .refine((v) => Number.isFinite(v) && v >= 0, { message: "La tarifa debe ser mayor o igual a 0." }),
  molido: z
    .string()
    .trim()
    .transform((v) => Number(v))
    .refine((v) => Number.isFinite(v) && v >= 0, { message: "La tarifa debe ser mayor o igual a 0." }),
  beneficiado: z
    .string()
    .trim()
    .transform((v) => Number(v))
    .refine((v) => Number.isFinite(v) && v >= 0, { message: "La tarifa debe ser mayor o igual a 0." }),
});
