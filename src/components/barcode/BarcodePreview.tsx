"use client";

import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

interface BarcodePreviewProps {
  value: string;
  width?: number;
  height?: number;
  fontSize?: number;
}

export default function BarcodePreview({
  value,
  width = 2,
  height = 70,
  fontSize = 18,
}: BarcodePreviewProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    if (!value.trim()) {
      svgRef.current.innerHTML = "";
      return;
    }

    try {
      JsBarcode(svgRef.current, value, {
        format: "CODE128",
        displayValue: false,
        width,
        height,
        margin: 10,
        background: "#ffffff",
        lineColor: "#000000",
      });
    } catch (error) {
      console.error("Error generando código de barras:", error);
      svgRef.current.innerHTML = "";
    }
  }, [value, width, height]);

  return (
    <div className="flex flex-col items-center justify-center rounded-lg bg-white p-4">
      <svg ref={svgRef} />
      {value.trim() && (
        <p
          className="mt-2 text-center font-semibold tracking-wide text-black"
          style={{ fontSize: `${fontSize}px` }}
        >
          {value}
        </p>
      )}
    </div>
  );
}