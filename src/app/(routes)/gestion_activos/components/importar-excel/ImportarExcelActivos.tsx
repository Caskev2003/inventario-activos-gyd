"use client";

import { useRef, useState } from "react";

type Sucursal =
  | "TAPACHULA"
  | "TOSCANA"
  | "CIUDAD_HIDALGO"
  | "TUXTLA_GUTIERREZ"
  | "OFICINAS_ADMINISTRATIVAS";

interface Props {
  sucursal: Sucursal;
}

export default function ImportarExcelActivos({ sucursal }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [errores, setErrores] = useState<string[]>([]);

  const handleSeleccionarArchivo = () => {
    inputRef.current?.click();
  };

  const handleArchivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

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

      // Espera breve para que el usuario vea el mensaje
      setTimeout(() => {
        window.location.reload();
      }, 800);
    } catch (error: any) {
      setMensaje(error.message || "Ocurrió un error al importar.");
    } finally {
      setLoading(false);

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={handleArchivo}
      />

      <button
        type="button"
        onClick={handleSeleccionarArchivo}
        disabled={loading}
        className="bg-amber-500 hover:bg-amber-600 text-white h-10 px-6 rounded-full inline-flex items-center justify-center disabled:opacity-60"
      >
        {loading ? "Importando..." : "Importar Excel"}
      </button>

      {mensaje && (
        <div className="max-w-[420px] rounded-lg bg-white/10 border border-white/10 p-3 text-sm text-white">
          {mensaje}
        </div>
      )}

      {errores.length > 0 && (
        <div className="max-w-[420px] rounded-lg bg-red-500/10 border border-red-400/20 p-3 text-xs text-red-200 max-h-40 overflow-y-auto">
          <p className="font-semibold mb-2">Detalles de errores:</p>
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