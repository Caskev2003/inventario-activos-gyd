import { z } from "zod"

export const activoSchema = z.object({
  numeroControl: z
    .string()
    .min(1, "El número de control es obligatorio")
    .max(50, "Máximo 50 caracteres"),

  descripcionActivo: z
    .string()
    .min(1, "La descripción del activo es obligatoria")
    .max(150, "Máximo 150 caracteres"),

  existencia: z.coerce
    .number()
    .min(1, "La existencia debe ser mayor a 0"),

  medidas: z
    .string()
    .max(100, "Máximo 100 caracteres")
    .optional()
    .or(z.literal("")),

  modeloMarca: z
    .string()
    .max(150, "Máximo 150 caracteres")
    .optional()
    .or(z.literal("")),

  numeroSerie: z
    .string()
    .max(100, "Máximo 100 caracteres")
    .optional()
    .or(z.literal("")),

  condicionesActivo: z
    .string()
    .max(150, "Máximo 150 caracteres")
    .optional()
    .or(z.literal("")),

  observaciones: z
    .string()
    .optional()
    .or(z.literal("")),

  sucursal: z.enum([
    "TAPACHULA",
    "TOSCANA",
    "CIUDAD_HIDALGO",
    "TUXTLA_GUTIERREZ",
  ]),

  ubicacion: z
    .string()
    .max(150, "Máximo 150 caracteres")
    .optional()
    .or(z.literal("")),

  responsableDirectoId: z.coerce
    .number()
    .min(1, "El responsable directo es obligatorio"),

  status: z.enum([
    "ACTIVO",
    "INACTIVO",
    "MANTENIMIENTO",
    "BAJA",
  ]),
})

export type ActivosFormValues = z.infer<typeof activoSchema>