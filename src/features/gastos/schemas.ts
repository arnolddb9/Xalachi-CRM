import { z } from "zod";
import { opcional, uuid } from "@/features/inventario/schemas";

export const registrarGastoSchema = z.object({
  categoria_id: uuid,
  descripcion: opcional(z.string().trim().max(500)),
  monto: z
    .string()
    .trim()
    .transform((v) => Number(v))
    .refine((v) => Number.isFinite(v) && v > 0, { message: "El monto debe ser mayor a 0." }),
  fecha: opcional(z.string()),
  numero_factura: opcional(z.string().trim().max(100)),
});
