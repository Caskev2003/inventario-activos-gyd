import { z } from "zod";

export const activoSchema = z.object({
  numeroControl: z
    .string()
    .min(1, "El número de control es obligatorio")
    .max(100, "Máximo 100 caracteres"),

  descripcionActivo: z
    .string()
    .min(1, "La descripción del activo es obligatoria")
    .max(150, "Máximo 150 caracteres"),

  tipoEquipo: z.enum(
    [
      "EQUIPO_MOBILIARIO",
      "EQUIPO_OFICINA",
      "EQUIPO_REPARTO",
      "EQUIPO_TRANSPORTE",
    ],
    {
      message: "El tipo de equipo es obligatorio",
    }
  ),

  existencia: z.coerce.number().min(1, "La existencia debe ser mayor a 0"),

  medidas: z.string().max(100, "Máximo 100 caracteres").optional().or(z.literal("")),

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

  condicionIngreso: z.enum(
    ["NUEVO", "REACONDICIONADO", "USADO", "DONADO", "TRANSFERIDO"],
    {
      message: "La condición de ingreso es obligatoria",
    }
  ),

  observaciones: z.string().optional().or(z.literal("")),

  sucursal: z.enum([
    "TAPACHULA",
    "CIUDAD_HIDALGO",
    "TOSCANA",
    "TUXTLA_GUTIERREZ",
    "OFICINAS_ADMINISTRATIVAS",
    "ALMACEN_CIUDAD_HIDALGO",
    "ALMACEN_TUXTLA_GUTIERREZ",
  ]),

  ubicacion: z
    .string()
    .max(150, "Máximo 150 caracteres")
    .optional()
    .or(z.literal("")),

  status: z.enum(["ACTIVO", "INACTIVO", "MANTENIMIENTO", "BAJA"]),
});

export type ActivosFormValues = z.infer<typeof activoSchema>;