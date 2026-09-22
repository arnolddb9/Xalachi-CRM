import { z } from "zod";

export const uuid = z.uuid("Selecciona una opción válida.");
export const opcional = (schema: z.ZodType<string>) =>
  schema
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : null));
export const numeroOpcional = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .transform((v) => (v ? Number(v) : null));

// Cereza se mide en cajuelas al recibirla (se calcula el peso con el factor
// de configuración); pergamino/verde se registran directo en kg.
export const loteBaseSchema = z.object({
  nombre: opcional(z.string().trim().max(200)),
  variedad_id: uuid,
  proveedor_id: opcional(uuid),
  finca_id: opcional(uuid),
  numero_cama_secado: opcional(z.string().trim().max(50)),
  etapa: z.enum(["cereza", "pergamino", "verde"], { message: "Selecciona una etapa válida." }),
  cantidad_cajuelas: numeroOpcional,
  peso_actual_kg: numeroOpcional,
  fecha_cosecha: opcional(z.string()),
});

export function validarPesoSegunEtapa(
  data: z.infer<typeof loteBaseSchema>,
  ctx: z.RefinementCtx,
) {
  if (data.etapa === "cereza") {
    if (!data.cantidad_cajuelas || data.cantidad_cajuelas <= 0) {
      ctx.addIssue({
        code: "custom",
        message: "Indica cuántas cajuelas se recibieron.",
        path: ["cantidad_cajuelas"],
      });
    }
  } else if (!data.peso_actual_kg || data.peso_actual_kg <= 0) {
    ctx.addIssue({
      code: "custom",
      message: "El peso debe ser mayor a 0.",
      path: ["peso_actual_kg"],
    });
  }
}

export const registrarLoteSchema = loteBaseSchema.superRefine(validarPesoSegunEtapa);
export const actualizarLoteSchema = loteBaseSchema.superRefine(validarPesoSegunEtapa);

const mermaSchema = z
  .string()
  .trim()
  .transform((v) => Number(v))
  .refine((v) => Number.isFinite(v) && v >= 0 && v <= 100, {
    message: "La merma debe estar entre 0 y 100.",
  });

export const iniciarOAvanzarBeneficiadoSchema = z.object({
  lote_origen_id: uuid,
  proceso_beneficiado_id: opcional(uuid),
  merma_pct: mermaSchema,
});

export const aplicarTrilladoSchema = z.object({
  lote_origen_id: uuid,
  merma_pct: mermaSchema,
});

const kgOpcional = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .transform((v) => (v ? Number(v) : 0))
  .refine((v) => Number.isFinite(v) && v >= 0, { message: "Debe ser un número mayor o igual a 0." });

const kgAProcesarSchema = z
  .string()
  .trim()
  .transform((v) => Number(v))
  .refine((v) => Number.isFinite(v) && v > 0, { message: "La cantidad debe ser mayor a 0." });

export const aplicarTuesteSchema = z.object({
  lote_origen_id: uuid,
  perfil_tueste_id: uuid,
  kg_a_procesar: kgAProcesarSchema,
  merma_pct: mermaSchema,
});

export const aplicarMolidoSchema = z.object({
  lote_origen_id: uuid,
  kg_a_procesar: kgAProcesarSchema,
  merma_pct: mermaSchema,
});

export const empacarLoteSchema = z.object({
  lote_origen_id: uuid,
  articulo_id: uuid,
  presentacion_id: uuid,
  unidades: z
    .string()
    .trim()
    .transform((v) => Number(v))
    .refine((v) => Number.isFinite(v) && v > 0, { message: "Las unidades deben ser mayores a 0." }),
  insumo_articulo_id: opcional(uuid),
});

export const clasificarCalidadSchema = z
  .object({
    lote_origen_id: uuid,
    primera_kg: kgOpcional,
    segunda_kg: kgOpcional,
    tercera_kg: kgOpcional,
    rechazo_kg: kgOpcional,
  })
  .refine((d) => d.primera_kg + d.segunda_kg + d.tercera_kg + d.rechazo_kg > 0, {
    message: "Indica al menos un peso mayor a 0 en alguna calidad.",
    path: ["primera_kg"],
  });

export const ajustarStockSchema = z.object({
  articulo_id: uuid,
  stock_nuevo: z
    .string()
    .trim()
    .transform((v) => Number(v))
    .refine((v) => Number.isFinite(v) && v >= 0, { message: "El stock debe ser mayor o igual a 0." }),
});

export const ajustarPrecioSchema = z.object({
  articulo_id: uuid,
  precio_nuevo: z
    .string()
    .trim()
    .transform((v) => Number(v))
    .refine((v) => Number.isFinite(v) && v >= 0, { message: "El precio debe ser mayor o igual a 0." }),
});

export const configuracionSchema = z.object({
  factor_kg_por_cajuela: z
    .string()
    .trim()
    .transform((v) => Number(v))
    .refine((v) => Number.isFinite(v) && v > 0, { message: "El factor debe ser mayor a 0." }),
});
