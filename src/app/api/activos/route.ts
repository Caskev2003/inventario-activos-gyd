import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

type Sucursal =
  | "TAPACHULA"
  | "CIUDAD_HIDALGO"
  | "TOSCANA"
  | "TUXTLA_GUTIERREZ"
  | "OFICINAS_ADMINISTRATIVAS"
  | "ALMACEN_CIUDAD_HIDALGO"
  | "ALMACEN_TUXTLA_GUTIERREZ";

type EstadoActivo = "ACTIVO" | "INACTIVO" | "MANTENIMIENTO" | "BAJA";

type CondicionIngreso =
  | "NUEVO"
  | "REACONDICIONADO"
  | "USADO"
  | "DONADO"
  | "TRANSFERIDO";

type TipoMovimiento =
  | "ALTA"
  | "EDICION"
  | "BAJA"
  | "CAMBIO_STATUS"
  | "CAMBIO_UBICACION"
  | "TRANSFERENCIA";

type TipoEquipoActivo =
  | "EQUIPO_MOBILIARIO"
  | "EQUIPO_OFICINA"
  | "EQUIPO_REPARTO"
  | "EQUIPO_TRANSPORTE";

const SUCURSALES_VALIDAS: Sucursal[] = [
  "TAPACHULA",
  "CIUDAD_HIDALGO",
  "TOSCANA",
  "TUXTLA_GUTIERREZ",
  "OFICINAS_ADMINISTRATIVAS",
  "ALMACEN_CIUDAD_HIDALGO",
  "ALMACEN_TUXTLA_GUTIERREZ",
];

const ESTADOS_VALIDOS: EstadoActivo[] = [
  "ACTIVO",
  "INACTIVO",
  "MANTENIMIENTO",
  "BAJA",
];

const CONDICIONES_INGRESO_VALIDAS: CondicionIngreso[] = [
  "NUEVO",
  "REACONDICIONADO",
  "USADO",
  "DONADO",
  "TRANSFERIDO",
];

const TIPOS_EQUIPO_VALIDOS: TipoEquipoActivo[] = [
  "EQUIPO_MOBILIARIO",
  "EQUIPO_OFICINA",
  "EQUIPO_REPARTO",
  "EQUIPO_TRANSPORTE",
];

function obtenerFechaMexico(): Date {
  return new Date(
    new Date().toLocaleString("en-US", {
      timeZone: "America/Mexico_City",
    })
  );
}

function esSucursalValida(valor: string | null): valor is Sucursal {
  return !!valor && SUCURSALES_VALIDAS.includes(valor as Sucursal);
}

function esEstadoValido(valor: string | null): valor is EstadoActivo {
  return !!valor && ESTADOS_VALIDOS.includes(valor as EstadoActivo);
}

function esCondicionIngresoValida(valor: string | null): valor is CondicionIngreso {
  return !!valor && CONDICIONES_INGRESO_VALIDAS.includes(valor as CondicionIngreso);
}

function esTipoEquipoValido(valor: string | null): valor is TipoEquipoActivo {
  return !!valor && TIPOS_EQUIPO_VALIDOS.includes(valor as TipoEquipoActivo);
}

function normalizarValor(valor: any): string {
  if (valor === null || valor === undefined || valor === "") return "Sin dato";
  return String(valor);
}

function agregarCambio(
  cambios: string[],
  campo: string,
  anterior: any,
  nuevo: any
) {
  const valorAnterior = normalizarValor(anterior);
  const valorNuevo = normalizarValor(nuevo);

  if (valorAnterior !== valorNuevo) {
    cambios.push(`Actualizó ${campo}: "${valorAnterior}" → "${valorNuevo}"`);
  }
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
      fecha: obtenerFechaMexico(),
    },
  });
}

const includeActivo = {
  creadoPor: {
    select: {
      id: true,
      nombre: true,
      correo: true,
    },
  },
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const idParam = searchParams.get("id");
    const sucursalParam = searchParams.get("sucursal");
    const statusParam = searchParams.get("status");

    let sucursal: Sucursal | undefined = undefined;
    let status: EstadoActivo | undefined = undefined;

    if (sucursalParam) {
      if (!esSucursalValida(sucursalParam)) {
        return NextResponse.json(
          { error: "La sucursal enviada no es válida" },
          { status: 400 }
        );
      }

      sucursal = sucursalParam;
    }

    if (statusParam) {
      if (!esEstadoValido(statusParam)) {
        return NextResponse.json(
          { error: "El status enviado no es válido" },
          { status: 400 }
        );
      }

      status = statusParam;
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
        where: { id },
        include: includeActivo,
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

    const where: {
      sucursal?: Sucursal;
      status?: EstadoActivo | { not: EstadoActivo };
    } = {};

    if (sucursal) where.sucursal = sucursal;

    if (status) {
      where.status = status;
    } else {
      where.status = { not: "BAJA" };
    }

    const activos = await db.activo_fijo.findMany({
      where,
      include: includeActivo,
      orderBy: { createdAt: "desc" },
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

    const numeroControl = String(body.numeroControl ?? "").trim().toUpperCase();
    const descripcionActivo = String(body.descripcionActivo ?? "").trim();

    const tipoEquipoBody = body.tipoEquipo
      ? String(body.tipoEquipo).trim()
      : "EQUIPO_MOBILIARIO";

    const existencia = body.existencia ? Number(body.existencia) : 1;

    const medidas = body.medidas ? String(body.medidas).trim() : null;
    const modeloMarca = body.modeloMarca ? String(body.modeloMarca).trim() : null;
    const numeroSerie = body.numeroSerie ? String(body.numeroSerie).trim() : null;

    const condicionIngresoBody = body.condicionIngreso
      ? String(body.condicionIngreso).trim()
      : "NUEVO";

    const observaciones = body.observaciones
      ? String(body.observaciones).trim()
      : null;

    const imagenActivo = body.imagenActivo
      ? String(body.imagenActivo).trim()
      : null;

    const sucursalBody = body.sucursal ? String(body.sucursal).trim() : null;

    const ubicacion = body.ubicacion ? String(body.ubicacion).trim() : null;

    const creadoPorId =
      body.creadoPorId !== undefined && body.creadoPorId !== null
        ? Number(body.creadoPorId)
        : null;

    const statusBody = body.status ? String(body.status).trim() : "ACTIVO";

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

    if (!esTipoEquipoValido(tipoEquipoBody)) {
      return NextResponse.json(
        { error: "El tipo de equipo no es válido" },
        { status: 400 }
      );
    }

    if (isNaN(existencia) || existencia < 1) {
      return NextResponse.json(
        { error: "La existencia debe ser mayor a 0" },
        { status: 400 }
      );
    }

    if (!esCondicionIngresoValida(condicionIngresoBody)) {
      return NextResponse.json(
        { error: "La condición de ingreso no es válida" },
        { status: 400 }
      );
    }

    if (!esSucursalValida(sucursalBody)) {
      return NextResponse.json(
        { error: "La sucursal es obligatoria y debe ser válida" },
        { status: 400 }
      );
    }

    if (!esEstadoValido(statusBody)) {
      return NextResponse.json(
        { error: "El status no es válido" },
        { status: 400 }
      );
    }

    if (!creadoPorId || creadoPorId < 1 || isNaN(creadoPorId)) {
      return NextResponse.json(
        { error: "No se pudo identificar al usuario que dio de alta" },
        { status: 400 }
      );
    }

    const sucursal: Sucursal = sucursalBody;
    const status: EstadoActivo = statusBody;
    const tipoEquipo: TipoEquipoActivo = tipoEquipoBody;
    const condicionIngreso: CondicionIngreso = condicionIngresoBody;

    const usuarioCreoExiste = await db.usuario.findUnique({
      where: { id: creadoPorId },
      select: {
        id: true,
        nombre: true,
      },
    });

    if (!usuarioCreoExiste) {
      return NextResponse.json(
        { error: "El usuario que dio de alta no existe" },
        { status: 404 }
      );
    }

    const responsableSucursal = await db.responsable_sucursal.findUnique({
      where: { sucursal },
    });

    if (!responsableSucursal) {
      return NextResponse.json(
        {
          error:
            "No hay responsable asignado para esta sucursal. Primero registra un responsable.",
        },
        { status: 400 }
      );
    }

    const numeroControlExiste = await db.activo_fijo.findFirst({
      where: {
        numeroControl,
        sucursal,
      },
    });

    if (numeroControlExiste) {
      return NextResponse.json(
        {
          error:
            "Ya existe un activo con ese número de control en esta sucursal",
        },
        { status: 400 }
      );
    }

    if (numeroSerie) {
      const numeroSerieExiste = await db.activo_fijo.findFirst({
        where: { numeroSerie },
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
        tipoEquipo,
        existencia,
        medidas,
        modeloMarca,
        numeroSerie,
        condicionIngreso,
        observaciones,
        imagenActivo,
        sucursal,
        ubicacion,
        responsableNombre: responsableSucursal.nombreResponsable,
        responsableCargo: responsableSucursal.cargo ?? null,
        creadoPorId,
        status,
        createdAt: obtenerFechaMexico(),
        updatedAt: obtenerFechaMexico(),
      },
      include: includeActivo,
    });

    await registrarHistorial({
      activoId: nuevoActivo.id,
      numeroControl: nuevoActivo.numeroControl,
      descripcion: nuevoActivo.descripcionActivo,
      tipoMovimiento: "ALTA",
      detalle: `Se registró el activo [Tipo de equipo: ${
        nuevoActivo.tipoEquipo
      }] [Condición de ingreso: ${
        nuevoActivo.condicionIngreso ?? "Sin condición"
      }] [Responsable: ${
        nuevoActivo.responsableNombre ?? "Sin responsable"
      }] con status ${nuevoActivo.status}${
        nuevoActivo.ubicacion ? ` en ubicación ${nuevoActivo.ubicacion}` : ""
      }${nuevoActivo.imagenActivo ? " con imagen adjunta" : ""}`,
      sucursal: nuevoActivo.sucursal as Sucursal,
      usuarioId: creadoPorId,
      usuarioNombre: usuarioCreoExiste.nombre,
    });

    return NextResponse.json(
      {
        message: "Activo registrado correctamente",
        activo: nuevoActivo,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error al registrar activo:", error);

    return NextResponse.json(
      {
        error: "Error interno al registrar el activo",
        detail: error?.message ?? String(error),
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    const id = Number(body.id);
    const numeroControl = String(body.numeroControl ?? "").trim().toUpperCase();
    const descripcionActivo = String(body.descripcionActivo ?? "").trim();

    const tipoEquipoBody = body.tipoEquipo
      ? String(body.tipoEquipo).trim()
      : "EQUIPO_MOBILIARIO";

    const existencia = body.existencia ? Number(body.existencia) : 1;

    const medidas = body.medidas ? String(body.medidas).trim() : null;
    const modeloMarca = body.modeloMarca ? String(body.modeloMarca).trim() : null;
    const numeroSerie = body.numeroSerie ? String(body.numeroSerie).trim() : null;

    const condicionIngresoBody = body.condicionIngreso
      ? String(body.condicionIngreso).trim()
      : "NUEVO";

    const observaciones = body.observaciones
      ? String(body.observaciones).trim()
      : null;

    const imagenActivo =
      body.imagenActivo !== undefined && body.imagenActivo !== null
        ? String(body.imagenActivo).trim()
        : null;

    const sucursalBody = body.sucursal ? String(body.sucursal).trim() : null;
    const ubicacion = body.ubicacion ? String(body.ubicacion).trim() : null;

    const usuarioMovimientoId =
      body.usuarioId !== undefined && body.usuarioId !== null
        ? Number(body.usuarioId)
        : body.actualizadoPorId !== undefined && body.actualizadoPorId !== null
        ? Number(body.actualizadoPorId)
        : body.creadoPorId !== undefined && body.creadoPorId !== null
        ? Number(body.creadoPorId)
        : null;

    const creadoPorId =
      body.creadoPorId !== undefined && body.creadoPorId !== null
        ? Number(body.creadoPorId)
        : null;

    const statusBody = body.status ? String(body.status).trim() : "ACTIVO";

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

    if (!esTipoEquipoValido(tipoEquipoBody)) {
      return NextResponse.json(
        { error: "El tipo de equipo no es válido" },
        { status: 400 }
      );
    }

    if (isNaN(existencia) || existencia < 1) {
      return NextResponse.json(
        { error: "La existencia debe ser mayor a 0" },
        { status: 400 }
      );
    }

    if (!esCondicionIngresoValida(condicionIngresoBody)) {
      return NextResponse.json(
        { error: "La condición de ingreso no es válida" },
        { status: 400 }
      );
    }

    if (!esSucursalValida(sucursalBody)) {
      return NextResponse.json(
        { error: "La sucursal es obligatoria y debe ser válida" },
        { status: 400 }
      );
    }

    if (!esEstadoValido(statusBody)) {
      return NextResponse.json(
        { error: "El status no es válido" },
        { status: 400 }
      );
    }

    const sucursal: Sucursal = sucursalBody;
    const status: EstadoActivo = statusBody;
    const tipoEquipo: TipoEquipoActivo = tipoEquipoBody;
    const condicionIngreso: CondicionIngreso = condicionIngresoBody;

    const activoExiste = await db.activo_fijo.findUnique({
      where: { id },
      include: includeActivo,
    });

    if (!activoExiste) {
      return NextResponse.json(
        { error: "Activo no encontrado" },
        { status: 404 }
      );
    }

    let usuarioMovimiento: { id: number; nombre: string } | null = null;

    if (usuarioMovimientoId && usuarioMovimientoId > 0) {
      usuarioMovimiento = await db.usuario.findUnique({
        where: { id: usuarioMovimientoId },
        select: {
          id: true,
          nombre: true,
        },
      });
    }

    const numeroControlDuplicado = await db.activo_fijo.findFirst({
      where: {
        numeroControl,
        sucursal,
        NOT: { id },
      },
    });

    if (numeroControlDuplicado) {
      return NextResponse.json(
        {
          error:
            "Ya existe otro activo con ese número de control en esta sucursal",
        },
        { status: 400 }
      );
    }

    if (numeroSerie) {
      const numeroSerieDuplicado = await db.activo_fijo.findFirst({
        where: {
          numeroSerie,
          NOT: { id },
        },
      });

      if (numeroSerieDuplicado) {
        return NextResponse.json(
          { error: "Ya existe otro activo con ese número de serie" },
          { status: 400 }
        );
      }
    }

    const responsableSucursal = await db.responsable_sucursal.findUnique({
      where: { sucursal },
    });

    if (!responsableSucursal) {
      return NextResponse.json(
        {
          error:
            "No hay responsable asignado para esta sucursal. Primero registra un responsable.",
        },
        { status: 400 }
      );
    }

    const cambios: string[] = [];

    agregarCambio(cambios, "número de control", activoExiste.numeroControl, numeroControl);
    agregarCambio(cambios, "descripción", activoExiste.descripcionActivo, descripcionActivo);
    agregarCambio(cambios, "tipo de equipo", activoExiste.tipoEquipo, tipoEquipo);
    agregarCambio(cambios, "existencia", activoExiste.existencia, existencia);
    agregarCambio(cambios, "medidas", activoExiste.medidas, medidas);
    agregarCambio(cambios, "modelo/marca", activoExiste.modeloMarca, modeloMarca);
    agregarCambio(cambios, "número de serie", activoExiste.numeroSerie, numeroSerie);
    agregarCambio(cambios, "condición", activoExiste.condicionIngreso, condicionIngreso);
    agregarCambio(cambios, "observaciones", activoExiste.observaciones, observaciones);
    agregarCambio(cambios, "sucursal", activoExiste.sucursal, sucursal);
    agregarCambio(cambios, "ubicación", activoExiste.ubicacion, ubicacion);
    agregarCambio(cambios, "status", activoExiste.status, status);
    agregarCambio(
      cambios,
      "responsable",
      activoExiste.responsableNombre,
      responsableSucursal.nombreResponsable
    );

    if (normalizarValor(activoExiste.imagenActivo) !== normalizarValor(imagenActivo)) {
      if (!activoExiste.imagenActivo && imagenActivo) {
        cambios.push("Agregó imagen del activo");
      } else if (activoExiste.imagenActivo && !imagenActivo) {
        cambios.push("Eliminó imagen del activo");
      } else {
        cambios.push("Actualizó imagen del activo");
      }
    }

    const activoActualizado = await db.activo_fijo.update({
      where: { id },
      data: {
        numeroControl,
        descripcionActivo,
        tipoEquipo,
        existencia,
        medidas,
        modeloMarca,
        numeroSerie,
        condicionIngreso,
        observaciones,
        imagenActivo,
        sucursal,
        ubicacion,
        responsableNombre: responsableSucursal.nombreResponsable,
        responsableCargo: responsableSucursal.cargo ?? null,
        creadoPorId,
        status,
        updatedAt: obtenerFechaMexico(),
      },
      include: includeActivo,
    });

    await registrarHistorial({
      activoId: activoActualizado.id,
      numeroControl: activoActualizado.numeroControl,
      descripcion: activoActualizado.descripcionActivo,
      tipoMovimiento: "EDICION",
      detalle:
        cambios.length > 0
          ? cambios.join(" | ")
          : "Se abrió la edición, pero no se detectaron cambios en los datos",
      sucursal: activoActualizado.sucursal as Sucursal,
      usuarioId: usuarioMovimiento?.id ?? activoActualizado.creadoPorId ?? null,
      usuarioNombre:
        usuarioMovimiento?.nombre ?? activoActualizado.creadoPor?.nombre ?? null,
    });

    return NextResponse.json({
      message: "Activo actualizado correctamente",
      activo: activoActualizado,
    });
  } catch (error: any) {
    console.error("Error al actualizar activo:", error);

    return NextResponse.json(
      {
        error: "Error interno al actualizar el activo",
        detail: error?.message ?? String(error),
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    const id = Number(body.id);
    const statusBody = body.status ? String(body.status).trim() : null;

    const usuarioMovimientoId =
      body.usuarioId !== undefined && body.usuarioId !== null
        ? Number(body.usuarioId)
        : body.actualizadoPorId !== undefined && body.actualizadoPorId !== null
        ? Number(body.actualizadoPorId)
        : null;

    if (isNaN(id) || id < 1) {
      return NextResponse.json(
        { error: "El id es obligatorio y debe ser válido" },
        { status: 400 }
      );
    }

    if (!esEstadoValido(statusBody)) {
      return NextResponse.json(
        { error: "El status enviado no es válido" },
        { status: 400 }
      );
    }

    const activoExiste = await db.activo_fijo.findUnique({
      where: { id },
      include: includeActivo,
    });

    if (!activoExiste) {
      return NextResponse.json(
        { error: "Activo no encontrado" },
        { status: 404 }
      );
    }

    let usuarioMovimiento: { id: number; nombre: string } | null = null;

    if (usuarioMovimientoId && usuarioMovimientoId > 0) {
      usuarioMovimiento = await db.usuario.findUnique({
        where: { id: usuarioMovimientoId },
        select: {
          id: true,
          nombre: true,
        },
      });
    }

    const activoActualizado = await db.activo_fijo.update({
      where: { id },
      data: {
        status: statusBody,
        updatedAt: obtenerFechaMexico(),
      },
      include: includeActivo,
    });

    await registrarHistorial({
      activoId: activoActualizado.id,
      numeroControl: activoActualizado.numeroControl,
      descripcion: activoActualizado.descripcionActivo,
      tipoMovimiento: "CAMBIO_STATUS",
      detalle: `Actualizó status: "${activoExiste.status}" → "${activoActualizado.status}"`,
      sucursal: activoActualizado.sucursal as Sucursal,
      usuarioId: usuarioMovimiento?.id ?? activoActualizado.creadoPorId ?? null,
      usuarioNombre:
        usuarioMovimiento?.nombre ?? activoActualizado.creadoPor?.nombre ?? null,
    });

    return NextResponse.json({
      message: "Status actualizado correctamente",
      activo: activoActualizado,
    });
  } catch (error: any) {
    console.error("Error al cambiar status:", error);

    return NextResponse.json(
      {
        error: "Error al cambiar status del activo",
        detail: error?.message ?? String(error),
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const idParam = searchParams.get("id");
    const sucursalParam = searchParams.get("sucursal");
    const usuarioIdParam = searchParams.get("usuarioId");

    if (!idParam) {
      return NextResponse.json(
        { error: "El id es obligatorio" },
        { status: 400 }
      );
    }

    const id = Number(idParam);
    const usuarioMovimientoId = usuarioIdParam ? Number(usuarioIdParam) : null;

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
      where: { id },
      include: includeActivo,
    });

    if (!activo) {
      return NextResponse.json(
        { error: "Activo no encontrado" },
        { status: 404 }
      );
    }

    if (sucursal && activo.sucursal !== sucursal) {
      return NextResponse.json(
        { error: "No puedes dar de baja un activo de otra sucursal" },
        { status: 403 }
      );
    }

    let usuarioMovimiento: { id: number; nombre: string } | null = null;

    if (usuarioMovimientoId && usuarioMovimientoId > 0) {
      usuarioMovimiento = await db.usuario.findUnique({
        where: { id: usuarioMovimientoId },
        select: {
          id: true,
          nombre: true,
        },
      });
    }

    const activoDadoDeBaja = await db.activo_fijo.update({
      where: { id },
      data: {
        status: "BAJA",
        updatedAt: obtenerFechaMexico(),
      },
      include: includeActivo,
    });

    await registrarHistorial({
      activoId: activoDadoDeBaja.id,
      numeroControl: activoDadoDeBaja.numeroControl,
      descripcion: activoDadoDeBaja.descripcionActivo,
      tipoMovimiento: "BAJA",
      detalle: `Se dio de baja el activo [Tipo de equipo: ${
        activoDadoDeBaja.tipoEquipo
      }]${
        activoDadoDeBaja.ubicacion
          ? ` ubicado en ${activoDadoDeBaja.ubicacion}`
          : ""
      }`,
      sucursal: activoDadoDeBaja.sucursal as Sucursal,
      usuarioId: usuarioMovimiento?.id ?? activoDadoDeBaja.creadoPorId ?? null,
      usuarioNombre:
        usuarioMovimiento?.nombre ?? activoDadoDeBaja.creadoPor?.nombre ?? null,
    });

    return NextResponse.json({
      message: "Activo dado de baja correctamente",
      activo: activoDadoDeBaja,
    });
  } catch (error: any) {
    console.error("Error al dar de baja activo:", error);

    return NextResponse.json(
      {
        error: "Error al dar de baja activo",
        detail: error?.message ?? String(error),
      },
      { status: 500 }
    );
  }
}