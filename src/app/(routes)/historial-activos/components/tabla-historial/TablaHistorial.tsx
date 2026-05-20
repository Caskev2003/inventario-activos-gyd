"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Historial } from "./TablaHistorial.types";
import { toast } from "@/hooks/use-toast";

interface Props {
  sucursalFiltro?: string;
}

export function TablaHistorial({ sucursalFiltro }: Props) {
  const [historial, setHistorial] = useState<Historial[]>([]);
  const [loading, setLoading] = useState(false);
  const [buscar, setBuscar] = useState("");

  const fetchHistorial = async () => {
    try {
      setLoading(true);

      const params: any = {};

      if (sucursalFiltro) {
        params.sucursal = sucursalFiltro;
      }

      if (buscar.trim()) {
        params.buscar = buscar;
      }

      const { data } = await axios.get("/api/historial-activos", {
        params,
      });

      setHistorial(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);

      toast({
        title: "Error",
        description: "No se pudo cargar el historial",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistorial();
  }, [sucursalFiltro]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchHistorial();
    }, 300);

    return () => clearTimeout(timer);
  }, [buscar]);

  return (
    <div className="space-y-4">

      {/* BUSCADOR */}
      <div className="flex flex-col md:flex-row gap-3">

        <input
          type="text"
          placeholder="Buscar por activo, usuario, detalle o movimiento..."
          value={buscar}
          onChange={(e) => setBuscar(e.target.value)}
          className="
            w-full
            bg-[#3a3a3a]
            border
            border-gray-600
            text-white
            rounded-lg
            px-4
            py-3
            outline-none
            focus:border-blue-500
          "
        />

      </div>

      {/* TABLA */}
      <div className="overflow-x-auto rounded-lg border border-gray-700">

        <table className="min-w-full text-sm border-collapse">

          <thead className="bg-[#1e3a5f] text-white">
            <tr>
              <th className="p-3 text-left whitespace-nowrap">Activo</th>

              <th className="p-3 text-left whitespace-nowrap">
                Descripción
              </th>

              <th className="p-3 text-left whitespace-nowrap">
                Movimiento
              </th>

              <th className="p-3 text-left whitespace-nowrap">
                Detalle
              </th>

              <th className="p-3 text-left whitespace-nowrap">
                Sucursal
              </th>

              <th className="p-3 text-left whitespace-nowrap">
                Usuario
              </th>

              <th className="p-3 text-left whitespace-nowrap">
                Fecha y hora
              </th>
            </tr>
          </thead>

          <tbody>

            {loading && (
              <tr>
                <td
                  colSpan={7}
                  className="
                    text-center
                    p-6
                    bg-[#424242]
                    text-white
                  "
                >
                  Cargando historial...
                </td>
              </tr>
            )}

            {!loading && historial.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="
                    text-center
                    p-6
                    bg-[#424242]
                    text-red-400
                  "
                >
                  No hay historial registrado
                </td>
              </tr>
            )}

            {!loading &&
              historial.map((item) => (
                <tr
                  key={item.id}
                  className="
                    border-b
                    border-gray-700
                    bg-[#424242]
                    text-white
                    hover:bg-[#4a4a4a]
                    transition
                  "
                >
                  {/* ACTIVO */}
                  <td className="p-3 font-semibold whitespace-nowrap">
                    {item.numeroControl}
                  </td>

                  {/* DESCRIPCION */}
                  <td className="p-3 min-w-[220px]">
                    {item.descripcion || "-"}
                  </td>

                  {/* MOVIMIENTO */}
                  <td className="p-3 whitespace-nowrap">
                    <span
                      className={`
                        px-3
                        py-1
                        rounded-full
                        text-xs
                        font-bold

                        ${
                          item.tipoMovimiento === "ALTA"
                            ? "bg-green-600"
                            : item.tipoMovimiento === "BAJA"
                            ? "bg-red-600"
                            : item.tipoMovimiento === "CAMBIO_STATUS"
                            ? "bg-yellow-600"
                            : "bg-blue-600"
                        }
                      `}
                    >
                      {item.tipoMovimiento}
                    </span>
                  </td>

                  {/* DETALLE */}
                  <td className="p-3 min-w-[500px] text-gray-200">
                    {item.detalle || "-"}
                  </td>

                  {/* SUCURSAL */}
                  <td className="p-3 whitespace-nowrap">
                    {item.sucursal}
                  </td>

                  {/* USUARIO */}
                  <td className="p-3 whitespace-nowrap">
                    {item.usuarioMostrado ||
                      item.usuarioNombre ||
                      "-"}
                  </td>

                  {/* FECHA */}
                  <td className="p-3 whitespace-nowrap">
                    {item.fechaMexico ||
                      new Date(item.fecha).toLocaleString(
                        "es-MX",
                        {
                          timeZone: "America/Mexico_City",
                        }
                      )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}