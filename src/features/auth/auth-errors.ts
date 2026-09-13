const MENSAJES: Record<string, string> = {
  "Invalid login credentials": "Correo o contraseña incorrectos.",
  "Email not confirmed": "Debes confirmar tu correo antes de iniciar sesión.",
  "User already registered": "Ya existe una cuenta con este correo.",
  "Password should be at least 6 characters": "La contraseña debe tener al menos 6 caracteres.",
  "Invalid email": "El correo no es válido.",
  "Email rate limit exceeded": "Se hicieron demasiados intentos. Espera unos minutos e inténtalo de nuevo.",
  "Network request failed": "No se pudo conectar con el servidor. Revisa tu conexión.",
};

export function traducirErrorAuth(mensaje: string | undefined | null): string {
  if (!mensaje) return "Ocurrió un error inesperado. Inténtalo de nuevo.";
  return MENSAJES[mensaje] ?? "Ocurrió un error al iniciar sesión. Inténtalo de nuevo.";
}
