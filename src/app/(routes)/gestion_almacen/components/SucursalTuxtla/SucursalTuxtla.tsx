"use client";

import { TarjetaSucursal } from "../TarjetaSucursal";

interface Props {
  soloLectura?: boolean;
}

export function SucursalTuxtla({ soloLectura = false }: Props) {
  return (
    <TarjetaSucursal
      titulo="Sucursal Tuxtla Gutiérrez"
      imagen="/iconos/tuxtla.png"
      sucursal="TUXTLA_GUTIERREZ"
      soloLectura={soloLectura}
    />
  );
}