import { SucursalTapachula } from "./components/SucursalTapachula";
import { SucursalHidalgo } from "./components/SucursalHidalgo";
import { SucursalToscana } from "./components/SucursalToscana";
import { SucursalTuxtla } from "./components/SucursalTuxtla";
import { OficinasAdministrativas } from "./components/OficinasAdministrativas";
import { auth } from "../../../../auth";
import { redirect } from "next/navigation";
import { ButtonRegresar } from "./components/ButtonRegresar";
import { AlmacenHidalgo } from "./components/AlmacenHidalgo";
import { AlmacenTuxtla } from "./components/AlmacenTuxtla";

export default async function Page() {
  const session = await auth();

  if (!session || !session.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-[#2b2b2b] px-4 md:px-8 py-10">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10 text-center">
          <h1 className="text-white text-2xl md:text-4xl font-bold">
            GESTIÓN DE ACTIVOS FIJOS
          </h1>
          <p className="text-gray-300 text-sm md:text-base mt-3">
            Selecciona una sucursal para administrar activos, historial y reportes
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8 justify-items-center">
          <SucursalTapachula />
          <SucursalHidalgo />
          <SucursalToscana />
          <SucursalTuxtla />
          <OficinasAdministrativas />
          <AlmacenHidalgo />
          <AlmacenTuxtla />
         
          
        </div>

        <div className="flex justify-center mt-10">
          <ButtonRegresar />
        </div>
      </div>
    </div>
  );
}