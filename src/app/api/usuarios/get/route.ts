import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "../../../../../auth";

// GET /api/usuarios/get?page=1&pageSize=10
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
    const pageSize = Math.min(
      Math.max(parseInt(searchParams.get("pageSize") || "10", 10), 1),
      100
    );

    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const [total, items] = await Promise.all([
      db.usuario.count(),
      db.usuario.findMany({
        select: {
          id: true,
          nombre: true,
          correo: true,
          imagen: true,
          rol: true,
          telefono: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
    ]);

    const totalPages = Math.max(Math.ceil(total / pageSize), 1);

    return NextResponse.json({
      items,
      total,
      page,
      pageSize,
      totalPages,
    });
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    return new NextResponse("INTERNAL ERROR", { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = Number(url.searchParams.get("id"));

    if (!id || isNaN(id)) {
      return new NextResponse("ID requerido", { status: 400 });
    }

    const session = await auth();
    const me = Number(session?.user?.id ?? 0);

    if (!session?.user) {
      return new NextResponse("No autorizado", { status: 401 });
    }

    if (me === id) {
      return NextResponse.json(
        { message: "No puedes eliminar tu propia cuenta." },
        { status: 403 }
      );
    }

    // Validar existencia del usuario a eliminar
    const victim = await db.usuario.findUnique({
      where: { id },
    });

    if (!victim) {
      return new NextResponse("Usuario no existe", { status: 404 });
    }

    // Contar referencias reales en el sistema actual
    const [historialCount, activosCount] = await Promise.all([
      db.historial_activos.count({
        where: { usuarioId: id },
      }),
      db.activo_fijo.count({
        where: { responsableDirectoId: id },
      }),
    ]);

    const totalRefs = historialCount + activosCount;

    // Si no tiene referencias -> borrar directo
    if (totalRefs === 0) {
      await db.usuario.delete({ where: { id } });
      return new NextResponse(null, { status: 204 });
    }

    // Si tiene referencias -> requerir toId
    const toId = Number(url.searchParams.get("toId"));

    if (!toId || toId === id || isNaN(toId)) {
      return NextResponse.json(
        {
          message:
            "No se puede eliminar: tiene registros asociados. Proporciona ?toId=<usuario_destino> para reasignar.",
          detalle: {
            historial_activos: historialCount,
            activo_fijo: activosCount,
          },
        },
        { status: 409 }
      );
    }

    // Validar usuario destino
    const target = await db.usuario.findUnique({
      where: { id: toId },
    });

    if (!target) {
      return new NextResponse("Usuario destino no existe", { status: 404 });
    }

    // Reasignar todo y borrar en transacción
    await db.$transaction([
      db.historial_activos.updateMany({
        where: { usuarioId: id },
        data: {
          usuarioId: toId,
          usuarioNombre: target.nombre,
        },
      }),
      db.activo_fijo.updateMany({
        where: { responsableDirectoId: id },
        data: { responsableDirectoId: toId },
      }),
      db.usuario.delete({
        where: { id },
      }),
    ]);

    return new NextResponse(null, { status: 204 });
  } catch (e: any) {
    if (e?.code === "P2003") {
      return new NextResponse(
        "No se puede eliminar: faltó reasignar referencias.",
        { status: 409 }
      );
    }

    console.error("Error eliminando usuario:", e);
    return new NextResponse("INTERNAL ERROR", { status: 500 });
  }
}