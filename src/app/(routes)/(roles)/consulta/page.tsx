import { Navbar } from "@/components/shared/Navbar";
import { auth } from "../../../../../auth";
import { redirect } from "next/navigation";

import { SucursalTapachula } from "../../gestion_almacen/components/SucursalTapachula";
import { SucursalHidalgo } from "../../gestion_almacen/components/SucursalHidalgo";
import { SucursalToscana } from "../../gestion_almacen/components/SucursalToscana";
import { SucursalTuxtla } from "../../gestion_almacen/components/SucursalTuxtla";
import { OficinasAdministrativas } from "../../gestion_almacen/components/OficinasAdministrativas";
import { AlmacenHidalgo } from "../../gestion_almacen/components/AlmacenHidalgo";
import { AlmacenTuxtla } from "../../gestion_almacen/components/AlmacenTuxtla";

export default async function Page() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (
    session.user.rol !== "ADMINISTRADOR" &&
    session.user.rol !== "CONSULTA"
  ) {
    redirect("/no-autorizado");
  }

  return (
    <div className="min-h-screen bg-[#2b2b2b]">
      <Navbar />

      <div className="px-4 md:px-8 py-10 md:py-14">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10 text-center">
            <h1 className="text-white text-2xl md:text-4xl font-bold">
              CONSULTA DE ACTIVOS
            </h1>
            <p className="text-gray-300 text-sm md:text-base mt-3">
              Solo puedes visualizar la información de cada sucursal
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8 justify-items-center">
            <SucursalTapachula soloLectura />
            <SucursalHidalgo soloLectura />
            <SucursalToscana soloLectura />
            <SucursalTuxtla soloLectura />
            <OficinasAdministrativas soloLectura />
            <AlmacenHidalgo soloLectura />
            <AlmacenTuxtla soloLectura />
          </div>
        </div>
      </div>
    </div>
  );
}