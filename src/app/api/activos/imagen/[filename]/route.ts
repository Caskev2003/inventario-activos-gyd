import { NextResponse } from "next/server";
import { access, readFile } from "fs/promises";
import { constants } from "fs";
import path from "path";

export const runtime = "nodejs";

function getContentType(filename: string) {
  const ext = path.extname(filename).toLowerCase();

  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".webp") return "image/webp";

  return "application/octet-stream";
}

export async function GET(
  request: Request,
  { params }: { params: { filename: string } }
) {
  try {
    const filename = decodeURIComponent(params.filename);

    // IMPORTANTE: misma carpeta que upload
    const baseDir = path.join(process.cwd(), "uploads");
    const filePath = path.join(baseDir, "activos", filename);

    console.log("🔍 Intentando leer imagen desde:", filePath);

    await access(filePath, constants.F_OK);

    const fileBuffer = await readFile(filePath);

    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        "Content-Type": getContentType(filename),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("❌ Error al leer imagen:", error);

    return NextResponse.json(
      { error: "Imagen no encontrada" },
      { status: 404 }
    );
  }
}