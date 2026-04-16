import { Navbar } from "@/components/shared/Navbar";
import { auth } from "../../../../../auth";
import { redirect } from "next/navigation";
import { ButtonRegresar } from "../../gestion_almacen/components/ButtonRegresar";
import { GestionInventarios } from "../components/GestionInventarios";

export default async function Page() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (
    session.user.rol !== "ADMINISTRADOR" &&
    session.user.rol !== "AUXILIAR_INVENTARIOS"
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
              GESTIÓN DE INVENTARIOS
            </h1>
            <p className="text-gray-300 text-sm md:text-base mt-3">
              Selecciona una sucursal para administrar activos, historial y reportes
            </p>
          </div>

          <GestionInventarios />

          <div className="flex justify-center mt-10">
            <ButtonRegresar />
          </div>
        </div>
      </div>
    </div>
  );
}