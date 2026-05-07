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

    if (sucursal) {
      where.sucursal = sucursal;
    }

    if (status) {
      where.status = status;
    } else {
      where.status = {
        not: "BAJA",
      };
    }

    const activos = await db.activo_fijo.findMany({
      where,
      include: includeActivo,
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

    const numeroControl = String(body.numeroControl ?? "").trim().toUpperCase();
    const descripcionActivo = String(body.descripcionActivo ?? "").trim();
    const tipoEquipoBody = body.tipoEquipo ? String(body.tipoEquipo).trim() : null;
    const existencia = Number(body.existencia);
    const medidas = body.medidas ? String(body.medidas).trim() : null;
    const modeloMarca = body.modeloMarca ? String(body.modeloMarca).trim() : null;
    const numeroSerie = body.numeroSerie ? String(body.numeroSerie).trim() : null;

    const condicionIngresoBody = body.condicionIngreso
      ? String(body.condicionIngreso).trim()
      : null;

    const observaciones = body.observaciones
      ? String(body.observaciones).trim()
      : null;

    const imagenActivo = body.imagenActivo
      ? String(body.imagenActivo).trim()
      : null;

    const sucursalBody = body.sucursal ? String(body.sucursal).trim() : null;
    const ubicacion = body.ubicacion ? String(body.ubicacion).trim() : null;
    const creadoPorId = body.creadoPorId ? Number(body.creadoPorId) : null;
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

    if (!esTipoEquipoValido(tipoEquipoBody)) {
      return NextResponse.json(
        { error: "El tipo de equipo es obligatorio y debe ser válido" },
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
        { error: "La condición de ingreso es obligatoria y debe ser válida" },
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
        { error: "El status es obligatorio y debe ser válido" },
        { status: 400 }
      );
    }

    if (!creadoPorId || creadoPorId < 1) {
      return NextResponse.json(
        { error: "No se pudo identificar al usuario que dio de alta" },
        { status: 400 }
      );
    }

    const sucursal: Sucursal = sucursalBody;
    const status: EstadoActivo = statusBody;
    const tipoEquipo: TipoEquipoActivo = tipoEquipoBody;
    const condicionIngreso: CondicionIngreso = condicionIngresoBody;

    const responsableSucursal = await db.responsable_sucursal.findUnique({
      where: {
        sucursal,
      },
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
        responsableCargo: responsableSucursal.cargo,
        creadoPorId,
        status,
      },
      include: includeActivo,
    });

    await registrarHistorial({
      activoId: nuevoActivo.id,
      numeroControl: nuevoActivo.numeroControl,
      descripcion: nuevoActivo.descripcionActivo,
      tipoMovimiento: "ALTA",
      detalle: `Se registró el activo [Tipo de equipo: ${nuevoActivo.tipoEquipo}] [Condición de ingreso: ${nuevoActivo.condicionIngreso}] [Responsable: ${
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
    const numeroControl = String(body.numeroControl ?? "").trim().toUpperCase();
    const descripcionActivo = String(body.descripcionActivo ?? "").trim();
    const tipoEquipoBody = body.tipoEquipo ? String(body.tipoEquipo).trim() : null;
    const existencia = Number(body.existencia);
    const medidas = body.medidas ? String(body.medidas).trim() : null;
    const modeloMarca = body.modeloMarca ? String(body.modeloMarca).trim() : null;
    const numeroSerie = body.numeroSerie ? String(body.numeroSerie).trim() : null;

    const condicionIngresoBody = body.condicionIngreso
      ? String(body.condicionIngreso).trim()
      : null;

    const observaciones = body.observaciones
      ? String(body.observaciones).trim()
      : null;

    const imagenActivo =
      body.imagenActivo !== undefined && body.imagenActivo !== null
        ? String(body.imagenActivo).trim()
        : null;

    const sucursalBody = body.sucursal ? String(body.sucursal).trim() : null;
    const ubicacion = body.ubicacion ? String(body.ubicacion).trim() : null;
    const creadoPorId =
      body.creadoPorId !== undefined && body.creadoPorId !== null
        ? Number(body.creadoPorId)
        : null;
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

    if (!esTipoEquipoValido(tipoEquipoBody)) {
      return NextResponse.json(
        { error: "El tipo de equipo es obligatorio y debe ser válido" },
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
        { error: "La condición de ingreso es obligatoria y debe ser válida" },
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
        { error: "El status es obligatorio y debe ser válido" },
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

    let creadoPorExiste: { id: number; nombre: string } | null = null;

    if (creadoPorId && creadoPorId > 0) {
      creadoPorExiste = await db.usuario.findUnique({
        where: { id: creadoPorId },
        select: {
          id: true,
          nombre: true,
        },
      });

      if (!creadoPorExiste) {
        return NextResponse.json(
          { error: "El usuario que dio de alta no existe" },
          { status: 404 }
        );
      }
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
      where: {
        sucursal,
      },
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

    if (activoExiste.numeroControl !== numeroControl) {
      cambios.push(`Número de control: ${activoExiste.numeroControl} → ${numeroControl}`);
    }

    if (activoExiste.descripcionActivo !== descripcionActivo) {
      cambios.push(`Descripción: ${activoExiste.descripcionActivo} → ${descripcionActivo}`);
    }

    if (activoExiste.tipoEquipo !== tipoEquipo) {
      cambios.push(`Tipo de equipo: ${activoExiste.tipoEquipo} → ${tipoEquipo}`);
    }

    if (activoExiste.existencia !== existencia) {
      cambios.push(`Existencia: ${activoExiste.existencia} → ${existencia}`);
    }

    if ((activoExiste.medidas ?? "") !== (medidas ?? "")) {
      cambios.push(`Medidas: ${activoExiste.medidas ?? "Sin dato"} → ${medidas ?? "Sin dato"}`);
    }

    if ((activoExiste.modeloMarca ?? "") !== (modeloMarca ?? "")) {
      cambios.push(
        `Modelo/Marca: ${activoExiste.modeloMarca ?? "Sin dato"} → ${modeloMarca ?? "Sin dato"}`
      );
    }

    if ((activoExiste.numeroSerie ?? "") !== (numeroSerie ?? "")) {
      cambios.push(
        `Número de serie: ${activoExiste.numeroSerie ?? "Sin dato"} → ${numeroSerie ?? "Sin dato"}`
      );
    }

    if ((activoExiste.condicionIngreso ?? "") !== (condicionIngreso ?? "")) {
      cambios.push(
        `Condición de ingreso: ${activoExiste.condicionIngreso ?? "Sin dato"} → ${
          condicionIngreso ?? "Sin dato"
        }`
      );
    }

    if ((activoExiste.observaciones ?? "") !== (observaciones ?? "")) {
      cambios.push("Observaciones actualizadas");
    }

    if ((activoExiste.imagenActivo ?? "") !== (imagenActivo ?? "")) {
      cambios.push("Imagen actualizada");
    }

    if (activoExiste.sucursal !== sucursal) {
      cambios.push(`Sucursal: ${activoExiste.sucursal} → ${sucursal}`);
    }

    if ((activoExiste.ubicacion ?? "") !== (ubicacion ?? "")) {
      cambios.push(
        `Ubicación: ${activoExiste.ubicacion ?? "Sin ubicación"} → ${
          ubicacion ?? "Sin ubicación"
        }`
      );
    }

    if ((activoExiste.responsableNombre ?? "") !== responsableSucursal.nombreResponsable) {
      cambios.push(
        `Responsable: ${activoExiste.responsableNombre ?? "Sin responsable"} → ${
          responsableSucursal.nombreResponsable
        }`
      );
    }

    if (activoExiste.status !== status) {
      cambios.push(`Status: ${activoExiste.status} → ${status}`);
    }

    if ((activoExiste.creadoPorId ?? 0) !== (creadoPorId ?? 0)) {
      cambios.push(
        `Dado de alta por: ${activoExiste.creadoPor?.nombre ?? "Sin dato"} → ${
          creadoPorExiste?.nombre ?? "Sin dato"
        }`
      );
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
        responsableCargo: responsableSucursal.cargo,
        creadoPorId,
        status,
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
          : "Se editó el activo sin cambios detectables en los campos principales",
      sucursal: activoActualizado.sucursal as Sucursal,
      usuarioId: creadoPorId ?? null,
      usuarioNombre: creadoPorExiste?.nombre ?? null,
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

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    const id = Number(body.id);
    const statusBody = body.status ? String(body.status).trim() : null;

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

    const activoActualizado = await db.activo_fijo.update({
      where: { id },
      data: {
        status: statusBody,
      },
      include: includeActivo,
    });

    await registrarHistorial({
      activoId: activoActualizado.id,
      numeroControl: activoActualizado.numeroControl,
      descripcion: activoActualizado.descripcionActivo,
      tipoMovimiento: "CAMBIO_STATUS",
      detalle: `Se cambió el status del activo de ${activoExiste.status} a ${activoActualizado.status}`,
      sucursal: activoActualizado.sucursal as Sucursal,
      usuarioId: activoActualizado.creadoPorId ?? null,
      usuarioNombre: activoActualizado.creadoPor?.nombre ?? null,
    });

    return NextResponse.json({
      message: "Status actualizado correctamente",
      activo: activoActualizado,
    });
  } catch (error) {
    console.error("Error al cambiar status:", error);

    return NextResponse.json(
      { error: "Error al cambiar status del activo" },
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

    const activoDadoDeBaja = await db.activo_fijo.update({
      where: { id },
      data: {
        status: "BAJA",
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
      }]${activoDadoDeBaja.ubicacion ? ` ubicado en ${activoDadoDeBaja.ubicacion}` : ""}`,
      sucursal: activoDadoDeBaja.sucursal as Sucursal,
      usuarioId: activoDadoDeBaja.creadoPorId ?? null,
      usuarioNombre: activoDadoDeBaja.creadoPor?.nombre ?? null,
    });

    return NextResponse.json({
      message: "Activo dado de baja correctamente",
      activo: activoDadoDeBaja,
    });
  } catch (error) {
    console.error("Error al dar de baja activo:", error);

    return NextResponse.json(
      { error: "Error al dar de baja activo" },
      { status: 500 }
    );
  }
}