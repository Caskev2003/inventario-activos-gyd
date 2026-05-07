import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Sucursal } from "@prisma/client";

const SUCURSALES_VALIDAS: Sucursal[] = [
  "TAPACHULA",
  "TOSCANA",
  "CIUDAD_HIDALGO",
  "TUXTLA_GUTIERREZ",
  "OFICINAS_ADMINISTRATIVAS",
  "ALMACEN_CIUDAD_HIDALGO",
  "ALMACEN_TUXTLA_GUTIERREZ",
];

function esSucursalValida(valor: string | null): valor is Sucursal {
  return !!valor && SUCURSALES_VALIDAS.includes(valor as Sucursal);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sucursalParam = searchParams.get("sucursal");

    if (!esSucursalValida(sucursalParam)) {
      return NextResponse.json(
        { error: "Sucursal no válida" },
        { status: 400 }
      );
    }

    const responsable = await db.responsable_sucursal.findUnique({
      where: {
        sucursal: sucursalParam,
      },
    });

    return NextResponse.json(responsable);
  } catch (error) {
    console.error("Error al obtener responsable:", error);

    return NextResponse.json(
      { error: "Error al obtener responsable" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const sucursal = body.sucursal ? String(body.sucursal).trim() : null;
    const nombreResponsable = body.nombreResponsable
      ? String(body.nombreResponsable).trim()
      : "";
    const cargo = body.cargo ? String(body.cargo).trim() : null;

    if (!esSucursalValida(sucursal)) {
      return NextResponse.json(
        { error: "Sucursal no válida" },
        { status: 400 }
      );
    }

    if (!nombreResponsable) {
      return NextResponse.json(
        { error: "El nombre del responsable es obligatorio" },
        { status: 400 }
      );
    }

    const responsable = await db.responsable_sucursal.upsert({
      where: {
        sucursal,
      },
      update: {
        nombreResponsable,
        cargo,
      },
      create: {
        sucursal,
        nombreResponsable,
        cargo,
      },
    });

    return NextResponse.json({
      message: "Responsable guardado correctamente",
      responsable,
    });
  } catch (error) {
    console.error("Error al guardar responsable:", error);

    return NextResponse.json(
      { error: "Error al guardar responsable" },
      { status: 500 }
    );
  }
}