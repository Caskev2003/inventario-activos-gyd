import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { TipoReporte, Sucursal, EstadoActivo } from "@prisma/client";
import ExcelJS from "exceljs";
import fs from "fs";
import path from "path";

const ESTADOS_VALIDOS: EstadoActivo[] = [
  "ACTIVO",
  "INACTIVO",
  "MANTENIMIENTO",
  "BAJA",
];

function esEstadoValido(valor: string | null): valor is EstadoActivo {
  return !!valor && ESTADOS_VALIDOS.includes(valor as EstadoActivo);
}

function formatearCondicionIngreso(condicion?: string | null) {
  switch (condicion) {
    case "NUEVO":
      return "Nuevo";
    case "REACONDICIONADO":
      return "Reacondicionado";
    case "USADO":
      return "Usado";
    case "DONADO":
      return "Donado";
    case "TRANSFERIDO":
      return "Transferido";
    default:
      return "";
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const sucursal = body?.sucursal as Sucursal | undefined;

    const statusBody = body?.status ? String(body.status).trim() : null;
    const status = esEstadoValido(statusBody) ? statusBody : undefined;

    const creadoPorId = body?.creadoPorId ? Number(body.creadoPorId) : null;

    const where: {
      sucursal?: Sucursal;
      status?: EstadoActivo;
    } = {};

    if (sucursal) {
      where.sucursal = sucursal;
    }

    if (status) {
      where.status = status;
    }

    const activos = await db.activo_fijo.findMany({
      where,
      include: {
        creadoPor: {
          select: {
            id: true,
            nombre: true,
            correo: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Distribución G&D";
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet("Activos fijos");

    const headers = [
      "N° Control",
      "Descripción",
      "Tipo de equipo",
      "Existencia",
      "Medidas",
      "Modelo/Marca",
      "Serie",
      "Condición de ingreso",
      "Observaciones",
      "Sucursal",
      "Ubicación",
      "Responsable",
      "Cargo responsable",
      "Dado de alta por",
      "Status",
      "Creado",
    ];

    const rows = activos.map((activo) => [
      activo.numeroControl ?? "",
      activo.descripcionActivo ?? "",
      (activo.tipoEquipo ?? "").replaceAll("_", " "),
      activo.existencia ?? 0,
      activo.medidas ?? "",
      activo.modeloMarca ?? "",
      activo.numeroSerie ?? "",
      formatearCondicionIngreso(activo.condicionIngreso),
      activo.observaciones ?? "",
      (activo.sucursal ?? "").replaceAll("_", " "),
      activo.ubicacion ?? "",
      activo.responsableNombre ?? "",
      activo.responsableCargo ?? "",
      activo.creadoPor?.nombre ?? "",
      (activo.status ?? "").replaceAll("_", " "),
      activo.createdAt
        ? new Date(activo.createdAt).toLocaleDateString("es-MX")
        : "",
    ]);

    worksheet.addTable({
      name: `TablaActivos_${Date.now()}`,
      ref: "A1",
      headerRow: true,
      totalsRow: false,
      style: {
        theme: "TableStyleMedium9",
        showRowStripes: true,
      },
      columns: headers.map((header) => ({ name: header })),
      rows,
    });

    worksheet.views = [{ state: "frozen", ySplit: 1 }];

    for (let c = 1; c <= headers.length; c++) {
      let max = headers[c - 1].length;

      for (const row of rows) {
        const len = String(row[c - 1] ?? "").length;
        if (len > max) max = len;
      }

      worksheet.getColumn(c).width = Math.min(Math.max(max + 2, 12), 45);
    }

    worksheet.eachRow((row) => {
      row.alignment = {
        vertical: "middle",
        horizontal: "left",
        wrapText: true,
      };
    });

    const carpetaReportes = path.join(
      process.cwd(),
      "public",
      "reportes",
      "excel"
    );

    if (!fs.existsSync(carpetaReportes)) {
      fs.mkdirSync(carpetaReportes, { recursive: true });
    }

    const fecha = new Date();

    const fechaArchivo = `${fecha.getFullYear()}-${String(
      fecha.getMonth() + 1
    ).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}_${String(
      fecha.getHours()
    ).padStart(2, "0")}-${String(fecha.getMinutes()).padStart(2, "0")}-${String(
      fecha.getSeconds()
    ).padStart(2, "0")}`;

    const nombreSucursal = sucursal ?? "GENERAL";
    const nombreStatus = status ?? "TODOS";

    const nombreArchivo = `reporte_activos_${nombreSucursal}_${nombreStatus}_${fechaArchivo}.xlsx`;

    const rutaCompleta = path.join(carpetaReportes, nombreArchivo);
    const rutaPublica = `/reportes/excel/${nombreArchivo}`;

    const buffer = await workbook.xlsx.writeBuffer();

    fs.writeFileSync(rutaCompleta, Buffer.from(buffer));

    await db.reporte.create({
      data: {
        nombreArchivo,
        tipoArchivo: TipoReporte.EXCEL,
        rutaArchivo: rutaPublica,
        sucursal: sucursal ?? null,
        modulo: `INVENTARIO DE ACTIVOS${status ? ` - ${status}` : ""}`,
        creadoPorId,
      },
    });

    return new NextResponse(Buffer.from(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${nombreArchivo}"`,
      },
    });
  } catch (error) {
    console.error("Error al exportar Excel:", error);

    return NextResponse.json(
      { ok: false, message: "No se pudo exportar el Excel." },
      { status: 500 }
    );
  }
}