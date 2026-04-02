import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const sucursal = searchParams.get("sucursal");
    const tipo = searchParams.get("tipo");
    const numeroControl = searchParams.get("numeroControl");

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

    const historial = await db.historial_activos.findMany({
      where,
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
      orderBy: {
        fecha: "desc",
      },
    });

    return NextResponse.json(historial);
  } catch (error) {
    console.error("Error al obtener historial:", error);
    return NextResponse.json(
      { error: "Error al obtener historial" },
      { status: 500 }
    );
  }
}