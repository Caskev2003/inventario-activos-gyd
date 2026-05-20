"use client";

import { useEffect, useState } from "react";

export function RelojMexico() {
  const [fecha, setFecha] = useState("");

  useEffect(() => {
    const actualizar = () => {
      const ahora = new Date();

      setFecha(
        ahora.toLocaleString("es-MX", {
          timeZone: "America/Mexico_City",
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
    };

    actualizar();

    const intervalo = setInterval(actualizar, 1000);

    return () => clearInterval(intervalo);
  }, []);

  return (
    <div className="text-white text-sm bg-[#1e3a5f] px-4 py-2 rounded-full font-semibold">
      {fecha}
    </div>
  );
}