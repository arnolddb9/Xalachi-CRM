import { z } from "zod";
import { uuid, opcional } from "@/features/inventario/schemas";

const numero = z
  .string()
  .trim()
  .transform((v) => Number(v))
  .refine((v) => Number.isFinite(v) && v > 0, { message: "La cantidad debe ser mayor a 0." });

const numeroOpcional = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .transform((v) => (v ? Number(v) : null));

export const registrarPedidoSchema = z.object({
  cliente_id: uuid,
  notas: opcional(z.string().trim().max(1000)),
});

export const agregarItemPedidoProductoSchema = z.object({
  pedido_id: uuid,
  articulo_id: uuid,
  cantidad: numero,
  precio_unitario: numeroOpcional,
  motivo_cambio_precio: opcional(z.string().trim().max(500)),
});

export const agregarItemPedidoGranelSchema = z.object({
  pedido_id: uuid,
  lote_id: uuid,
  cantidad_kg: numero,
  precio_unitario: numero,
});
