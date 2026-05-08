"use client";

import { useEffect, useRef, useState } from "react";
import {
  BrowserMultiFormatReader,
  IScannerControls,
} from "@zxing/browser";
import { Camera, X } from "lucide-react";

interface Props {
  onScan: (codigo: string) => void;
}

export function MobileBarcodeScanner({ onScan }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open || !videoRef.current) return;

    const reader = new BrowserMultiFormatReader();

    reader.decodeFromVideoDevice(
      undefined,
      videoRef.current,
      (result) => {
        if (result) {
          const codigo = result.getText();

          onScan(codigo);
          setOpen(false);
          controlsRef.current?.stop();
        }
      }
    ).then((controls) => {
      controlsRef.current = controls;
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
        onClick={() => setOpen(true)}
        className="md:hidden flex items-center justify-center rounded-xl bg-emerald-600 px-3 py-2 text-white shadow hover:bg-emerald-700"
        title="Escanear código"
      >
        <Camera size={20} />
      </button>

      {open && (
        <div className="fixed inset-0 z-[9999] bg-black">
          <div className="flex items-center justify-between p-4 text-white">
            <h2 className="text-lg font-bold">Escanear código de barras</h2>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full bg-white/10 p-2"
            >
              <X size={24} />
            </button>
          </div>

          <div className="px-4">
            <video
              ref={videoRef}
              className="h-[70vh] w-full rounded-xl object-cover"
              muted
              playsInline
            />

            <p className="mt-4 text-center text-sm text-white/80">
              Apunta la cámara al código de barras del activo.
            </p>
          </div>
        </div>
      )}
    </>
  );
}