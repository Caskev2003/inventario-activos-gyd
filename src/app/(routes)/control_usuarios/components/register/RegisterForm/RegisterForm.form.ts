// src/components/forms/RegisterForm.form.ts
import { z } from "zod"

const roles = [
  "ADMINISTRADOR",
  "SUPERVISOR",
  "CAPTURISTA",
  "CONSULTA",
] as const

export const formSchema = z
  .object({
    nombre: z
      .string()
      .min(1, "El nombre es obligatorio")
      .max(100, "El nombre no debe exceder 100 caracteres"),

    correo: z
      .string()
      .email("Debe ser un correo válido")
      .max(120, "El correo no debe exceder 120 caracteres"),

    imagen: z
      .string()
      .optional()
      .or(z.literal("")),

    rol: z.enum(roles, {
      errorMap: () => ({ message: "Selecciona un rol válido" }),
    }),

    telefono: z
      .string()
      .max(20, "El teléfono no debe exceder 20 caracteres")
      .optional()
      .or(z.literal("")),

    password: z
      .string()
      .min(6, "La contraseña debe tener al menos 6 caracteres")
      .max(255, "La contraseña es demasiado larga"),

    repitPassword: z
      .string()
      .min(6, "La contraseña debe tener al menos 6 caracteres"),
  })
  .refine((data) => data.password === data.repitPassword, {
    message: "Las contraseñas no coinciden",
    path: ["repitPassword"],
  })