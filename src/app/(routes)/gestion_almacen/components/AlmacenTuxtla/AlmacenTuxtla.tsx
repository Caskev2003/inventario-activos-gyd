"use client";

import { TarjetaSucursal } from "../TarjetaSucursal";

interface Props {
  soloLectura?: boolean;
}

export function AlmacenTuxtla({ soloLectura = false }: Props) {
  return (
    <TarjetaSucursal
      titulo="Almacen Tuxtla Gutierrez"
      imagen="/iconos/tuxtla.png"
      sucursal="ALMACEN_TUXTLA_GUTIERREZ"
      soloLectura={soloLectura}
    />
  );
}