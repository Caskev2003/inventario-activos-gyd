"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Trash2, FileSpreadsheet, Pencil } from "lucide-react";
import type { Activo } from "./TablaActivos.types";
import { ModalEditarActivo } from "../modal-editar-activo";

type Sucursal =
  | "TAPACHULA"
  | "TOSCANA"
  | "CIUDAD_HIDALGO"
  | "TUXTLA_GUTIERREZ";

interface Props {
  refrescar?: number;
  busqueda?: string;
  sucursalFiltro?: string;
}

const SUCURSALES_VALIDAS: Sucursal[] = [
  "TAPACHULA",
  "TOSCANA",
  "CIUDAD_HIDALGO",
  "TUXTLA_GUTIERREZ",
];

function esSucursalValida(valor: string): valor is Sucursal {
  return SUCURSALES_VALIDAS.includes(valor as Sucursal);
}

function formatearSucursal(sucursal?: string | null) {
  if (!sucursal) return "-";
  return sucursal.replaceAll("_", " ");
}

export function TablaActivos({
  refrescar = 0,
  busqueda = "",
  sucursalFiltro = "",
}: Props) {
  const [activos, setActivos] = useState<Activo[]>([]);
  const [activoSeleccionado, setActivoSeleccionado] = useState<Activo | null>(null);
  const [activoEditar, setActivoEditar] = useState<Activo | null>(null);
  const [openEditar, setOpenEditar] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const [loading, setLoading] = useState(false);

  const itemsPerPage = 10;

  const abrirModalEditar = (item: Activo) => {
    setActivoEditar(item);
    setOpenEditar(true);
  };

  const fetchActivos = async () => {
    try {
      setLoading(true);

      const params: Record<string, string> = {};

      if (sucursalFiltro.trim() !== "" && esSucursalValida(sucursalFiltro)) {
        params.sucursal = sucursalFiltro;
      }

      const { data } = await axios.get("/api/activos", { params });

      setActivos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error al cargar activos:", error);
      toast({
        title: "Error al cargar activos",
        description: "No se pudieron obtener los datos.",
        variant: "destructive",
      });
      setActivos([]);
    } finally {
      setLoading(false);
    }
  };

  const eliminarActivo = async (id: number, descripcion: string) => {
    try {
      const params = new URLSearchParams();
      params.append("id", String(id));

      if (sucursalFiltro.trim() !== "" && esSucursalValida(sucursalFiltro)) {
        params.append("sucursal", sucursalFiltro);
      }

      await axios.delete(`/api/activos?${params.toString()}`);

      toast({
        title: "Activo eliminado",
        description: `El activo "${descripcion}" fue eliminado correctamente.`,
      });

      setActivoSeleccionado(null);
      fetchActivos();
    } catch (error) {
      console.error("Error al eliminar:", error);
      toast({
        title: "Error al eliminar",
        description: "No se pudo eliminar el activo.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchActivos();
  }, [sucursalFiltro]);

  useEffect(() => {
    if (refrescar !== 0) {
      fetchActivos();
    }
  }, [refrescar]);

  useEffect(() => {
    setCurrentPage(1);
  }, [busqueda, sucursalFiltro]);

  const datosAMostrar = useMemo(() => {
    let datos = [...activos];

    if (busqueda.trim() !== "") {
      const q = busqueda.toLowerCase();

      datos = datos.filter((item) => {
        return (
          item.numeroControl.toLowerCase().includes(q) ||
          item.descripcionActivo.toLowerCase().includes(q) ||
          (item.numeroSerie ?? "").toLowerCase().includes(q) ||
          (item.modeloMarca ?? "").toLowerCase().includes(q) ||
          (item.ubicacion ?? "").toLowerCase().includes(q) ||
          (item.responsableDirecto?.nombre ?? "").toLowerCase().includes(q)
        );
      });
    }

    return datos;
  }, [activos, busqueda]);

  const totalPages = Math.max(1, Math.ceil(datosAMostrar.length / itemsPerPage));

  useEffect(() => {
    const clamped = Math.max(1, Math.min(currentPage, totalPages));
    if (clamped !== currentPage) {
      setCurrentPage(clamped);
    }
  }, [totalPages, currentPage]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = datosAMostrar.slice(indexOfFirstItem, indexOfLastItem);

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

  const goToPage = (page: number) => setCurrentPage(page);

  const buildPageList = (
    tp: number,
    cp: number
  ): (number | "ellipsis")[] => {
    if (tp <= 7) return Array.from({ length: tp }, (_, i) => i + 1);
    if (cp <= 4) return [1, 2, 3, 4, 5, "ellipsis", tp];
    if (cp >= tp - 3) return [1, "ellipsis", tp - 4, tp - 3, tp - 2, tp - 1, tp];
    return [1, "ellipsis", cp - 1, cp, cp + 1, "ellipsis", tp];
  };

  const pageList = buildPageList(totalPages, currentPage);

  const BadgeStatus = ({ status }: { status: Activo["status"] }) => {
    const classes =
      status === "ACTIVO"
        ? "bg-green-500 text-white border border-green-700"
        : status === "INACTIVO"
        ? "bg-gray-500 text-white border border-gray-700"
        : status === "MANTENIMIENTO"
        ? "bg-yellow-400 text-gray-900 border border-yellow-700"
        : "bg-red-500 text-white border border-red-700";

    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${classes}`}
      >
        {status}
      </span>
    );
  };

  const exportarExcel = async () => {
    if (!datosAMostrar.length) return;

    setExporting(true);

    try {
      const ExcelJS = await import("exceljs");
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet("Activos");

      const headers = [
        "Número de control",
        "Descripción del activo",
        "Existencia",
        "Medidas",
        "Modelo/Marca",
        "Número de serie",
        "Condiciones",
        "Observaciones",
        "Sucursal",
        "Ubicación",
        "Responsable",
        "Status",
        "Creado",
      ];

      const data = datosAMostrar.map((a) => [
        a.numeroControl,
        a.descripcionActivo ?? "",
        Number(a.existencia ?? 0),
        a.medidas ?? "",
        a.modeloMarca ?? "",
        a.numeroSerie ?? "",
        a.condicionesActivo ?? "",
        a.observaciones ?? "",
        formatearSucursal(a.sucursal),
        a.ubicacion ?? "",
        a.responsableDirecto?.nombre ?? (a.responsableDirectoId ?? ""),
        a.status ?? "",
        a.createdAt ? new Date(a.createdAt as any).toLocaleDateString() : "",
      ]);

      ws.addTable({
        name: "TablaActivos",
        ref: "A1",
        headerRow: true,
        totalsRow: false,
        style: {
          theme: "TableStyleMedium9",
          showRowStripes: true,
        },
        columns: headers.map((h) => ({ name: h })),
        rows: data,
      });

      ws.views = [{ state: "frozen", ySplit: 1 }];

      for (let c = 1; c <= headers.length; c++) {
        let max = headers[c - 1].length;

        for (const row of data) {
          const len = String(row[c - 1] ?? "").length;
          if (len > max) max = len;
        }

        ws.getColumn(c).width = Math.min(Math.max(max + 2, 10), 50);
      }

      const buf = await wb.xlsx.writeBuffer();
      const blob = new Blob([buf], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const dt = new Date();
      const stamp = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(
        2,
        "0"
      )}-${String(dt.getDate()).padStart(2, "0")}__${String(
        dt.getHours()
      ).padStart(2, "0")}${String(dt.getMinutes()).padStart(2, "0")}`;

      const nombreSucursal =
        sucursalFiltro && esSucursalValida(sucursalFiltro)
          ? `-${sucursalFiltro}`
          : "";

      const name = `Activos${nombreSucursal}-${stamp}.xlsx`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");

      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      toast({
        title: "No se pudo generar el Excel",
        description: "Verifica la instalación de exceljs.",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="overflow-x-auto mt-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-bold text-white">
          Activos fijos
          {sucursalFiltro && esSucursalValida(sucursalFiltro) && (
            <span className="ml-2 text-sm font-medium text-blue-300">
              ({formatearSucursal(sucursalFiltro)})
            </span>
          )}
        </h3>

        <button
          onClick={exportarExcel}
          disabled={exporting || !datosAMostrar.length}
          className={`group inline-flex items-center gap-2 rounded-xl px-4 py-2 font-semibold shadow-md transition ${
            exporting || !datosAMostrar.length
              ? "bg-gray-300 text-gray-600 cursor-not-allowed"
              : "bg-gradient-to-r from-emerald-500 via-green-600 to-emerald-700 text-white hover:brightness-110 active:scale-[0.98]"
          }`}
          title={
            !datosAMostrar.length ? "No hay datos para exportar" : "Exportar a Excel"
          }
        >
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-white/20 backdrop-blur-sm">
            <FileSpreadsheet className="h-4 w-4" />
          </span>
          {exporting ? "Exportando..." : "Exportar Excel"}
        </button>
      </div>

      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
          <div className="text-sm font-medium text-blue-300">
            Mostrando registros{" "}
            <span className="font-bold text-blue-100">
              {datosAMostrar.length === 0 ? 0 : indexOfFirstItem + 1}
              -
              {Math.min(indexOfLastItem, datosAMostrar.length)}
            </span>{" "}
            de <span className="font-bold">{datosAMostrar.length}</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-sm font-medium text-blue-300">
              Página <span className="font-bold text-blue-100">{currentPage}</span> de{" "}
              <span className="font-bold">{totalPages}</span>
            </div>

            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className={`px-3 py-1 text-sm rounded-md font-medium transition-all ${
                currentPage === 1
                  ? "text-gray-500 bg-gray-200 cursor-not-allowed"
                  : "text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-md"
              }`}
            >
              ANTERIOR
            </button>

            <div className="flex gap-1 items-center">
              {pageList.map((p, i) =>
                p === "ellipsis" ? (
                  <span key={`el-${i}`} className="px-2 text-blue-300 select-none">
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => goToPage(p)}
                    className={`px-3 py-1 text-sm rounded-md font-medium transition-all ${
                      currentPage === p
                        ? "text-white bg-gradient-to-r from-orange-500 to-orange-600 shadow-md transform scale-105"
                        : "text-blue-700 bg-blue-100 hover:bg-blue-200"
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
            </div>

            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className={`px-3 py-1 text-sm rounded-md font-medium transition-all ${
                currentPage === totalPages
                  ? "text-gray-500 bg-gray-200 cursor-not-allowed"
                  : "text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-md"
              }`}
            >
              SIGUIENTE
            </button>
          </div>
        </div>
      )}

      <div className="max-h-[calc(100vh-300px)] overflow-y-auto rounded-lg shadow">
        <table className="min-w-full text-sm border-collapse bg-white">
          <thead className="bg-[#1e3a5f] text-white sticky top-0 z-10">
            <tr>
              <th className="p-3 text-left">N° Control</th>
              <th className="p-3 text-left">Descripción</th>
              <th className="p-3 text-left">Existencia</th>
              <th className="p-3 text-left">Medidas</th>
              <th className="p-3 text-left">Modelo/Marca</th>
              <th className="p-3 text-left">Serie</th>
              <th className="p-3 text-left">Condiciones</th>
              <th className="p-3 text-left">Sucursal</th>
              <th className="p-3 text-left">Ubicación</th>
              <th className="p-3 text-left">Responsable</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Creado</th>
              <th className="p-3 text-center">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td
                  colSpan={13}
                  className="text-center py-4 text-white bg-[#424242] font-semibold"
                >
                  Cargando activos...
                </td>
              </tr>
            )}

            {!loading && currentItems.length === 0 && (
              <tr>
                <td
                  colSpan={13}
                  className="text-center py-4 text-red-500 bg-[#424242] font-semibold"
                >
                  No hay activos registrados.
                </td>
              </tr>
            )}

            {!loading &&
              currentItems.map((item) => (
                <tr
                  key={item.id}
                  className="border-b bg-[#424242] text-white hover:bg-gray-400 hover:text-black transition"
                >
                  <td className="p-2">{item.numeroControl}</td>
                  <td className="p-2">{item.descripcionActivo}</td>
                  <td className="p-2">{item.existencia}</td>
                  <td className="p-2">{item.medidas || "-"}</td>
                  <td className="p-2">{item.modeloMarca || "-"}</td>
                  <td className="p-2">{item.numeroSerie || "-"}</td>
                  <td className="p-2">{item.condicionesActivo || "-"}</td>
                  <td className="p-2">{formatearSucursal(item.sucursal)}</td>
                  <td className="p-2">{item.ubicacion || "-"}</td>
                  <td className="p-2">
                    {item.responsableDirecto?.nombre ||
                      `ID ${item.responsableDirectoId ?? "-"}`}
                  </td>
                  <td className="p-2">
                    <BadgeStatus status={item.status} />
                  </td>
                  <td className="p-2">
                    {item.createdAt
                      ? new Date(item.createdAt).toLocaleDateString()
                      : "-"}
                  </td>
                  <td className="p-2 text-center">
                    <button
                      onClick={() => abrirModalEditar(item)}
                      className="bg-gradient-to-b from-blue-600 to-blue-800 text-white px-3 py-1 rounded-[5px] hover:bg-blue-700 transition mr-2"
                      title="Editar activo"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button
                          onClick={() => setActivoSeleccionado(item)}
                          className="bg-gradient-to-b from-[#c62828] to-[#9d4245] text-white px-3 py-1 rounded-[5px] hover:bg-red-700 transition"
                          title="Eliminar activo"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </AlertDialogTrigger>

                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Estás a punto de eliminar el activo{" "}
                            <strong>{activoSeleccionado?.descripcionActivo}</strong>.
                            Esta acción no se puede revertir.
                          </AlertDialogDescription>
                        </AlertDialogHeader>

                        <AlertDialogFooter>
                          <AlertDialogCancel
                            className="hover:bg-white hover:text-black transition-all"
                            onClick={() => setActivoSeleccionado(null)}
                          >
                            Cancelar
                          </AlertDialogCancel>

                          <AlertDialogAction
                            onClick={() => {
                              if (activoSeleccionado) {
                                eliminarActivo(
                                  activoSeleccionado.id,
                                  activoSeleccionado.descripcionActivo
                                );
                              }
                            }}
                            className="bg-red-500 hover:bg-red-700"
                          >
                            Sí, eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <ModalEditarActivo
        open={openEditar}
        onOpenChange={setOpenEditar}
        activo={activoEditar}
        onSuccess={fetchActivos}
      />
    </div>
  );
}