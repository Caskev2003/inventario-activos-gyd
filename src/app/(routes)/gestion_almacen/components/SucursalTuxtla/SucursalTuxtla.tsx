"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const SUCURSAL = "TUXTLA_GUTIERREZ";

export function SucursalTuxtla() {
  const [showMenu, setShowMenu] = useState(false);
  const [clickTimeout, setClickTimeout] = useState<NodeJS.Timeout | null>(null);
  const router = useRouter();

  const handleNavigation = (route: string) => {
    router.push(route);
  };

  const handleClick = () => {
    if (clickTimeout) {
      clearTimeout(clickTimeout);
      setClickTimeout(null);
      handleNavigation(`/gestion_activos?sucursal=${SUCURSAL}`);
    } else {
      const timeout = setTimeout(() => {
        setShowMenu((prev) => !prev);
        setClickTimeout(null);
      }, 250);
      setClickTimeout(timeout);
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-[320px]">
      <div
        className="relative w-44 h-44 md:w-56 md:h-56 lg:w-64 lg:h-64 rounded-full flex items-center justify-center cursor-pointer hover:shadow-lg transition duration-300 shadow-[0_0_0_4px_#007bff,0_0_0_8px_black,0_0_0_12px_white]"
        onClick={handleClick}
      >
        <img
          src="/iconos/tuxtla.png"
          alt="Sucursal Tuxtla Gutierrez"
          className="w-full h-full rounded-full object-cover"
        />
      </div>

      <p className="text-white text-center mt-4 text-lg md:text-xl lg:text-2xl font-semibold">
        SUCURSAL TUXTLA GUTIERREZ
      </p>

      <button
        onClick={() => setShowMenu((prev) => !prev)}
        className="mt-4 bg-[#0D0A62] text-white text-sm md:text-base px-5 py-2 rounded-full shadow-lg hover:bg-blue-500 border-white border-2 transition-all duration-300"
      >
        {showMenu ? "Ocultar opciones" : "Ver opciones"}
      </button>

      {showMenu && (
        <div className="mt-4 w-full bg-[#1e1e2f] p-4 rounded-2xl shadow-2xl flex flex-col gap-3">
          
          {/* Gestión */}
          <button
            className="bg-[#0D0A62] text-white text-sm md:text-base px-4 py-3 rounded-full shadow-lg transition-all duration-300 hover:bg-blue-500 border-white border-2"
            onClick={() =>
              handleNavigation(`/gestion_activos?sucursal=${SUCURSAL}`)
            }
          >
            📦 Gestión de activos
          </button>

          {/* Historial */}
          <button
            className="bg-[#0D0A62] text-white text-sm md:text-base px-4 py-3 rounded-full shadow-lg transition-all duration-300 hover:bg-blue-500 border-white border-2"
            onClick={() =>
              handleNavigation(`/historial-activos?sucursal=${SUCURSAL}`)
            }
          >
            📜 Historial
          </button>

          {/* Reportes */}
          <button
            className="bg-[#0D0A62] text-white text-sm md:text-base px-4 py-3 rounded-full shadow-lg transition-all duration-300 hover:bg-blue-500 border-white border-2"
            onClick={() =>
              handleNavigation(`/reportes-activos?sucursal=${SUCURSAL}`)
            }
          >
            📊 Reportes
          </button>
        </div>
      )}
    </div>
  );
}