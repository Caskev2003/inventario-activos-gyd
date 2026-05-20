import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const sucursal = searchParams.get("sucursal");
    const tipo = searchParams.get("tipo");
    const numeroControl = searchParams.get("numeroControl");
    const buscar = searchParams.get("buscar");

    const where: any = {};

    if (sucursal) {
      where.sucursal = sucursal;
    }

    if (tipo) {
      where.tipoMovimiento = tipo;
    }

    if (numeroControl) {
      where.numeroControl = {
        contains: numeroControl,
      };
    }

    if (buscar) {
      where.OR = [
        {
          numeroControl: {
            contains: buscar,
          },
        },
        {
          descripcion: {
            contains: buscar,
          },
        },
        {
          detalle: {
            contains: buscar,
          },
        },
        {
          usuarioNombre: {
            contains: buscar,
          },
        },
      ];
    }

    const historial = await db.historial_activos.findMany({
      where,
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
          },
        },
        activo: {
          select: {
            id: true,
            numeroControl: true,
            descripcionActivo: true,
            tipoEquipo: true,
            existencia: true,
            sucursal: true,
            ubicacion: true,
            status: true,
          },
        },
      },
      orderBy: {
        fecha: "desc",
      },
    });

    const historialFormateado = historial.map((item) => ({
      ...item,
      usuarioMostrado:
        item.usuarioNombre || item.usuario?.nombre || "Usuario no identificado",
      fechaMexico: item.fecha.toLocaleString("es-MX", {
        timeZone: "America/Mexico_City",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      }),
    }));

    return NextResponse.json(historialFormateado);
  } catch (error) {
    console.error("Error al obtener historial:", error);

    return NextResponse.json(
      { error: "Error al obtener historial" },
      { status: 500 }
    );
  }
}