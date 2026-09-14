import { z } from "zod";

const nombreObligatorio = z.string().trim().min(1, "El nombre es obligatorio.").max(200);
const textoOpcional = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : null));
const descripcionOpcional = textoOpcional(1000);

export const CATALOGOS_GESTIONABLES = [
  "variedades",
  "procesos_beneficiado",
  "perfiles_tueste",
  "presentaciones",
  "proveedores",
  "clientes",
  "fincas",
  "articulos",
] as const;

export type CatalogoGestionable = (typeof CATALOGOS_GESTIONABLES)[number];

export const variedadSchema = z.object({
  nombre: nombreObligatorio,
  descripcion: descripcionOpcional,
});

export const procesoBeneficiadoSchema = z.object({
  nombre: nombreObligatorio,
  descripcion: descripcionOpcional,
});

export const perfilTuesteSchema = z.object({
  nombre: nombreObligatorio,
  nivel: z.enum(["claro", "medio", "oscuro"], {
    message: "Selecciona un nivel de tueste válido.",
  }),
  descripcion: descripcionOpcional,
});

export const presentacionSchema = z.object({
  nombre: nombreObligatorio,
  peso_gramos: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? Number(v) : null))
    .refine((v) => v === null || (Number.isFinite(v) && v > 0), {
      message: "El peso debe ser un número mayor a 0.",
    }),
});

const emailOpcional = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .transform((v) => (v ? v : null))
  .refine((v) => v === null || z.email().safeParse(v).success, {
    message: "El correo no es válido.",
  });

export const proveedorSchema = z.object({
  nombre: nombreObligatorio,
  telefono: textoOpcional(30),
  email: emailOpcional,
  direccion: textoOpcional(300),
  notas: descripcionOpcional,
});

export const clienteSchema = z.object({
  nombre: nombreObligatorio,
  tipo: z.enum(["menudeo", "mayoreo"], { message: "Selecciona un tipo de cliente válido." }),
  telefono: textoOpcional(30),
  email: emailOpcional,
  direccion: textoOpcional(300),
  notas: descripcionOpcional,
});

export const fincaSchema = z.object({
  nombre: nombreObligatorio,
  descripcion: descripcionOpcional,
});

export const articuloSchema = z.object({
  nombre: nombreObligatorio,
  tipo: z.enum(["insumo", "producto_terminado"], {
    message: "Selecciona un tipo de artículo válido.",
  }),
  unidad_medida: z.string().trim().min(1, "Indica la unidad de medida.").max(30),
});

const ETAPAS_RESERVADAS = ["cereza", "pergamino", "verde"];

export const pasoBeneficiadoSchema = z.object({
  nombre: nombreObligatorio.refine((v) => !ETAPAS_RESERVADAS.includes(v.trim().toLowerCase()), {
    message: "Ese nombre está reservado para una etapa general del inventario.",
  }),
  orden: z
    .string()
    .trim()
    .transform((v) => Number(v))
    .refine((v) => Number.isInteger(v) && v > 0, { message: "El orden debe ser un entero mayor a 0." }),
});

export const SCHEMAS_CATALOGOS: Record<CatalogoGestionable, z.ZodTypeAny> = {
  variedades: variedadSchema,
  procesos_beneficiado: procesoBeneficiadoSchema,
  perfiles_tueste: perfilTuesteSchema,
  presentaciones: presentacionSchema,
  proveedores: proveedorSchema,
  clientes: clienteSchema,
  fincas: fincaSchema,
  articulos: articuloSchema,
};
