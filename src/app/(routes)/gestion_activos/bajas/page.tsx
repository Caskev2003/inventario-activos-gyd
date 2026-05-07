import { auth } from "../../../../../auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import TablaActivosBaja from "../components/tabla-bajas/TablaActivosBaja";

type Sucursal =
  | "TAPACHULA"
  | "CIUDAD_HIDALGO"
  | "TOSCANA"
  | "TUXTLA_GUTIERREZ"
  | "OFICINAS_ADMINISTRATIVAS"
  | "ALMACEN_CIUDAD_HIDALGO"
  | "ALMACEN_TUXTLA_GUTIERREZ";

const SUCURSALES_VALIDAS: Sucursal[] = [
  "TAPACHULA",
  "CIUDAD_HIDALGO",
  "TOSCANA",
  "TUXTLA_GUTIERREZ",
  "OFICINAS_ADMINISTRATIVAS",
  "ALMACEN_CIUDAD_HIDALGO",
  "ALMACEN_TUXTLA_GUTIERREZ",
];

function esSucursalValida(valor?: string): valor is Sucursal {
  return !!valor && SUCURSALES_VALIDAS.includes(valor as Sucursal);
}

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

  if (!esSucursalValida(sucursal)) {
    redirect("/gestion_almacen");
  }

  const soloLectura = session.user.rol === "CONSULTA";

  return (
    <div className="min-h-screen bg-[#2b2b2b] p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={`/gestion_activos?sucursal=${sucursal}`}
            className="rounded-full bg-gray-600 px-4 py-2 text-sm text-white hover:bg-gray-700"
          >
            ← Regresar
          </Link>

          <div>
            <h1 className="text-3xl font-bold text-white">
              ACTIVOS DADOS DE BAJA
            </h1>

            <p className="mt-1 text-sm text-gray-300">
              Aquí puedes reactivar activos dados de baja por error.
            </p>
          </div>
        </div>
      </div>

      <TablaActivosBaja sucursal={sucursal} soloLectura={soloLectura} />
    </div>
  );
}