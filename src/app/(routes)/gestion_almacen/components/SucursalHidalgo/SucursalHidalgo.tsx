"use client";

import { TarjetaSucursal } from "../TarjetaSucursal";

interface Props {
  soloLectura?: boolean;
}


export function SucursalHidalgo({ soloLectura = false }: Props) {
  return (
    <TarjetaSucursal
      titulo="Sucursal Ciudad Hidalgo"
      imagen="/iconos/cdhidalgo.jpg"
      sucursal="CIUDAD_HIDALGO"
       soloLectura={soloLectura}
    />
  );
}