"use client";

import { TarjetaSucursal } from "../TarjetaSucursal";

interface Props {
  soloLectura?: boolean;
}

export function AlmacenHidalgo({ soloLectura = false }: Props) {
  return (
    <TarjetaSucursal
      titulo="Almacen Ciudad Hidalgo"
      imagen="/iconos/almacen.jpeg"
      sucursal="ALMACEN_CIUDAD_HIDALGO"
      soloLectura={soloLectura}
    />
  );
}