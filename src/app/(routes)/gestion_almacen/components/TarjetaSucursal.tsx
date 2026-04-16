"use client";

import { useRouter } from "next/navigation";

type Sucursal =
  | "TAPACHULA"
  | "CIUDAD_HIDALGO"
  | "TOSCANA"
  | "TUXTLA_GUTIERREZ"
  | "OFICINAS_ADMINISTRATIVAS"
  | "ALMACEN_CIUDAD_HIDALGO"
  | "ALMACEN_TUXTLA_GUTIERREZ";

interface Props {
  titulo: string;
  imagen: string;
  sucursal: Sucursal;
  soloLectura?: boolean;
}

export function TarjetaSucursal({
  titulo,
  imagen,
  sucursal,
  soloLectura = false,
}: Props) {
  const router = useRouter();

  return (
    <div className="w-full max-w-[340px] rounded-3xl overflow-hidden border border-white/10 bg-[#353535] shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
      <div className="relative h-52 w-full overflow-hidden">
        <img
          src={imagen}
          alt={titulo}
          className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <h2 className="text-white text-xl md:text-2xl font-bold text-center drop-shadow-lg">
            {titulo}
          </h2>
        </div>
      </div>

      <div className="p-5 flex flex-col gap-3">
        {soloLectura ? (
          <button
            onClick={() => router.push(`/gestion_activos?sucursal=${sucursal}&modo=consulta`)}
            className="w-full rounded-xl bg-[#0D0A62] text-white py-3 text-sm md:text-base font-medium border border-white/20 hover:bg-blue-600 transition-all duration-300"
          >
            👁️ Ver tabla
          </button>
        ) : (
          <>
            <button
              onClick={() => router.push(`/gestion_activos?sucursal=${sucursal}`)}
              className="w-full rounded-xl bg-[#0D0A62] text-white py-3 text-sm md:text-base font-medium border border-white/20 hover:bg-blue-600 transition-all duration-300"
            >
              📦 Gestión de activos
            </button>

            <button
              onClick={() => router.push(`/historial-activos?sucursal=${sucursal}`)}
              className="w-full rounded-xl bg-[#0D0A62] text-white py-3 text-sm md:text-base font-medium border border-white/20 hover:bg-blue-600 transition-all duration-300"
            >
              📜 Historial
            </button>

            <button
              onClick={() => router.push(`/gestion_activos/reportes?sucursal=${sucursal}`)}
              className="w-full rounded-xl bg-[#0D0A62] text-white py-3 text-sm md:text-base font-medium border border-white/20 hover:bg-blue-600 transition-all duration-300"
            >
              📊 Reportes
            </button>
          </>
        )}
      </div>
    </div>
  );
}