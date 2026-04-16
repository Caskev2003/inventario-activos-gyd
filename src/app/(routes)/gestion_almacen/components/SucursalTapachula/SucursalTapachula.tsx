"use client";

import { TarjetaSucursal } from "../TarjetaSucursal";

interface Props {
  soloLectura?: boolean;
}


export function SucursalTapachula({ soloLectura = false }: Props) {
  return (
    <TarjetaSucursal
      titulo="Sucursal Tapachula"
      imagen="/iconos/tapachula.jpeg"
      sucursal="TAPACHULA"
      soloLectura={soloLectura}
    />
  );
}