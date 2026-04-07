import { auth } from "../../../../../../auth";
import { redirect } from "next/navigation";
import { ActivosForm } from "./ActivosForm";

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
    <div className="min-h-screen bg-[#2b2b2b] pt-12 pb-4 px-3">
      <div className="max-w-3xl mx-auto bg-[#353535] rounded-xl shadow-xl border border-white/10 p-4 md:p-6">
        <h1 className="text-lg md:text-2xl font-bold text-white text-center">
          REGISTRAR ACTIVO
        </h1>

        <p className="text-center text-gray-300 text-sm md:text-base mt-2 mb-5">
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