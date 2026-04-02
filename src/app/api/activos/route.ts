import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

type Sucursal =
  | "TAPACHULA"
  | "TOSCANA"
  | "CIUDAD_HIDALGO"
  | "TUXTLA_GUTIERREZ";

type EstadoActivo =
  | "ACTIVO"
  | "INACTIVO"
  | "MANTENIMIENTO"
  | "BAJA";

type TipoMovimiento =
  | "ALTA"
  | "EDICION"
  | "BAJA"
  | "CAMBIO_STATUS"
  | "CAMBIO_UBICACION"
  | "TRANSFERENCIA";

const SUCURSALES_VALIDAS: Sucursal[] = [
  "TAPACHULA",
  "TOSCANA",
  "CIUDAD_HIDALGO",
  "TUXTLA_GUTIERREZ",
];

const ESTADOS_VALIDOS: EstadoActivo[] = [
  "ACTIVO",
  "INACTIVO",
  "MANTENIMIENTO",
  "BAJA",
];

function esSucursalValida(valor: string | null): valor is Sucursal {
  return !!valor && SUCURSALES_VALIDAS.includes(valor as Sucursal);
}

function esEstadoValido(valor: string | null): valor is EstadoActivo {
  return !!valor && ESTADOS_VALIDOS.includes(valor as EstadoActivo);
}

async function registrarHistorial(params: {
  activoId: number;
  numeroControl: string;
  descripcion?: string | null;
  tipoMovimiento: TipoMovimiento;
  detalle?: string | null;
  sucursal: Sucursal;
  usuarioId?: number | null;
  usuarioNombre?: string | null;
}) {
  await db.historial_activos.create({
    data: {
      activoId: params.activoId,
      numeroControl: params.numeroControl,
      descripcion: params.descripcion ?? null,
      tipoMovimiento: params.tipoMovimiento,
      detalle: params.detalle ?? null,
      sucursal: params.sucursal,
      usuarioId: params.usuarioId ?? null,
      usuarioNombre: params.usuarioNombre ?? null,
    },
  });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const idParam = searchParams.get("id");
    const sucursalParam = searchParams.get("sucursal");

    let sucursal: Sucursal | undefined = undefined;

    if (sucursalParam) {
      if (!esSucursalValida(sucursalParam)) {
        return NextResponse.json(
          { error: "La sucursal enviada no es válida" },
          { status: 400 }
        );
      }

      sucursal = sucursalParam;
    }

    if (idParam) {
      const id = Number(idParam);

      if (isNaN(id) || id < 1) {
        return NextResponse.json(
          { error: "El id enviado no es válido" },
          { status: 400 }
        );
      }

      const activo = await db.activo_fijo.findUnique({
        where: {
          id,
        },
        include: {
          responsableDirecto: {
            select: {
              id: true,
              nombre: true,
              correo: true,
            },
          },
        },
      });

      if (!activo) {
        return NextResponse.json(
          { error: "Activo no encontrado" },
          { status: 404 }
        );
      }

      if (sucursal && activo.sucursal !== sucursal) {
        return NextResponse.json(
          { error: "El activo no pertenece a la sucursal indicada" },
          { status: 404 }
        );
      }

      return NextResponse.json(activo);
    }

    const activos = await db.activo_fijo.findMany({
      where: sucursal
        ? {
            sucursal,
          }
        : undefined,
      include: {
        responsableDirecto: {
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

    return NextResponse.json(activos);
  } catch (error) {
    console.error("Error al obtener activos:", error);
    return NextResponse.json(
      { error: "Error al obtener activos" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const numeroControl = String(body.numeroControl ?? "").trim();
    const descripcionActivo = String(body.descripcionActivo ?? "").trim();
    const existencia = Number(body.existencia);
    const medidas = body.medidas ? String(body.medidas).trim() : null;
    const modeloMarca = body.modeloMarca
      ? String(body.modeloMarca).trim()
      : null;
    const numeroSerie = body.numeroSerie ? String(body.numeroSerie).trim() : null;
    const condicionesActivo = body.condicionesActivo
      ? String(body.condicionesActivo).trim()
      : null;
    const observaciones = body.observaciones
      ? String(body.observaciones).trim()
      : null;
    const sucursalBody = body.sucursal ? String(body.sucursal).trim() : null;
    const ubicacion = body.ubicacion ? String(body.ubicacion).trim() : null;
    const responsableDirectoId = Number(body.responsableDirectoId);
    const statusBody = body.status ? String(body.status).trim() : null;

    if (!numeroControl) {
      return NextResponse.json(
        { error: "El número de control es obligatorio" },
        { status: 400 }
      );
    }

    if (!descripcionActivo) {
      return NextResponse.json(
        { error: "La descripción del activo es obligatoria" },
        { status: 400 }
      );
    }

    if (isNaN(existencia) || existencia < 1) {
      return NextResponse.json(
        { error: "La existencia debe ser mayor a 0" },
        { status: 400 }
      );
    }

    if (!esSucursalValida(sucursalBody)) {
      return NextResponse.json(
        { error: "La sucursal es obligatoria y debe ser válida" },
        { status: 400 }
      );
    }

    if (isNaN(responsableDirectoId) || responsableDirectoId < 1) {
      return NextResponse.json(
        { error: "El responsable directo es obligatorio" },
        { status: 400 }
      );
    }

    if (!esEstadoValido(statusBody)) {
      return NextResponse.json(
        { error: "El status es obligatorio y debe ser válido" },
        { status: 400 }
      );
    }

    const sucursal: Sucursal = sucursalBody;
    const status: EstadoActivo = statusBody;

    const responsableExiste = await db.usuario.findUnique({
      where: {
        id: responsableDirectoId,
      },
    });

    if (!responsableExiste) {
      return NextResponse.json(
        { error: "El responsable directo no existe" },
        { status: 404 }
      );
    }

    const numeroControlExiste = await db.activo_fijo.findUnique({
      where: {
        numeroControl,
      },
    });

    if (numeroControlExiste) {
      return NextResponse.json(
        { error: "Ya existe un activo con ese número de control" },
        { status: 400 }
      );
    }

    if (numeroSerie) {
      const numeroSerieExiste = await db.activo_fijo.findFirst({
        where: {
          numeroSerie,
        },
      });

      if (numeroSerieExiste) {
        return NextResponse.json(
          { error: "Ya existe un activo con ese número de serie" },
          { status: 400 }
        );
      }
    }

    const nuevoActivo = await db.activo_fijo.create({
      data: {
        numeroControl,
        descripcionActivo,
        existencia,
        medidas,
        modeloMarca,
        numeroSerie,
        condicionesActivo,
        observaciones,
        sucursal,
        ubicacion,
        responsableDirectoId,
        status,
      },
      include: {
        responsableDirecto: {
          select: {
            id: true,
            nombre: true,
            correo: true,
          },
        },
      },
    });

    await registrarHistorial({
      activoId: nuevoActivo.id,
      numeroControl: nuevoActivo.numeroControl,
      descripcion: nuevoActivo.descripcionActivo,
      tipoMovimiento: "ALTA",
      detalle: `Se registró el activo con status ${nuevoActivo.status}${nuevoActivo.ubicacion ? ` en ubicación ${nuevoActivo.ubicacion}` : ""}`,
      sucursal: nuevoActivo.sucursal as Sucursal,
      usuarioId: responsableDirectoId,
      usuarioNombre: responsableExiste.nombre,
    });

    return NextResponse.json(
      {
        message: "Activo registrado correctamente",
        activo: nuevoActivo,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error al registrar activo:", error);
    return NextResponse.json(
      { error: "Error interno al registrar el activo" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    const id = Number(body.id);
    const numeroControl = String(body.numeroControl ?? "").trim();
    const descripcionActivo = String(body.descripcionActivo ?? "").trim();
    const existencia = Number(body.existencia);
    const medidas = body.medidas ? String(body.medidas).trim() : null;
    const modeloMarca = body.modeloMarca
      ? String(body.modeloMarca).trim()
      : null;
    const numeroSerie = body.numeroSerie ? String(body.numeroSerie).trim() : null;
    const condicionesActivo = body.condicionesActivo
      ? String(body.condicionesActivo).trim()
      : null;
    const observaciones = body.observaciones
      ? String(body.observaciones).trim()
      : null;
    const sucursalBody = body.sucursal ? String(body.sucursal).trim() : null;
    const ubicacion = body.ubicacion ? String(body.ubicacion).trim() : null;
    const responsableDirectoId = Number(body.responsableDirectoId);
    const statusBody = body.status ? String(body.status).trim() : null;

    if (isNaN(id) || id < 1) {
      return NextResponse.json(
        { error: "El id es obligatorio y debe ser válido" },
        { status: 400 }
      );
    }

    if (!numeroControl) {
      return NextResponse.json(
        { error: "El número de control es obligatorio" },
        { status: 400 }
      );
    }

    if (!descripcionActivo) {
      return NextResponse.json(
        { error: "La descripción del activo es obligatoria" },
        { status: 400 }
      );
    }

    if (isNaN(existencia) || existencia < 1) {
      return NextResponse.json(
        { error: "La existencia debe ser mayor a 0" },
        { status: 400 }
      );
    }

    if (!esSucursalValida(sucursalBody)) {
      return NextResponse.json(
        { error: "La sucursal es obligatoria y debe ser válida" },
        { status: 400 }
      );
    }

    if (isNaN(responsableDirectoId) || responsableDirectoId < 1) {
      return NextResponse.json(
        { error: "El responsable directo es obligatorio" },
        { status: 400 }
      );
    }

    if (!esEstadoValido(statusBody)) {
      return NextResponse.json(
        { error: "El status es obligatorio y debe ser válido" },
        { status: 400 }
      );
    }

    const sucursal: Sucursal = sucursalBody;
    const status: EstadoActivo = statusBody;

    const activoExiste = await db.activo_fijo.findUnique({
      where: { id },
      include: {
        responsableDirecto: {
          select: {
            id: true,
            nombre: true,
            correo: true,
          },
        },
      },
    });

    if (!activoExiste) {
      return NextResponse.json(
        { error: "Activo no encontrado" },
        { status: 404 }
      );
    }

    const responsableExiste = await db.usuario.findUnique({
      where: {
        id: responsableDirectoId,
      },
    });

    if (!responsableExiste) {
      return NextResponse.json(
        { error: "El responsable directo no existe" },
        { status: 404 }
      );
    }

    const numeroControlDuplicado = await db.activo_fijo.findFirst({
      where: {
        numeroControl,
        NOT: {
          id,
        },
      },
    });

    if (numeroControlDuplicado) {
      return NextResponse.json(
        { error: "Ya existe otro activo con ese número de control" },
        { status: 400 }
      );
    }

    if (numeroSerie) {
      const numeroSerieDuplicado = await db.activo_fijo.findFirst({
        where: {
          numeroSerie,
          NOT: {
            id,
          },
        },
      });

      if (numeroSerieDuplicado) {
        return NextResponse.json(
          { error: "Ya existe otro activo con ese número de serie" },
          { status: 400 }
        );
      }
    }

    const cambios: string[] = [];

    if (activoExiste.numeroControl !== numeroControl) {
      cambios.push(`Número de control: ${activoExiste.numeroControl} → ${numeroControl}`);
    }

    if (activoExiste.descripcionActivo !== descripcionActivo) {
      cambios.push(`Descripción: ${activoExiste.descripcionActivo} → ${descripcionActivo}`);
    }

    if (activoExiste.existencia !== existencia) {
      cambios.push(`Existencia: ${activoExiste.existencia} → ${existencia}`);
    }

    if ((activoExiste.medidas ?? "") !== (medidas ?? "")) {
      cambios.push(`Medidas: ${activoExiste.medidas ?? "Sin dato"} → ${medidas ?? "Sin dato"}`);
    }

    if ((activoExiste.modeloMarca ?? "") !== (modeloMarca ?? "")) {
      cambios.push(`Modelo/Marca: ${activoExiste.modeloMarca ?? "Sin dato"} → ${modeloMarca ?? "Sin dato"}`);
    }

    if ((activoExiste.numeroSerie ?? "") !== (numeroSerie ?? "")) {
      cambios.push(`Número de serie: ${activoExiste.numeroSerie ?? "Sin dato"} → ${numeroSerie ?? "Sin dato"}`);
    }

    if ((activoExiste.condicionesActivo ?? "") !== (condicionesActivo ?? "")) {
      cambios.push(`Condiciones: ${activoExiste.condicionesActivo ?? "Sin dato"} → ${condicionesActivo ?? "Sin dato"}`);
    }

    if ((activoExiste.observaciones ?? "") !== (observaciones ?? "")) {
      cambios.push(`Observaciones actualizadas`);
    }

    if (activoExiste.sucursal !== sucursal) {
      cambios.push(`Sucursal: ${activoExiste.sucursal} → ${sucursal}`);
    }

    if ((activoExiste.ubicacion ?? "") !== (ubicacion ?? "")) {
      cambios.push(`Ubicación: ${activoExiste.ubicacion ?? "Sin ubicación"} → ${ubicacion ?? "Sin ubicación"}`);
    }

    if (activoExiste.status !== status) {
      cambios.push(`Status: ${activoExiste.status} → ${status}`);
    }

    if ((activoExiste.responsableDirectoId ?? 0) !== responsableDirectoId) {
      cambios.push(
        `Responsable: ${activoExiste.responsableDirecto?.nombre ?? "Sin responsable"} → ${responsableExiste.nombre}`
      );
    }

    const activoActualizado = await db.activo_fijo.update({
      where: { id },
      data: {
        numeroControl,
        descripcionActivo,
        existencia,
        medidas,
        modeloMarca,
        numeroSerie,
        condicionesActivo,
        observaciones,
        sucursal,
        ubicacion,
        responsableDirectoId,
        status,
      },
      include: {
        responsableDirecto: {
          select: {
            id: true,
            nombre: true,
            correo: true,
          },
        },
      },
    });

    await registrarHistorial({
      activoId: activoActualizado.id,
      numeroControl: activoActualizado.numeroControl,
      descripcion: activoActualizado.descripcionActivo,
      tipoMovimiento: "EDICION",
      detalle:
        cambios.length > 0
          ? cambios.join(" | ")
          : "Se editó el activo sin cambios detectables en los campos principales",
      sucursal: activoActualizado.sucursal as Sucursal,
      usuarioId: responsableDirectoId,
      usuarioNombre: responsableExiste.nombre,
    });

    return NextResponse.json({
      message: "Activo actualizado correctamente",
      activo: activoActualizado,
    });
  } catch (error) {
    console.error("Error al actualizar activo:", error);
    return NextResponse.json(
      { error: "Error interno al actualizar el activo" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const idParam = searchParams.get("id");
    const sucursalParam = searchParams.get("sucursal");

    if (!idParam) {
      return NextResponse.json(
        { error: "El id es obligatorio" },
        { status: 400 }
      );
    }

    const id = Number(idParam);

    if (isNaN(id) || id < 1) {
      return NextResponse.json(
        { error: "El id enviado no es válido" },
        { status: 400 }
      );
    }

    let sucursal: Sucursal | undefined = undefined;

    if (sucursalParam) {
      if (!esSucursalValida(sucursalParam)) {
        return NextResponse.json(
          { error: "La sucursal enviada no es válida" },
          { status: 400 }
        );
      }

      sucursal = sucursalParam;
    }

    const activo = await db.activo_fijo.findUnique({
      where: {
        id,
      },
      include: {
        responsableDirecto: {
          select: {
            id: true,
            nombre: true,
            correo: true,
          },
        },
      },
    });

    if (!activo) {
      return NextResponse.json(
        { error: "Activo no encontrado" },
        { status: 404 }
      );
    }

    if (sucursal && activo.sucursal !== sucursal) {
      return NextResponse.json(
        { error: "No puedes eliminar un activo de otra sucursal" },
        { status: 403 }
      );
    }

    await registrarHistorial({
      activoId: activo.id,
      numeroControl: activo.numeroControl,
      descripcion: activo.descripcionActivo,
      tipoMovimiento: "BAJA",
      detalle: `Se eliminó el activo con status ${activo.status}${activo.ubicacion ? ` ubicado en ${activo.ubicacion}` : ""}`,
      sucursal: activo.sucursal as Sucursal,
      usuarioId: activo.responsableDirectoId ?? null,
      usuarioNombre: activo.responsableDirecto?.nombre ?? null,
    });

    await db.activo_fijo.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      message: "Activo eliminado correctamente",
    });
  } catch (error) {
    console.error("Error al eliminar activo:", error);
    return NextResponse.json(
      { error: "Error al eliminar activo" },
      { status: 500 }
    );
  }
}