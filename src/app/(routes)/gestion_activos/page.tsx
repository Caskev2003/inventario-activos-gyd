import { auth } from "../../../../auth";
import { redirect } from "next/navigation";
import { TablaActivos } from "./components/tabla-activos";
import Link from "next/link";
import ImportarExcelActivos from "./components/importar-excel/ImportarExcelActivos";
import BotonRefrescar from "./components/boton-refrescar/BotonRefrescar";

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
    case "ALMACEN_CIUDAD_HIDALGO":
      return "Almacén Ciudad Hidalgo";
    case "ALMACEN_TUXTLA_GUTIERREZ":
      return "Almacén Tuxtla Gutiérrez";
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

  const soloLectura = session.user.rol === "CONSULTA";

  return (
    <div className="min-h-screen bg-[#2b2b2b] p-6">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={soloLectura ? "/consulta" : "/gestion_almacen"}
            className="rounded-full bg-gray-600 px-4 py-2 text-sm text-white hover:bg-gray-700"
          >
            ← Regresar
          </Link>

          <div>
            <h1 className="text-3xl font-bold text-white">
              {soloLectura ? "CONSULTA DE ACTIVOS FIJOS" : "GESTIÓN DE ACTIVOS FIJOS"}
            </h1>

            <p className="mt-1 text-sm text-gray-300">
              Sucursal actual:{" "}
              <span className="font-semibold text-white">
                {formatearSucursal(sucursal)}
              </span>
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          {!soloLectura && (
            <>
              <ImportarExcelActivos sucursal={sucursal} />

              <Link
                href={`/gestion_activos/reportes?sucursal=${sucursal}`}
                className="inline-flex h-10 items-center justify-center rounded-full bg-[#0D0A62] px-6 text-white hover:bg-blue-600"
              >
                Reportes
              </Link>

              <Link
                href={`/gestion_activos/components/registro-activos?sucursal=${sucursal}`}
                className="inline-flex h-10 items-center justify-center rounded-full bg-[#1e3a5f] px-6 text-white hover:bg-green-600"
              >
                Nuevo activo
              </Link>
            </>
          )}

          <BotonRefrescar />
        </div>
      </div>

      <TablaActivos
        sucursalFiltro={sucursal}
        creadoPorId={session.user.id ? Number(session.user.id) : undefined}
        soloLectura={soloLectura}
      />
    </div>
  );
}