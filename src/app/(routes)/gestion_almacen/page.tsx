import { SucursalTapachula } from "./components/SucursalTapachula";
import { SucursalHidalgo } from "./components/SucursalHidalgo";
import { SucursalToscana } from "./components/SucursalToscana";
import { SucursalTuxtla } from "./components/SucursalTuxtla";
import { auth } from "../../../../auth";
import { redirect } from "next/navigation";
import { ButtonRegresar } from "./components/ButtonRegresar";

export default async function Page() {
  const session = await auth();

  if (!session || !session.user) {
    redirect("/login");
  }

  return (
    <div className="relative bg-[#2b2b2b] min-h-screen overflow-hidden">
      <div className="mt-10 md:mt-28 lg:mt-42 mb-10 px-4">
        <h1 className="text-white text-xl md:text-3xl lg:text-4xl font-bold text-center">
          GESTIÓN DE ACTIVOS FIJOS
        </h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-16 w-full px-6 md:px-10 place-items-start">
        <SucursalTapachula />
        <SucursalHidalgo />
        <SucursalToscana />
        <SucursalTuxtla />
      </div>

      <div className="flex justify-center mt-10">
        <ButtonRegresar />
      </div>
    </div>
  );
}