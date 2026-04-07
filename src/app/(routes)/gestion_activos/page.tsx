import { auth } from "../../../../auth";
import { redirect } from "next/navigation";
import { TablaActivos } from "./components/tabla-activos";
import Link from "next/link";
import ImportarExcelActivos from "./components/importar-excel/ImportarExcelActivos";
import BotonRefrescar from "./components/boton-refrescar/BotonRefrescar";

type Sucursal =
  | "TAPACHULA"
  | "TOSCANA"
  | "CIUDAD_HIDALGO"
  | "TUXTLA_GUTIERREZ"
  | "OFICINAS_ADMINISTRATIVAS";

const SUCURSALES_VALIDAS: Sucursal[] = [
  "TAPACHULA",
  "TOSCANA",
  "CIUDAD_HIDALGO",
  "TUXTLA_GUTIERREZ",
  "OFICINAS_ADMINISTRATIVAS",
];

function esSucursalValida(valor?: string): valor is Sucursal {
  return !!valor && SUCURSALES_VALIDAS.includes(valor as Sucursal);
}

function formatearSucursal(sucursal: Sucursal) {
  switch (sucursal) {
    case "TAPACHULA":
      return "Tapachula";
    case "TOSCANA":
      return "Toscana";
    case "CIUDAD_HIDALGO":
      return "Ciudad Hidalgo";
    case "TUXTLA_GUTIERREZ":
      return "Tuxtla Gutiérrez";
    case "OFICINAS_ADMINISTRATIVAS":
      return "Oficinas Administrativas";
    default:
      return sucursal;
  }
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

  return (
    <div className="p-6 min-h-screen bg-[#2b2b2b]">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/gestion_almacen"
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-full text-sm"
          >
            ← Regresar
          </Link>

          <div>
            <h1 className="text-3xl font-bold text-white">
              GESTIÓN DE ACTIVOS FIJOS
            </h1>

            <p className="text-sm text-gray-300 mt-1">
              Sucursal actual:{" "}
              <span className="font-semibold text-white">
                {formatearSucursal(sucursal)}
              </span>
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <BotonRefrescar />
          <ImportarExcelActivos sucursal={sucursal} />

          <Link
            href={`/gestion_activos/components/registro-activos?sucursal=${sucursal}`}
            className="bg-[#1e3a5f] text-white hover:bg-green-600 h-10 px-6 rounded-full inline-flex items-center justify-center"
          >
            Nuevo activo
          </Link>
        </div>
      </div>

      <TablaActivos sucursalFiltro={sucursal} />
    </div>
  );
}