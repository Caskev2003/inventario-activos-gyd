export type Activo = {
  id: number
  numeroControl: string
  descripcionActivo: string
  existencia: number
  medidas?: string | null
  modeloMarca?: string | null
  numeroSerie?: string | null
  condicionesActivo?: string | null
  observaciones?: string | null
  imagenActivo?: string | null
 sucursal:
  | "TAPACHULA"
  | "TOSCANA"
  | "CIUDAD_HIDALGO"
  | "TUXTLA_GUTIERREZ"
  | "OFICINAS_ADMINISTRATIVAS"
  ubicacion?: string | null
  responsableDirectoId?: number | null
  status: "ACTIVO" | "INACTIVO" | "MANTENIMIENTO" | "BAJA"
  createdAt: string | Date
  updatedAt: string | Date
  responsableDirecto?: {
    id: number
    nombre?: string | null
    correo?: string | null
  } | null
}