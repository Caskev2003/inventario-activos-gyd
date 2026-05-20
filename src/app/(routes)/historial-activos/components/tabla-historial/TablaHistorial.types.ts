export interface Historial {
  id: number;
  activoId: number;

  numeroControl: string;

  descripcion?: string | null;

  tipoMovimiento:
    | "ALTA"
    | "EDICION"
    | "BAJA"
    | "CAMBIO_STATUS"
    | "CAMBIO_UBICACION"
    | "TRANSFERENCIA";

  detalle?: string | null;

  sucursal: string;

  usuarioId?: number | null;

  usuarioNombre?: string | null;

  usuarioMostrado?: string | null;

  fecha: string;

  fechaMexico?: string;
}