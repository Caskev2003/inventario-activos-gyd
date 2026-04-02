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

  const fetchHistorial = async () => {
    try {
      setLoading(true);

      const params: any = {};

      if (sucursalFiltro) {
        params.sucursal = sucursalFiltro;
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

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm border-collapse bg-white">
        <thead className="bg-[#1e3a5f] text-white">
          <tr>
            <th className="p-3 text-left">Activo</th>
            <th className="p-3 text-left">Descripción</th>
            <th className="p-3 text-left">Movimiento</th>
            <th className="p-3 text-left">Sucursal</th>
            <th className="p-3 text-left">Usuario</th>
            <th className="p-3 text-left">Fecha</th>
          </tr>
        </thead>

        <tbody>
          {loading && (
            <tr>
              <td colSpan={6} className="text-center p-4 bg-gray-200">
                Cargando historial...
              </td>
            </tr>
          )}

          {!loading && historial.length === 0 && (
            <tr>
              <td colSpan={6} className="text-center p-4 text-red-500">
                No hay historial registrado
              </td>
            </tr>
          )}

          {!loading &&
            historial.map((item) => (
              <tr key={item.id} className="border-b bg-[#424242] text-white">
                <td className="p-2">{item.numeroControl}</td>
                <td className="p-2">{item.descripcion || "-"}</td>
                <td className="p-2">{item.tipoMovimiento}</td>
                <td className="p-2">{item.sucursal}</td>
                <td className="p-2">{item.usuarioNombre || "-"}</td>
                <td className="p-2">
                  {new Date(item.fecha).toLocaleString()}
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}