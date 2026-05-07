export type TipoEquipoActivo =
  | "EQUIPO_MOBILIARIO"
  | "EQUIPO_OFICINA"
  | "EQUIPO_REPARTO"
  | "EQUIPO_TRANSPORTE";

export type CondicionIngreso =
  | "NUEVO"
  | "REACONDICIONADO"
  | "USADO"
  | "DONADO"
  | "TRANSFERIDO";

export type Sucursal =
  | "TAPACHULA"
  | "CIUDAD_HIDALGO"
  | "TOSCANA"
  | "TUXTLA_GUTIERREZ"
  | "OFICINAS_ADMINISTRATIVAS"
  | "ALMACEN_CIUDAD_HIDALGO"
  | "ALMACEN_TUXTLA_GUTIERREZ";

export type EstadoActivo = "ACTIVO" | "INACTIVO" | "MANTENIMIENTO" | "BAJA";

export type UsuarioActivo = {
  id: number;
  nombre?: string | null;
  correo?: string | null;
};

export type Activo = {
  id: number;
  numeroControl: string;
  descripcionActivo: string;
  tipoEquipo: TipoEquipoActivo;
  existencia: number;
  medidas?: string | null;
  modeloMarca?: string | null;
  numeroSerie?: string | null;

  condicionIngreso?: CondicionIngreso | null;

  observaciones?: string | null;
  imagenActivo?: string | null;
  sucursal: Sucursal;
  ubicacion?: string | null;

  responsableNombre?: string | null;
  responsableCargo?: string | null;

  creadoPorId?: number | null;
  creadoPor?: UsuarioActivo | null;

  status: EstadoActivo;
  createdAt: string | Date;
  updatedAt: string | Date;
};