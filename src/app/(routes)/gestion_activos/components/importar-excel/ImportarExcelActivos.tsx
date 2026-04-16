"use client";

import { useRef, useState } from "react";

type Sucursal =
  | "TAPACHULA"
  | "CIUDAD_HIDALGO"
  | "TOSCANA"
  | "TUXTLA_GUTIERREZ"
  | "OFICINAS_ADMINISTRATIVAS"
  | "ALMACEN_CIUDAD_HIDALGO"
  | "ALMACEN_TUXTLA_GUTIERREZ";

interface Props {
  sucursal: Sucursal;
}

export default function ImportarExcelActivos({ sucursal }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [errores, setErrores] = useState<string[]>([]);

  const limpiarInputArchivo = () => {
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleSeleccionarArchivo = () => {
    if (!loading) {
      inputRef.current?.click();
    }
  };

  const handleArchivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const nombreArchivo = file.name.toLowerCase();
    const extensionValida =
      nombreArchivo.endsWith(".xlsx") || nombreArchivo.endsWith(".xls");

    if (!extensionValida) {
      setMensaje("Solo se permiten archivos de Excel (.xlsx o .xls).");
      setErrores([]);
      limpiarInputArchivo();
      return;
    }

    try {
      setLoading(true);
      setMensaje("");
      setErrores([]);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("sucursal", sucursal);

      const res = await fetch("/api/activos/importar", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Error al importar el archivo.");
      }

      const mensajeExito = `Importación completada. Insertados: ${data.totalInsertados}, Actualizados: ${data.totalActualizados}, Errores: ${data.totalErrores}`;

      setMensaje(mensajeExito);

      if (Array.isArray(data.errores) && data.errores.length > 0) {
        setErrores(data.errores);
      }

      setTimeout(() => {
        window.location.reload();
      }, 800);
    } catch (error: any) {
      setMensaje(error?.message || "Ocurrió un error al importar.");
      setErrores([]);
    } finally {
      setLoading(false);
      limpiarInputArchivo();
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
        className="hidden"
        onChange={handleArchivo}
      />

      <button
        type="button"
        onClick={handleSeleccionarArchivo}
        disabled={loading}
        className="inline-flex h-10 items-center justify-center rounded-full bg-amber-500 px-6 text-white hover:bg-amber-600 disabled:opacity-60"
      >
        {loading ? "Importando..." : "Importar Excel"}
      </button>

      {mensaje && (
        <div className="max-w-[420px] rounded-lg border border-white/10 bg-white/10 p-3 text-sm text-white">
          {mensaje}
        </div>
      )}

      {errores.length > 0 && (
        <div className="max-h-40 max-w-[420px] overflow-y-auto rounded-lg border border-red-400/20 bg-red-500/10 p-3 text-xs text-red-200">
          <p className="mb-2 font-semibold">Detalles de errores:</p>
          <ul className="space-y-1">
            {errores.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}