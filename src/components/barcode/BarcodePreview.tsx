"use client";

import Image from "next/image";
import JsBarcode from "jsbarcode";
import { useEffect, useRef } from "react";

interface Props {
  value: string;
}

function limpiarTexto(valor: string) {
  return valor
    .trim()
    .replace(/\r/g, "")
    .replace(/\n/g, "")
    .replace(/\t/g, " ")
    .replace(/\s+/g, " ");
}

export default function BarcodePreview({ value }: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const texto = limpiarTexto(value || "SIN-CODIGO");

    try {
      JsBarcode(svgRef.current, texto, {
        format: "CODE128",
        displayValue: false,
        margin: 3,          // importante: deja aire a los lados
        width: 1.6,         // no tan delgado, no tan grueso
        height: 120,        // alto suficiente para el lector
        lineColor: "#000000",
        background: "#ffffff",
        flat: true,
      });
    } catch {
      svgRef.current.innerHTML = "";
    }
  }, [value]);

  return (
    <div
      style={{
        width: "50.8mm",
        height: "25.4mm",
        background: "#fff",
        padding: "0.5mm 0.8mm 0.4mm 0.5mm",
        boxSizing: "border-box",
        fontFamily: "Arial, Helvetica, sans-serif",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          textAlign: "center",
          fontWeight: 900,
          fontSize: "8px",
          lineHeight: 1,
          marginBottom: "0.4mm",
        }}
      >
        <div>DISTRIBUCION G&amp;D S.A. DE C.V</div>
        <div>CONTROL ACTIVO FIJO</div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "8mm 1fr",
          gap: "0.8mm",
          alignItems: "center",
          flex: 1,
          minHeight: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minWidth: 0,
            minHeight: 0,
          }}
        >
          <div
            style={{
              width: "7mm",
              height: "7mm",
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
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            minWidth: 0,
            minHeight: 0,
          }}
        >
          <svg
            ref={svgRef}
            style={{
              width: "100%",
              height: "11mm",
              display: "block",
            }}
          />

          <div
            style={{
              textAlign: "center",
              fontSize: "8px",
              fontWeight: 900,
              lineHeight: 1,
              marginTop: "0.4mm",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {limpiarTexto(value || "SIN-CODIGO")}
          </div>
        </div>
      </div>
    </div>
  );
}