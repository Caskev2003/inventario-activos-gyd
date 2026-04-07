import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No se recibió ningún archivo" },
        { status: 400 }
      );
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Formato no permitido. Usa JPG, PNG o WEBP." },
        { status: 400 }
      );
    }

    const MAX_SIZE = 5 * 1024 * 1024;

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "La imagen es demasiado grande (máx 5MB)." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // IMPORTANTE: para desarrollo local usa siempre esta carpeta
    const baseDir = path.join(process.cwd(), "uploads");
    const uploadDir = path.join(baseDir, "activos");

    await mkdir(uploadDir, { recursive: true });

    const originalName = file.name.replace(/\s+/g, "_").toLowerCase();
    const ext = path.extname(originalName) || ".png";

    const uniqueName = `${Date.now()}-${crypto.randomUUID()}${ext}`;
    const filePath = path.join(uploadDir, uniqueName);

    await writeFile(filePath, buffer);

    console.log("✅ Imagen guardada en:", filePath);

    return NextResponse.json({
      ok: true,
      fileName: uniqueName,
      filePath,
    });
  } catch (error) {
    console.error("❌ Error al subir imagen:", error);

    return NextResponse.json(
      { error: "No se pudo guardar la imagen" },
      { status: 500 }
    );
  }
}