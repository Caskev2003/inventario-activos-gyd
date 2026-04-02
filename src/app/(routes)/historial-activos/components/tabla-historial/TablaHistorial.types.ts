export interface Historial {
  id: number;
  activoId: number;
  numeroControl: string;
  descripcion?: string;
  tipoMovimiento: string;
  detalle?: string;
  sucursal: string;
  usuarioNombre?: string;
  fecha: string;
}