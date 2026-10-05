import { z } from "zod";

export const ROLES = ["admin", "operador", "vendedor"] as const;

export const crearUsuarioSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio.").max(200),
  email: z.string().trim().email("Correo inválido."),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres."),
  role: z.enum(ROLES, { message: "Selecciona un rol válido." }),
});

export const cambiarPropiaContrasenaSchema = z
  .object({
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres."),
    confirmacion: z.string(),
  })
  .refine((data) => data.password === data.confirmacion, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmacion"],
  });
