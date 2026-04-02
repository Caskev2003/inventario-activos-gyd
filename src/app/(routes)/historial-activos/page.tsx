import { auth } from "../../../../auth";
import { redirect } from "next/navigation";
import { TablaHistorial } from "./components/tabla-historial";
import Link from "next/link";

interface PageProps {
  searchParams?: {
    sucursal?: string;
  };
}

export default async function Page({ searchParams }: PageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const sucursal = searchParams?.sucursal;

  if (!sucursal) {
    redirect("/gestion_almacen");
  }

  return (
    <div className="p-6 min-h-screen bg-[#2b2b2b]">
      
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        
        <div className="flex items-center gap-3">
          <Link
            href="/gestion_almacen"
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-full text-sm"
          >
            ← Regresar
          </Link>

          <h1 className="text-3xl font-bold text-white">
            HISTORIAL DE MOVIMIENTOS
          </h1>
        </div>
      </div>

      <TablaHistorial sucursalFiltro={sucursal} />
    </div>
  );
}