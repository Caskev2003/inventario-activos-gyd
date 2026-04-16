import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { TipoReporte, Sucursal } from "@prisma/client";
import ExcelJS from "exceljs";
import fs from "fs";
import path from "path";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const sucursal = body?.sucursal as Sucursal | undefined;
    const creadoPorId = body?.creadoPorId ? Number(body.creadoPorId) : null;

    const activos = await db.activo_fijo.findMany({
      where: sucursal ? { sucursal } : undefined,
      include: {
        responsableDirecto: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Activos fijos");

    const headers = [
      "N° Control",
      "Descripción",
      "Tipo de equipo",
      "Existencia",
      "Medidas",
      "Modelo/Marca",
      "Serie",
      "Condiciones",
      "Observaciones",
      "Sucursal",
      "Ubicación",
      "Responsable",
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
      activo.condicionesActivo ?? "",
      activo.observaciones ?? "",
      (activo.sucursal ?? "").replaceAll("_", " "),
      activo.ubicacion ?? "",
      activo.responsableDirecto?.nombre ?? "",
      (activo.status ?? "").replaceAll("_", " "),
      activo.createdAt
        ? new Date(activo.createdAt).toLocaleDateString("es-MX")
        : "",
    ]);

    worksheet.addTable({
      name: "TablaActivos",
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

      worksheet.getColumn(c).width = Math.min(Math.max(max + 2, 12), 40);
    }

    worksheet.eachRow((row) => {
      row.alignment = {
        vertical: "middle",
        horizontal: "left",
        wrapText: true,
      };
    });

    const carpetaReportes = path.join(process.cwd(), "public", "reportes", "excel");

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

    const nombreArchivo = `reporte_activos_${sucursal ?? "GENERAL"}_${fechaArchivo}.xlsx`;
    const rutaCompleta = path.join(carpetaReportes, nombreArchivo);
    const rutaPublica = `/reportes/excel/${nombreArchivo}`;

    await workbook.xlsx.writeFile(rutaCompleta);

    await db.reporte.create({
      data: {
        nombreArchivo: nombreArchivo,
        tipoArchivo: TipoReporte.EXCEL,
        rutaArchivo: rutaPublica,
        sucursal: sucursal ?? null,
        modulo: "INVENTARIO DE ACTIVOS",
        creadoPorId: creadoPorId,
      },
    });

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer as BodyInit, {
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