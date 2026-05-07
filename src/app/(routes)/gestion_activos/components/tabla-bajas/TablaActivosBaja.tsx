"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { RotateCcw } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface ActivoBaja {
  id: number;
  numeroControl: string;
  descripcionActivo: string;
  tipoEquipo?: string | null;
  existencia: number;
  sucursal: string;
  ubicacion?: string | null;
  status: string;
  createdAt?: string;
  responsableDirecto?: {
    nombre?: string | null;
  } | null;
}

interface Props {
  sucursal: string;
  soloLectura?: boolean;
}

function formatearTexto(valor?: string | null) {
  if (!valor) return "-";
  return valor.replaceAll("_", " ");
}

export default function TablaActivosBaja({ sucursal, soloLectura = false }: Props) {
  const [activos, setActivos] = useState<ActivoBaja[]>([]);
  const [loading, setLoading] = useState(false);
  const [reactivando, setReactivando] = useState<number | null>(null);

  const cargarBajas = async () => {
    try {
      setLoading(true);

      const { data } = await axios.get("/api/activos", {
        params: {
          sucursal,
          status: "BAJA",
        },
      });

      setActivos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los activos dados de baja.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const reactivarActivo = async (id: number) => {
    try {
      setReactivando(id);

      await axios.patch("/api/activos", {
        id,
        status: "ACTIVO",
      });

      toast({
        title: "Activo reactivado",
        description: "El activo volvió a estar ACTIVO y aparecerá en la tabla principal.",
      });

      cargarBajas();
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "No se pudo reactivar el activo.",
        variant: "destructive",
      });
    } finally {
      setReactivando(null);
    }
  };

  useEffect(() => {
    cargarBajas();
  }, [sucursal]);

  return (
    <div className="overflow-x-auto rounded-lg shadow">
      <table className="min-w-full text-sm border-collapse bg-white">
        <thead className="bg-red-800 text-white">
          <tr>
            <th className="p-3 text-left">N° Control</th>
            <th className="p-3 text-left">Descripción</th>
            <th className="p-3 text-left">Tipo de equipo</th>
            <th className="p-3 text-left">Existencia</th>
            <th className="p-3 text-left">Sucursal</th>
            <th className="p-3 text-left">Ubicación</th>
            <th className="p-3 text-left">Responsable</th>
            <th className="p-3 text-left">Status</th>
            <th className="p-3 text-center">Acción</th>
          </tr>
        </thead>

        <tbody>
          {loading && (
            <tr>
              <td colSpan={9} className="bg-[#424242] py-4 text-center text-white">
                Cargando activos dados de baja...
              </td>
            </tr>
          )}

          {!loading && activos.length === 0 && (
            <tr>
              <td colSpan={9} className="bg-[#424242] py-4 text-center text-white">
                No hay activos dados de baja.
              </td>
            </tr>
          )}

          {!loading &&
            activos.map((activo) => (
              <tr
                key={activo.id}
                className="border-b bg-[#424242] text-white hover:bg-gray-400 hover:text-black transition"
              >
                <td className="p-2">{activo.numeroControl}</td>
                <td className="p-2">{activo.descripcionActivo}</td>
                <td className="p-2">{formatearTexto(activo.tipoEquipo)}</td>
                <td className="p-2">{activo.existencia}</td>
                <td className="p-2">{formatearTexto(activo.sucursal)}</td>
                <td className="p-2">{activo.ubicacion || "-"}</td>
                <td className="p-2">{activo.responsableDirecto?.nombre || "-"}</td>
                <td className="p-2">
                  <span className="rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white">
                    {activo.status}
                  </span>
                </td>
                <td className="p-2 text-center">
                  {soloLectura ? (
                    <span className="text-xs text-gray-300">Solo lectura</span>
                  ) : (
                    <button
                      onClick={() => reactivarActivo(activo.id)}
                      disabled={reactivando === activo.id}
                      className="inline-flex items-center gap-2 rounded-md bg-green-600 px-3 py-1 text-white hover:bg-green-700 disabled:bg-gray-400"
                    >
                      <RotateCcw className="h-4 w-4" />
                      {reactivando === activo.id ? "Reactivando..." : "Reactivar"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}