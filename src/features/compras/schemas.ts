import { z } from "zod";
import { loteBaseSchema, validarPesoSegunEtapa, opcional, numeroOpcional, uuid } from "@/features/inventario/schemas";

const costoTotalOpcional = numeroOpcional.refine((v) => v === null || v >= 0, {
  message: "El costo debe ser mayor o igual a 0.",
});
const camposComerciales = {
  fecha_compra: opcional(z.string()),
  costo_total: costoTotalOpcional,
  numero_factura: opcional(z.string().trim().max(100)),
  notas: opcional(z.string().trim().max(1000)),
};

// Una compra de lote siempre tiene proveedor (a diferencia de un lote suelto,
// donde es opcional) y agrega los campos comerciales sobre los mismos datos
// de lote que ya se capturan en Inventario.
export const registrarCompraLoteSchema = loteBaseSchema
  .extend({
    proveedor_id: uuid,
    ...camposComerciales,
  })
  .superRefine(validarPesoSegunEtapa);

// Compra de insumo o producto terminado: no genera un lote, solo suma
// existencias al artículo seleccionado.
export const registrarCompraArticuloSchema = z.object({
  proveedor_id: uuid,
  articulo_id: uuid,
  cantidad: z
    .string()
    .trim()
    .transform((v) => Number(v))
    .refine((v) => Number.isFinite(v) && v > 0, { message: "La cantidad debe ser mayor a 0." }),
  ...camposComerciales,
});

export const actualizarCompraSchema = z.object(camposComerciales);
