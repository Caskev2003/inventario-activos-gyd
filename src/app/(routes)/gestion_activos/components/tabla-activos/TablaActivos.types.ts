export type TipoEquipoActivo =
  | "EQUIPO_MOBILIARIO"
  | "EQUIPO_OFICINA"
  | "EQUIPO_REPARTO"
  | "EQUIPO_TRANSPORTE";

export type Activo = {
  id: number
  numeroControl: string
  descripcionActivo: string
  tipoEquipo: TipoEquipoActivo
  existencia: number
  medidas?: string | null
  modeloMarca?: string | null
  numeroSerie?: string | null
  condicionesActivo?: string | null
  observaciones?: string | null
  imagenActivo?: string | null
  sucursal:
    | "TAPACHULA"
    | "CIUDAD_HIDALGO"
    | "TOSCANA"
    | "TUXTLA_GUTIERREZ"
    | "OFICINAS_ADMINISTRATIVAS"
    | "ALMACEN_CIUDAD_HIDALGO"
    | "ALMACEN_TUXTLA_GUTIERREZ";
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