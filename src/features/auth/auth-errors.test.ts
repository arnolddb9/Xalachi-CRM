import { describe, it, expect } from "vitest";
import { traducirErrorAuth } from "./auth-errors";

describe("traducirErrorAuth", () => {
  it("traduce credenciales inválidas", () => {
    expect(traducirErrorAuth("Invalid login credentials")).toBe(
      "Correo o contraseña incorrectos.",
    );
  });

  it("traduce correo no confirmado", () => {
    expect(traducirErrorAuth("Email not confirmed")).toBe(
      "Debes confirmar tu correo antes de iniciar sesión.",
    );
  });

  it("cae en un mensaje genérico en español para errores no mapeados", () => {
    expect(traducirErrorAuth("some unknown supabase error")).toBe(
      "Ocurrió un error al iniciar sesión. Inténtalo de nuevo.",
    );
  });

  it("maneja mensaje vacío o nulo", () => {
    expect(traducirErrorAuth(undefined)).toBe("Ocurrió un error inesperado. Inténtalo de nuevo.");
    expect(traducirErrorAuth(null)).toBe("Ocurrió un error inesperado. Inténtalo de nuevo.");
  });
});
