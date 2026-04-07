import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { db } from "@/lib/db";
import { EstadoActivo, Sucursal, TipoMovimiento } from "@prisma/client";
import { auth } from "../../../../../auth";

type ExcelRow = (string | number | boolean | null | undefined)[];

function normalizarTexto(valor: unknown): string {
  if (valor === null || valor === undefined) return "";
  return String(valor)
    .replace(/\s+/g, " ")
    .replace(/\n/g, " ")
    .trim();
}

function limpiarTexto(valor: unknown): string | null {
  const texto = normalizarTexto(valor);
  return texto ? texto : null;
}

function limpiarNumeroSerie(valor: unknown): string | null {
  const textoOriginal = normalizarTexto(valor);
  const texto = textoOriginal.toUpperCase();

  if (!texto) return null;

  const invalidos = [
    "N/A",
    "NA",
    "S/N",
    "SN",
    "SIN SERIE",
    "NO APLICA",
    "NO APLICA.",
    "NINGUNO",
    "NINGUNA",
    "-",
    "--",
    ".",
  ];

  if (invalidos.includes(texto)) return null;

  return textoOriginal;
}

function parseExistencia(valor: unknown): number {
  const texto = normalizarTexto(valor).toUpperCase();

  if (!texto) return 1;

  const match = texto.match(/\d+/);
  if (match) return Number(match[0]);

  return 1;
}

function mapStatus(valor: unknown): EstadoActivo {
  const texto = normalizarTexto(valor).toUpperCase();

  if (texto.includes("INACTIVO")) return "INACTIVO";
  if (texto.includes("MANTENIMIENTO")) return "MANTENIMIENTO";
  if (texto.includes("BAJA")) return "BAJA";

  return "ACTIVO";
}

function detectarSucursal(nombreHoja: string, valorFormData?: string | null): Sucursal {
  const texto = `${nombreHoja} ${valorFormData ?? ""}`.toUpperCase();

  if (texto.includes("TAPACHULA")) return "TAPACHULA";
  if (texto.includes("TOSCANA")) return "TOSCANA";
  if (texto.includes("CIUDAD HIDALGO")) return "CIUDAD_HIDALGO";
  if (texto.includes("TUXTLA")) return "TUXTLA_GUTIERREZ";
  if (texto.includes("OFICINAS")) return "OFICINAS_ADMINISTRATIVAS";

  return "TOSCANA";
}

function esFilaEncabezado(row: ExcelRow): boolean {
  const textoFila = row.map(normalizarTexto).join(" | ").toUpperCase();

  return (
    textoFila.includes("NÚMERO DE CONTROL") ||
    textoFila.includes("NUMERO DE CONTROL")
  );
}

function esFilaVacia(row: ExcelRow): boolean {
  return row.every((cell) => !normalizarTexto(cell));
}

function truncar(valor: string | null, max: number): string | null {
  if (!valor) return null;
  return valor.length > max ? valor.slice(0, max) : valor;
}

function extraerRegistrosDesdeSheet(sheet: XLSX.WorkSheet) {
  const rows = XLSX.utils.sheet_to_json<ExcelRow>(sheet, {
    header: 1,
    raw: false,
    defval: "",
  });

  const registros: Array<{
    numeroControl: string;
    descripcionActivo: string;
    existencia: number;
    medidas: string | null;
    modeloMarca: string | null;
    numeroSerie: string | null;
    condicionesActivo: string | null;
    observaciones: string | null;
    ubicacion: string | null;
    status: EstadoActivo;
  }> = [];

  let dentroDeTabla = false;

  for (const row of rows) {
    if (esFilaEncabezado(row)) {
      dentroDeTabla = true;
      continue;
    }

    if (!dentroDeTabla) continue;
    if (esFilaVacia(row)) continue;

    // Ajustado para que el encabezado real empiece desde la primera columna del bloque
    const numeroControl = truncar(limpiarTexto(row[0]), 50);
    const descripcionActivo = truncar(limpiarTexto(row[1]), 150);
    const existencia = parseExistencia(row[2]);
    const medidas = truncar(limpiarTexto(row[3]), 100);
    const modeloMarca = truncar(limpiarTexto(row[4]), 150);
    const numeroSerie = truncar(limpiarNumeroSerie(row[5]), 100);
    const condicionesActivo = truncar(limpiarTexto(row[6]), 150);
    const observaciones = limpiarTexto(row[7]);
    const ubicacion = truncar(limpiarTexto(row[8]), 150);
    const status = mapStatus(row[10]);

    // Saltar filas basura o incompletas
    if (!numeroControl || !descripcionActivo) {
      continue;
    }

    registros.push({
      numeroControl,
      descripcionActivo,
      existencia,
      medidas,
      modeloMarca,
      numeroSerie,
      condicionesActivo,
      observaciones,
      ubicacion,
      status,
    });
  }

  return registros;
}

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "No autorizado." },
        { status: 401 }
      );
    }

    const usuarioId = Number(session.user.id);

    if (Number.isNaN(usuarioId)) {
      return NextResponse.json(
        { message: "El ID del usuario autenticado no es válido." },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const fileEntry = formData.get("file");
    const sucursalForm = normalizarTexto(formData.get("sucursal"));

    if (!(fileEntry instanceof File)) {
      return NextResponse.json(
        { message: "No se recibió ningún archivo válido." },
        { status: 400 }
      );
    }

    const bytes = await fileEntry.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const workbook = XLSX.read(buffer, { type: "buffer" });

    let totalInsertados = 0;
    let totalActualizados = 0;
    let totalErrores = 0;
    const errores: string[] = [];

    for (const nombreHoja of workbook.SheetNames) {
      const sheet = workbook.Sheets[nombreHoja];
      const registros = extraerRegistrosDesdeSheet(sheet);

      for (const item of registros) {
        try {
          const sucursalDetectada = detectarSucursal(nombreHoja, sucursalForm);

          const existente = await db.activo_fijo.findUnique({
            where: { numeroControl: item.numeroControl },
            select: {
              id: true,
              numeroControl: true,
              numeroSerie: true,
            },
          });

          let numeroSerieFinal = item.numeroSerie;
          const notasExtras: string[] = [];

          // Si la serie ya existe en otro registro, no la guardamos para evitar error unique
          if (numeroSerieFinal) {
            const serieExistente = await db.activo_fijo.findFirst({
              where: {
                numeroSerie: numeroSerieFinal,
                ...(existente ? { NOT: { id: existente.id } } : {}),
              },
              select: {
                id: true,
                numeroControl: true,
              },
            });

            if (serieExistente) {
              notasExtras.push(
                `Serie repetida detectada en importación: ${numeroSerieFinal}`
              );
              numeroSerieFinal = null;
            }
          }

          const observacionesFinal =
            [item.observaciones, ...notasExtras].filter(Boolean).join(" | ") || null;

          if (existente) {
            const actualizado = await db.activo_fijo.update({
              where: { numeroControl: item.numeroControl },
              data: {
                descripcionActivo: item.descripcionActivo,
                existencia: item.existencia,
                medidas: item.medidas,
                modeloMarca: item.modeloMarca,
                numeroSerie: numeroSerieFinal,
                condicionesActivo: item.condicionesActivo,
                observaciones: observacionesFinal,
                ubicacion: item.ubicacion,
                responsableDirectoId: usuarioId,
                status: item.status,
                sucursal: sucursalDetectada,
              },
            });

            await db.historial_activos.create({
              data: {
                activoId: actualizado.id,
                numeroControl: actualizado.numeroControl,
                descripcion: actualizado.descripcionActivo,
                tipoMovimiento: TipoMovimiento.EDICION,
                detalle: `Activo actualizado por importación de Excel (hoja: ${nombreHoja})`,
                sucursal: actualizado.sucursal,
                usuarioId,
                usuarioNombre: session.user.name ?? null,
              },
            });

            totalActualizados++;
          } else {
            const creado = await db.activo_fijo.create({
              data: {
                numeroControl: item.numeroControl,
                descripcionActivo: item.descripcionActivo,
                existencia: item.existencia,
                medidas: item.medidas,
                modeloMarca: item.modeloMarca,
                numeroSerie: numeroSerieFinal,
                condicionesActivo: item.condicionesActivo,
                observaciones: observacionesFinal,
                ubicacion: item.ubicacion,
                responsableDirectoId: usuarioId,
                status: item.status,
                sucursal: sucursalDetectada,
              },
            });

            await db.historial_activos.create({
              data: {
                activoId: creado.id,
                numeroControl: creado.numeroControl,
                descripcion: creado.descripcionActivo,
                tipoMovimiento: TipoMovimiento.ALTA,
                detalle: `Activo creado por importación de Excel (hoja: ${nombreHoja})`,
                sucursal: creado.sucursal,
                usuarioId,
                usuarioNombre: session.user.name ?? null,
              },
            });

            totalInsertados++;
          }
        } catch (error: any) {
          totalErrores++;
          errores.push(
            `Hoja "${nombreHoja}" - Número control "${item.numeroControl}": ${
              error?.message || "Error desconocido"
            }`
          );
        }
      }
    }

    return NextResponse.json({
      message: "Importación finalizada.",
      totalInsertados,
      totalActualizados,
      totalErrores,
      errores,
    });
  } catch (error: any) {
    console.error("Error al importar Excel:", error);

    return NextResponse.json(
      {
        message: "Ocurrió un error al importar el archivo.",
        error: error?.message || "Error desconocido",
      },
      { status: 500 }
    );
  }
}