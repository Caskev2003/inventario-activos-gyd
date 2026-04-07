"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function BotonRefrescar() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleRefresh = () => {
    setLoading(true);

    // pequeño delay visual
    setTimeout(() => {
      router.refresh();
      setLoading(false);
    }, 500);
  };

  return (
    <button
      onClick={handleRefresh}
      className="bg-gray-500 hover:bg-gray-600 text-white h-10 px-6 rounded-full flex items-center justify-center"
    >
      {loading ? "Actualizando..." : "Actualizar"}
    </button>
  );
}