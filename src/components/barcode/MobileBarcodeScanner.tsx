"use client";

import { useEffect, useRef, useState } from "react";

import {
  BrowserMultiFormatReader,
  IScannerControls,
} from "@zxing/browser";

import {
  DecodeHintType,
  BarcodeFormat,
} from "@zxing/library";

import { Camera, X } from "lucide-react";

interface Props {
  onScan: (codigo: string) => void;
}

export function MobileBarcodeScanner({ onScan }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const [open, setOpen] = useState(false);
  const [mensaje, setMensaje] = useState("Apunta la cámara al código de barras.");

  useEffect(() => {
    if (!open || !videoRef.current) return;

    const hints = new Map();

    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.CODE_128,
      BarcodeFormat.CODE_39,
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
    ]);

    hints.set(DecodeHintType.TRY_HARDER, true);

    const reader = new BrowserMultiFormatReader(hints, {
      delayBetweenScanAttempts: 150,
      delayBetweenScanSuccess: 500,
    });

    reader
      .decodeFromConstraints(
        {
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        },
        videoRef.current,
        (result) => {
          if (result) {
            const codigo = result.getText();

            if (codigo) {
              onScan(codigo);
              setOpen(false);
              controlsRef.current?.stop();
            }
          }
        }
      )
      .then((controls) => {
        controlsRef.current = controls;
      })
      .catch((error) => {
        console.error("Error al abrir cámara:", error);
        setMensaje("No se pudo iniciar la cámara.");
      });

    return () => {
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, [open, onScan]);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setMensaje("Apunta la cámara al código de barras.");
          setOpen(true);
        }}
        className="flex h-[46px] w-[52px] shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md transition hover:bg-emerald-700 md:hidden"
        title="Escanear código"
      >
        <Camera size={22} />
      </button>

      {open && (
        <div className="fixed inset-0 z-[99999] bg-black">
          <div className="flex items-center justify-between p-4 text-white">
            <h2 className="text-lg font-bold">Escanear código</h2>

            <button
              type="button"
              onClick={() => {
                controlsRef.current?.stop();
                setOpen(false);
              }}
              className="rounded-full bg-white/10 p-2"
            >
              <X size={24} />
            </button>
          </div>

          <div className="px-4">
            <div className="relative overflow-hidden rounded-xl border border-white/20">
              <video
                ref={videoRef}
                className="h-[58vh] w-full object-cover"
                muted
                playsInline
                autoPlay
              />

              <div className="pointer-events-none absolute left-[8%] top-1/2 h-[120px] w-[84%] -translate-y-1/2 rounded-xl border-2 border-emerald-400 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />

              <div className="pointer-events-none absolute left-[10%] top-1/2 h-[2px] w-[80%] -translate-y-1/2 bg-red-500" />
            </div>

            <p className="mt-4 text-center text-sm text-white/80">
              {mensaje}
            </p>

            <p className="mt-2 text-center text-xs text-white/50">
              Acerca la cámara, mantén el código horizontal y con buena luz.
            </p>
          </div>
        </div>
      )}
    </>
  );
}