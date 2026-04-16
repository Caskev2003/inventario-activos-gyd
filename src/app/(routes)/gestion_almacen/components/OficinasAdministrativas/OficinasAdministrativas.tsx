"use client";

import { TarjetaSucursal } from "../TarjetaSucursal";

interface Props {
  soloLectura?: boolean;
}

export function OficinasAdministrativas({ soloLectura = false }: Props) {
  return (
    <TarjetaSucursal
      titulo="Oficinas Administrativas"
      imagen="/iconos/oficina.png"
      sucursal="OFICINAS_ADMINISTRATIVAS"
      soloLectura={soloLectura}
    />
  );
}