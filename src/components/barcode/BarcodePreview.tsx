"use client";

import Image from "next/image";
import JsBarcode from "jsbarcode";
import { useEffect, useRef, useState } from "react";

interface Props {
  value: string;
}

function limpiarTexto(valor: string) {
  return valor
    .trim()
    .replace(/\r/g, "")
    .replace(/\n/g, "")
    .replace(/\t/g, " ")
    .replace(/\s+/g, " ")
    .toUpperCase();
}

export default function BarcodePreview({ value }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [barcodeUrl, setBarcodeUrl] = useState("");

  const textoLimpio = limpiarTexto(value || "SIN-CODIGO");

  useEffect(() => {
    if (!canvasRef.current) return;

    try {
      JsBarcode(canvasRef.current, textoLimpio, {
        format: "CODE128",
        displayValue: false,

        // Zona blanca para que el lector detecte inicio y fin
        margin: 10,
        marginLeft: 12,
        marginRight: 12,
        marginTop: 0,
        marginBottom: 0,

        // Barras más finas y legibles
        width: 1,
        height: 90,

        lineColor: "#000000",
        background: "#ffffff",
        flat: true,
      });

      setBarcodeUrl(canvasRef.current.toDataURL("image/png"));
    } catch {
      setBarcodeUrl("");
    }
  }, [textoLimpio]);

  return (
    <div
      style={{
        width: "50.8mm",
        height: "25.4mm",
        background: "#ffffff",
        padding: "0.6mm 1mm 0.8mm 1mm",
        boxSizing: "border-box",
        fontFamily: "Arial, Helvetica, sans-serif",
        color: "#000000",
        overflow: "hidden",
      }}
    >
      <canvas ref={canvasRef} style={{ display: "none" }} />

      <div
        style={{
          textAlign: "center",
          fontWeight: 900,
          fontSize: "9px",
          lineHeight: 0.95,
          letterSpacing: "0.3px",
          marginBottom: "0.8mm",
          whiteSpace: "nowrap",
        }}
      >
        DISTRIBUCION G&amp;D S.A. DE C.V
      </div>

      <div
        style={{
          textAlign: "center",
          fontWeight: 900,
          fontSize: "8px",
          lineHeight: 0.95,
          letterSpacing: "0.2px",
          marginBottom: "0.7mm",
          whiteSpace: "nowrap",
        }}
      >
        CONTROL ACTIVO FIJO
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "12mm 1fr",
          gap: "0.6mm",
          alignItems: "end",
        }}
      >
        <div
          style={{
            width: "12mm",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-end",
          }}
        >
          <div
            style={{
              width: "10.5mm",
              height: "10.5mm",
              position: "relative",
            }}
          >
            <Image
              src="/iconos/farmacia-gyd-logo-2.png"
              alt="logo"
              fill
              style={{ objectFit: "contain" }}
              priority
            />
          </div>

          <div
            style={{
              fontSize: "6.5px",
              fontWeight: 900,
              lineHeight: 1,
              marginTop: "0.1mm",
              whiteSpace: "nowrap",
            }}
          >
            FARMACIA
          </div>
        </div>

        <div
          style={{
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            overflow: "hidden",
            background: "#ffffff",
          }}
        >
          {barcodeUrl && (
            <img
              src={barcodeUrl}
              alt="barcode"
              style={{
                width: "100%",
                height: "8.8mm",
                objectFit: "fill",
                display: "block",
                imageRendering: "pixelated",
                background: "#ffffff",
              }}
            />
          )}

          <div
            style={{
              textAlign: "center",
              fontSize: "6.3px",
              fontWeight: 700,
              lineHeight: 1,
              marginTop: "0.3mm",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "clip",
            }}
          >
            {textoLimpio}
          </div>
        </div>
      </div>
    </div>
  );
}