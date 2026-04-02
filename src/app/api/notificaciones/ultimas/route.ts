import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const hace24Horas = new Date(Date.now() - 24 * 60 * 60 * 1000);

  try {
    const activos = await db.activo_fijo.findMany({
      where: {
        existencia: 0,
        updatedAt: {
          gte: hace24Horas,
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      select: {
        id: true,
        numeroControl: true,
        descripcionActivo: true,
        updatedAt: true,
      },
    });

    const notificaciones = activos.map((item) => ({
      id: item.id,
      codigo: item.numeroControl,
      descripcion: item.descripcionActivo,
      creadaEn: item.updatedAt,
    }));

    return NextResponse.json(notificaciones);
  } catch (error) {
    console.error("Error al obtener notificaciones:", error);
    return NextResponse.json(
      { error: "Error al cargar notificaciones recientes." },
      { status: 500 }
    );
  }
}