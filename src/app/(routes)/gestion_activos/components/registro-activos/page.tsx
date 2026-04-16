import { auth } from "../../../../../../auth";
import { redirect } from "next/navigation";
import { ActivosForm } from "./ActivosForm";

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
    case "CIUDAD_HIDALGO":
      return "Ciudad Hidalgo";
    case "TOSCANA":
      return "Toscana";
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

  return (
    <div className="min-h-screen bg-[#2b2b2b] px-3 pb-4 pt-12">
      <div className="mx-auto max-w-3xl rounded-xl border border-white/10 bg-[#353535] p-4 shadow-xl md:p-6">
        <h1 className="text-center text-lg font-bold text-white md:text-2xl">
          REGISTRAR ACTIVO
        </h1>

        <p className="mt-2 mb-5 text-center text-sm text-gray-300 md:text-base">
          Sucursal actual:{" "}
          <span className="font-semibold text-white">
            {formatearSucursal(sucursal)}
          </span>
        </p>

        <ActivosForm />
      </div>
    </div>
  );
}