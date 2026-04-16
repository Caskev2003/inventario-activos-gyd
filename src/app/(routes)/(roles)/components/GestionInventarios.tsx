"use client";

import { SucursalTapachula } from "../../gestion_almacen/components/SucursalTapachula";
import { SucursalHidalgo } from "../../gestion_almacen/components/SucursalHidalgo";
import { SucursalToscana } from "../../gestion_almacen/components/SucursalToscana";
import { SucursalTuxtla } from "../../gestion_almacen/components/SucursalTuxtla";
import { OficinasAdministrativas } from "../../gestion_almacen/components/OficinasAdministrativas";
import { AlmacenHidalgo } from "../../gestion_almacen/components/AlmacenHidalgo";
import { AlmacenTuxtla } from "../../gestion_almacen/components/AlmacenTuxtla";

export function GestionInventarios() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8 justify-items-center w-full">
      <SucursalTapachula />
      <SucursalHidalgo />
      <SucursalToscana />
      <SucursalTuxtla />
      <OficinasAdministrativas />
      <AlmacenHidalgo />
      <AlmacenTuxtla />
    </div>
  );
}