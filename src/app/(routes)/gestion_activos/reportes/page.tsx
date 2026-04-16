import { db } from "@/lib/db";
import Link from "next/link";

type Sucursal =
  | "TAPACHULA"
  | "CIUDAD_HIDALGO"
  | "TOSCANA"
  | "TUXTLA_GUTIERREZ"
  | "OFICINAS_ADMINISTRATIVAS"
  | "ALMACEN_CIUDAD_HIDALGO"
  | "ALMACEN_TUXTLA_GUTIERREZ";

interface Props {
  searchParams: Promise<{
    sucursal?: Sucursal;
  }>;
}

export default async function PageReportesActivos({ searchParams }: Props) {
  const params = await searchParams;
  const sucursal = params?.sucursal;

  const reportes = await db.reporte.findMany({
    where: sucursal ? { sucursal } : undefined,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      creadoPor: true,
    },
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Reportes</h1>
          <p className="text-sm text-gray-300">
            {sucursal
              ? `Reportes generados para la sucursal ${sucursal.replaceAll("_", " ")}.`
              : "Reportes generados desde el módulo de gestión de activos."}
          </p>
        </div>

        <Link
          href={sucursal ? `/gestion_activos?sucursal=${sucursal}` : "/gestion_activos"}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition"
        >
          Volver
        </Link>
      </div>

      <div className="rounded-xl border border-gray-700 bg-[#111827] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-white">
            <thead className="bg-[#1f2937] text-gray-200">
              <tr>
                <th className="px-4 py-3">Archivo</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Sucursal</th>
                <th className="px-4 py-3">Módulo</th>
                <th className="px-4 py-3">Creado por</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3 text-center">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {reportes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-gray-400">
                    {sucursal
                      ? `No hay reportes guardados para ${sucursal.replaceAll("_", " ")}.`
                      : "No hay reportes guardados todavía."}
                  </td>
                </tr>
              ) : (
                reportes.map((reporte) => (
                  <tr
                    key={reporte.id}
                    className="border-t border-gray-700 hover:bg-[#0f172a] transition"
                  >
                    <td className="px-4 py-3">{reporte.nombreArchivo}</td>
                    <td className="px-4 py-3">{reporte.tipoArchivo}</td>
                    <td className="px-4 py-3">
                      {reporte.sucursal
                        ? reporte.sucursal.replaceAll("_", " ")
                        : "GENERAL"}
                    </td>
                    <td className="px-4 py-3">{reporte.modulo ?? "-"}</td>
                    <td className="px-4 py-3">
                      {reporte.creadoPor?.nombre ?? "Sin usuario"}
                    </td>
                    <td className="px-4 py-3">
                      {new Date(reporte.createdAt).toLocaleString("es-MX")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <a
                          href={reporte.rutaArchivo}
                          download
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-md bg-green-600 hover:bg-green-700 text-white text-xs font-semibold transition"
                        >
                          Descargar
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}