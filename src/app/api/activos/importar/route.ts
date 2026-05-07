import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { db } from "@/lib/db";
import {
  EstadoActivo,
  Sucursal,
  TipoEquipoActivo,
  CondicionIngreso,
} from "@prisma/client";
import { auth } from "../../../../../auth";

type ExcelRow = (string | number | boolean | null | undefined)[];

type RegistroImportado = {
  numeroControl: string;
  descripcionActivo: string;
  tipoEquipo: TipoEquipoActivo;
  existencia: number;
  medidas: string | null;
  modeloMarca: string | null;
  numeroSerie: string | null;
  condicionIngreso: CondicionIngreso;
  observaciones: string | null;
  ubicacion: string | null;
  seccionExcel: string | null;
  status: EstadoActivo;
};

const SUCURSALES_VALIDAS: Sucursal[] = [
  "TAPACHULA",
  "CIUDAD_HIDALGO",
  "TOSCANA",
  "TUXTLA_GUTIERREZ",
  "OFICINAS_ADMINISTRATIVAS",
  "ALMACEN_CIUDAD_HIDALGO",
  "ALMACEN_TUXTLA_GUTIERREZ",
];

function esSucursalValida(valor: string | null | undefined): valor is Sucursal {
  return !!valor && SUCURSALES_VALIDAS.includes(valor as Sucursal);
}

function normalizarTexto(valor: unknown): string {
  if (valor === null || valor === undefined) return "";
  return String(valor)
    .replace(/\r/g, " ")
    .replace(/\n/g, " ")
    .replace(/\t/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizarComparacion(valor: unknown): string {
  return normalizarTexto(valor)
    .replaceAll("_", " ")
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function limpiarTexto(valor: unknown): string | null {
  const texto = normalizarTexto(valor);
  return texto ? texto : null;
}

function truncar(valor: string | null, max: number): string | null {
  if (!valor) return null;
  return valor.length > max ? valor.slice(0, max) : valor;
}

function limpiarNumeroSerie(valor: unknown): string | null {
  const textoOriginal = normalizarTexto(valor);
  const texto = normalizarComparacion(valor);

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
  const texto = normalizarComparacion(valor);

  if (!texto) return 1;

  const match = texto.match(/\d+/);
  if (match) {
    const n = Number(match[0]);
    return Number.isFinite(n) && n > 0 ? n : 1;
  }

  return 1;
}

function mapStatus(valor: unknown): EstadoActivo {
  const texto = normalizarComparacion(valor);

  if (texto.includes("INACTIVO")) return "INACTIVO";
  if (texto.includes("MANTENIMIENTO")) return "MANTENIMIENTO";
  if (texto.includes("BAJA")) return "BAJA";

  return "ACTIVO";
}

function mapCondicionIngreso(valor: unknown): CondicionIngreso {
  const texto = normalizarComparacion(valor);

  if (texto.includes("REACONDICIONADO")) return "REACONDICIONADO";
  if (texto.includes("USADO")) return "USADO";
  if (texto.includes("DONADO")) return "DONADO";
  if (texto.includes("TRANSFERIDO")) return "TRANSFERIDO";
  if (texto.includes("NUEVO")) return "NUEVO";

  return "NUEVO";
}

function extraerContextoHoja(
  sheet: XLSX.WorkSheet,
  nombreHoja: string,
  valorFormData?: string | null
) {
  const rows = XLSX.utils.sheet_to_json<ExcelRow>(sheet, {
    header: 1,
    raw: false,
    defval: "",
  });

  const primerasFilas = rows
    .slice(0, 15)
    .flat()
    .map(normalizarTexto)
    .filter(Boolean)
    .join(" ");

  return normalizarComparacion(
    `${nombreHoja} ${valorFormData ?? ""} ${primerasFilas}`
  );
}

function detectarSucursal(
  sheet: XLSX.WorkSheet,
  nombreHoja: string,
  valorFormData?: string | null
): Sucursal {
  if (esSucursalValida(valorFormData)) {
    return valorFormData;
  }

  const texto = extraerContextoHoja(sheet, nombreHoja, valorFormData);

  if (
    texto.includes("ALMACEN CIUDAD HIDALGO") ||
    texto.includes("CD HIDALGO ALMACEN") ||
    texto.includes("CIUDAD HIDALGO ALMACEN") ||
    texto.includes("ALMACEN CD HIDALGO") ||
    texto.includes("BODEGA PEDIALYTE") ||
    (texto.includes("ALMACEN") && texto.includes("HIDALGO"))
  ) {
    return "ALMACEN_CIUDAD_HIDALGO";
  }

  if (
    texto.includes("ALMACEN TUXTLA GUTIERREZ") ||
    texto.includes("ALMACEN TUXTLA") ||
    (texto.includes("ALMACEN") && texto.includes("TUXTLA"))
  ) {
    return "ALMACEN_TUXTLA_GUTIERREZ";
  }

  if (texto.includes("OFICINAS")) return "OFICINAS_ADMINISTRATIVAS";
  if (texto.includes("TAPACHULA")) return "TAPACHULA";
  if (texto.includes("TOSCANA")) return "TOSCANA";

  if (texto.includes("CIUDAD HIDALGO") || texto.includes("CD HIDALGO")) {
    return "CIUDAD_HIDALGO";
  }

  if (texto.includes("TUXTLA GUTIERREZ") || texto.includes("TUXTLA")) {
    return "TUXTLA_GUTIERREZ";
  }

  return "TOSCANA";
}

function detectarTipoEquipoEnFila(row: ExcelRow): TipoEquipoActivo | null {
  const textoFila = row.map(normalizarComparacion).join(" | ");

  if (
    textoFila.includes("001- EQUIPO MOBILIARIO") ||
    textoFila.includes("EQUIPO MOBILIARIO")
  ) {
    return "EQUIPO_MOBILIARIO";
  }

  if (
    textoFila.includes("002- EQUIPO DE OFICINA") ||
    textoFila.includes("EQUIPO DE OFICINA") ||
    textoFila.includes("EQUIPO OFICINA") ||
    textoFila.includes("OFICINA ADMINISTRATIVA")
  ) {
    return "EQUIPO_OFICINA";
  }

  if (
    textoFila.includes("003- EQUIPO DE REPARTO") ||
    textoFila.includes("EQUIPO DE REPARTO") ||
    textoFila.includes("EQUIPO REPARTO")
  ) {
    return "EQUIPO_REPARTO";
  }

  if (
    textoFila.includes("004- EQUIPO DE TRANSPORTE") ||
    textoFila.includes("EQUIPO DE TRANSPORTE") ||
    textoFila.includes("EQUIPO TRANSPORTE")
  ) {
    return "EQUIPO_TRANSPORTE";
  }

  return null;
}

function detectarTipoEquipoPorContextoHoja(
  sheet: XLSX.WorkSheet,
  nombreHoja: string,
  sucursalDetectada: Sucursal,
  valorFormData?: string | null
): TipoEquipoActivo | null {
  const texto = extraerContextoHoja(sheet, nombreHoja, valorFormData);

  if (sucursalDetectada === "OFICINAS_ADMINISTRATIVAS") {
    return "EQUIPO_OFICINA";
  }

  if (texto.includes("EQUIPO MOBILIARIO") || texto.includes("MOBILIARIO")) {
    return "EQUIPO_MOBILIARIO";
  }

  if (
    texto.includes("EQUIPO DE OFICINA") ||
    texto.includes("EQUIPO OFICINA") ||
    texto.includes("OFICINA")
  ) {
    return "EQUIPO_OFICINA";
  }

  if (
    texto.includes("EQUIPO DE REPARTO") ||
    texto.includes("EQUIPO REPARTO") ||
    texto.includes("REPARTO")
  ) {
    return "EQUIPO_REPARTO";
  }

  if (
    texto.includes("EQUIPO DE TRANSPORTE") ||
    texto.includes("EQUIPO TRANSPORTE") ||
    texto.includes("TRANSPORTE")
  ) {
    return "EQUIPO_TRANSPORTE";
  }

  return null;
}

function esFilaVacia(row: ExcelRow): boolean {
  return row.every((cell) => !normalizarTexto(cell));
}

function esFilaEncabezado(row: ExcelRow): boolean {
  const textoFila = row.map(normalizarComparacion).join(" | ");

  return (
    textoFila.includes("NUMERO DE CONTROL") ||
    textoFila.includes("NO. DE CONTROL") ||
    textoFila.includes("NO DE CONTROL") ||
    textoFila.includes("NUM. DE CONTROL") ||
    textoFila.includes("NUM CONTROL")
  );
}

function construirMapaEncabezados(headerRow: ExcelRow) {
  const mapa = new Map<string, number>();

  headerRow.forEach((cell, index) => {
    const t = normalizarComparacion(cell);

    if (t.includes("NUMERO DE CONTROL")) {
      mapa.set("numeroControl", index);
    } else if (t.includes("DESCRIPCION DEL ACTIVO")) {
      mapa.set("descripcionActivo", index);
    } else if (t === "EXISTENCIA") {
      mapa.set("existencia", index);
    } else if (t === "MEDIDAS") {
      mapa.set("medidas", index);
    } else if (
      t.includes("MODELO Y/O MARCA") ||
      t.includes("MODELO/MARCA") ||
      t.includes("MODELO Y MARCA")
    ) {
      mapa.set("modeloMarca", index);
    } else if (t.includes("NUMERO DE SERIE")) {
      mapa.set("numeroSerie", index);
    } else if (
      t.includes("CONDICIONES DEL ACTIVO") ||
      t.includes("CONDICION DE INGRESO") ||
      t.includes("CONDICIÓN DE INGRESO") ||
      t === "CONDICION" ||
      t === "CONDICIÓN"
    ) {
      mapa.set("condicionIngreso", index);
    } else if (t === "OBSERVACIONES") {
      mapa.set("observaciones", index);
    } else if (t === "UBICACION") {
      mapa.set("ubicacion", index);
    } else if (t === "STATUS" || t === "ESTATUS") {
      mapa.set("status", index);
    }
  });

  return mapa;
}

function obtenerCelda(row: ExcelRow, mapa: Map<string, number>, campo: string) {
  const idx = mapa.get(campo);
  if (idx === undefined) return "";
  return row[idx];
}

function esFilaSeccionOficinas(row: ExcelRow): string | null {
  const celdasConTexto = row.map(normalizarTexto).filter(Boolean);

  if (celdasConTexto.length === 0) return null;
  if (celdasConTexto.length > 3) return null;

  const textoVisible = celdasConTexto.join(" ");
  const texto = normalizarComparacion(textoVisible);

  if (!texto) return null;

  const textosIgnorar = [
    "RELACION DE MOBILIARIO",
    "MOBILIARIO Y EQUIPO",
    "DISTRIBUCION G&D",
    "DISTRIBUCION GYD",
    "NUMERO DE CONTROL",
    "DESCRIPCION DEL ACTIVO",
    "EXISTENCIA",
    "MEDIDAS",
    "MODELO",
    "NUMERO DE SERIE",
    "CONDICIONES DEL ACTIVO",
    "OBSERVACIONES",
    "UBICACION",
    "STATUS",
    "FECHA",
    "RESPONSABLE",
  ];

  if (textosIgnorar.some((t) => texto.includes(t))) return null;

  return truncar(textoVisible, 191);
}

function extraerRegistrosDesdeSheet(
  sheet: XLSX.WorkSheet,
  nombreHoja: string,
  sucursalDetectada: Sucursal,
  valorFormData?: string | null
) {
  const rows = XLSX.utils.sheet_to_json<ExcelRow>(sheet, {
    header: 1,
    raw: false,
    defval: "",
  });

  const registros: RegistroImportado[] = [];
  let mapaEncabezados: Map<string, number> | null = null;
  let dentroDeTabla = false;
  let seccionExcelActual: string | null = null;

  let tipoEquipoActual: TipoEquipoActivo | null =
    detectarTipoEquipoPorContextoHoja(
      sheet,
      nombreHoja,
      sucursalDetectada,
      valorFormData
    );

  for (const row of rows) {
    const tipoDetectado = detectarTipoEquipoEnFila(row);

    if (tipoDetectado) {
      tipoEquipoActual = tipoDetectado;
      mapaEncabezados = null;
      dentroDeTabla = false;
      continue;
    }

    if (sucursalDetectada === "OFICINAS_ADMINISTRATIVAS") {
      const seccionDetectada = esFilaSeccionOficinas(row);

      if (seccionDetectada && !esFilaEncabezado(row)) {
        seccionExcelActual = seccionDetectada;
        continue;
      }
    }

    if (esFilaEncabezado(row)) {
      mapaEncabezados = construirMapaEncabezados(row);
      dentroDeTabla = true;
      continue;
    }

    if (!dentroDeTabla || !mapaEncabezados || !tipoEquipoActual) continue;
    if (esFilaVacia(row)) continue;

    let numeroControl = truncar(
      limpiarTexto(obtenerCelda(row, mapaEncabezados, "numeroControl")),
      100
    );

    const numeroControlNormalizado = normalizarComparacion(numeroControl);

    if (numeroControlNormalizado === "SOLO VA RELACONADO") {
      numeroControl = "SOLO VA RELACIONADO";
    }

    const descripcionActivo = truncar(
      limpiarTexto(obtenerCelda(row, mapaEncabezados, "descripcionActivo")),
      150
    );

    const existencia = parseExistencia(
      obtenerCelda(row, mapaEncabezados, "existencia")
    );

    const medidas = truncar(
      limpiarTexto(obtenerCelda(row, mapaEncabezados, "medidas")),
      100
    );

    const modeloMarca = truncar(
      limpiarTexto(obtenerCelda(row, mapaEncabezados, "modeloMarca")),
      150
    );

    const numeroSerie = truncar(
      limpiarNumeroSerie(obtenerCelda(row, mapaEncabezados, "numeroSerie")),
      100
    );

    const condicionIngreso = mapCondicionIngreso(
      obtenerCelda(row, mapaEncabezados, "condicionIngreso")
    );

    const observaciones = limpiarTexto(
      obtenerCelda(row, mapaEncabezados, "observaciones")
    );

    const ubicacion = truncar(
      limpiarTexto(obtenerCelda(row, mapaEncabezados, "ubicacion")),
      150
    );

    const status = mapStatus(obtenerCelda(row, mapaEncabezados, "status"));

    if (!numeroControl || !descripcionActivo) {
      continue;
    }

    registros.push({
      numeroControl,
      descripcionActivo,
      tipoEquipo: tipoEquipoActual,
      existencia,
      medidas,
      modeloMarca,
      numeroSerie,
      condicionIngreso,
      observaciones,
      ubicacion,
      seccionExcel:
        sucursalDetectada === "OFICINAS_ADMINISTRATIVAS"
          ? seccionExcelActual
          : null,
      status,
    });
  }

  return registros;
}

function construirClaveRegistro(params: {
  numeroControl: string;
  descripcionActivo: string;
  ubicacion: string | null;
  sucursal: Sucursal;
  tipoEquipo: TipoEquipoActivo;
  observaciones: string | null;
  seccionExcel?: string | null;
}) {
  const numeroControlNormalizado = normalizarComparacion(params.numeroControl);

  if (
    numeroControlNormalizado === "SOLO VA RELACIONADO" ||
    numeroControlNormalizado === "SOLO VA RELACONADO"
  ) {
    return [
      "SOLO VA RELACIONADO",
      normalizarComparacion(params.descripcionActivo),
      normalizarComparacion(params.ubicacion ?? ""),
      params.sucursal,
      params.tipoEquipo,
      normalizarComparacion(params.seccionExcel ?? ""),
      normalizarComparacion(params.observaciones ?? ""),
    ].join("||");
  }

  return [normalizarComparacion(params.numeroControl), params.sucursal].join(
    "||"
  );
}

async function buscarActivoExistente(params: {
  numeroControl: string;
  descripcionActivo: string;
  ubicacion: string | null;
  sucursal: Sucursal;
  tipoEquipo: TipoEquipoActivo;
  observaciones: string | null;
  seccionExcel?: string | null;
}) {
  const numeroControlNormalizado = params.numeroControl.trim().toUpperCase();

  if (
    numeroControlNormalizado === "SOLO VA RELACIONADO" ||
    numeroControlNormalizado === "SOLO VA RELACONADO"
  ) {
    return await db.activo_fijo.findFirst({
      where: {
        numeroControl: "SOLO VA RELACIONADO",
        descripcionActivo: params.descripcionActivo,
        ubicacion: params.ubicacion,
        sucursal: params.sucursal,
        tipoEquipo: params.tipoEquipo,
        observaciones: params.observaciones,
        seccionExcel: params.seccionExcel ?? null,
      },
      select: {
        id: true,
        numeroControl: true,
        numeroSerie: true,
      },
    });
  }

  return await db.activo_fijo.findFirst({
    where: {
      numeroControl: params.numeroControl,
      sucursal: params.sucursal,
    },
    select: {
      id: true,
      numeroControl: true,
      numeroSerie: true,
    },
  });
}

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ message: "No autorizado." }, { status: 401 });
    }

    const usuarioId = Number(session.user.id);

    if (Number.isNaN(usuarioId) || usuarioId < 1) {
      return NextResponse.json(
        { message: "El ID del usuario autenticado no es válido." },
        { status: 400 }
      );
    }

    const usuarioExiste = await db.usuario.findUnique({
      where: { id: usuarioId },
      select: {
        id: true,
        nombre: true,
      },
    });

    if (!usuarioExiste) {
      return NextResponse.json(
        {
          message:
            "El usuario autenticado no existe en la tabla de usuarios. No se puede importar hasta corregir la sesión o el usuario.",
        },
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

    if (!esSucursalValida(sucursalForm)) {
      return NextResponse.json(
        { message: "La sucursal enviada no es válida." },
        { status: 400 }
      );
    }

    const responsableSucursal = await db.responsable_sucursal.findUnique({
      where: {
        sucursal: sucursalForm,
      },
    });

    if (!responsableSucursal) {
      return NextResponse.json(
        {
          message:
            "No hay responsable asignado para esta sucursal. Primero registra un responsable.",
        },
        { status: 400 }
      );
    }

    const bytes = await fileEntry.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const workbook = XLSX.read(buffer, { type: "buffer" });

    let totalInsertados = 0;
    let totalActualizados = 0;
    let totalErrores = 0;
    let totalEliminados = 0;
    const errores: string[] = [];
    const clavesExcel = new Set<string>();

    for (const nombreHoja of workbook.SheetNames) {
      const sheet = workbook.Sheets[nombreHoja];
      const sucursalDetectada = detectarSucursal(sheet, nombreHoja, sucursalForm);

      const responsableHoja = await db.responsable_sucursal.findUnique({
        where: {
          sucursal: sucursalDetectada,
        },
      });

      if (!responsableHoja) {
        totalErrores++;
        errores.push(
          `Hoja "${nombreHoja}": No hay responsable asignado para la sucursal ${sucursalDetectada}.`
        );
        continue;
      }

      const registros = extraerRegistrosDesdeSheet(
        sheet,
        nombreHoja,
        sucursalDetectada,
        sucursalForm
      );

      for (const item of registros) {
        try {
          const claveActual = construirClaveRegistro({
            numeroControl: item.numeroControl,
            descripcionActivo: item.descripcionActivo,
            ubicacion: item.ubicacion,
            sucursal: sucursalDetectada,
            tipoEquipo: item.tipoEquipo,
            observaciones: item.observaciones,
            seccionExcel: item.seccionExcel,
          });

          clavesExcel.add(claveActual);

          const existente = await buscarActivoExistente({
            numeroControl: item.numeroControl,
            descripcionActivo: item.descripcionActivo,
            ubicacion: item.ubicacion,
            sucursal: sucursalDetectada,
            tipoEquipo: item.tipoEquipo,
            observaciones: item.observaciones,
            seccionExcel: item.seccionExcel,
          });

          let numeroSerieFinal = item.numeroSerie;
          const notasExtras: string[] = [];

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
                `Hoja "${nombreHoja}" - Número control "${item.numeroControl}": serie repetida detectada (${numeroSerieFinal}), se guardó como null`
              );
              numeroSerieFinal = null;
            }
          }

          if (notasExtras.length > 0) {
            errores.push(...notasExtras);
          }

          const observacionesFinal = item.observaciones ?? null;

          if (existente) {
            await db.activo_fijo.update({
              where: { id: existente.id },
              data: {
                numeroControl: item.numeroControl,
                descripcionActivo: item.descripcionActivo,
                tipoEquipo: item.tipoEquipo,
                existencia: item.existencia,
                medidas: item.medidas,
                modeloMarca: item.modeloMarca,
                numeroSerie: numeroSerieFinal,
                condicionIngreso: item.condicionIngreso,
                observaciones: observacionesFinal,
                ubicacion: item.ubicacion,
                seccionExcel: item.seccionExcel,
                status: item.status,
                sucursal: sucursalDetectada,
                responsableNombre: responsableHoja.nombreResponsable,
                responsableCargo: responsableHoja.cargo,
                creadoPorId: usuarioExiste.id,
              },
            });

            totalActualizados++;
          } else {
            await db.activo_fijo.create({
              data: {
                numeroControl: item.numeroControl,
                descripcionActivo: item.descripcionActivo,
                tipoEquipo: item.tipoEquipo,
                existencia: item.existencia,
                medidas: item.medidas,
                modeloMarca: item.modeloMarca,
                numeroSerie: numeroSerieFinal,
                condicionIngreso: item.condicionIngreso,
                observaciones: observacionesFinal,
                ubicacion: item.ubicacion,
                seccionExcel: item.seccionExcel,
                status: item.status,
                sucursal: sucursalDetectada,
                responsableNombre: responsableHoja.nombreResponsable,
                responsableCargo: responsableHoja.cargo,
                creadoPorId: usuarioExiste.id,
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

    const activosDB = await db.activo_fijo.findMany({
      where: {
        sucursal: sucursalForm,
      },
      select: {
        id: true,
        numeroControl: true,
        descripcionActivo: true,
        ubicacion: true,
        sucursal: true,
        tipoEquipo: true,
        observaciones: true,
        seccionExcel: true,
      },
    });

    const idsParaEliminar: number[] = [];

    for (const activo of activosDB) {
      const claveDB = construirClaveRegistro({
        numeroControl: activo.numeroControl,
        descripcionActivo: activo.descripcionActivo,
        ubicacion: activo.ubicacion,
        sucursal: activo.sucursal,
        tipoEquipo: activo.tipoEquipo,
        observaciones: activo.observaciones,
        seccionExcel: activo.seccionExcel,
      });

      if (!clavesExcel.has(claveDB)) {
        idsParaEliminar.push(activo.id);
      }
    }

    if (idsParaEliminar.length > 0) {
      await db.activo_fijo.updateMany({
        where: {
          id: { in: idsParaEliminar },
        },
        data: {
          status: "BAJA",
        },
      });

      totalEliminados = idsParaEliminar.length;
    }

    console.log("✅ RESULTADO FINAL:", {
      insertados: totalInsertados,
      actualizados: totalActualizados,
      eliminados: totalEliminados,
      errores: totalErrores,
    });

    return NextResponse.json({
      message: "Importación finalizada.",
      totalInsertados,
      totalActualizados,
      totalErrores,
      totalEliminados,
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