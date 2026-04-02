"use client";

import { cn } from "@/lib/utils";
import { BellRing, CheckCircle, List } from "lucide-react";
import React, { useEffect, useState } from "react";
import { itemsNavbar } from "@/data/itemsNavbar";
import Link from "next/link";
import Image from "next/image";
import { useScrollPosition } from "@/hooks/useScrollPosition";
import { UserProfileCard } from "../../UserProfileCard";
import { useSession } from "next-auth/react";

interface Notificacion {
  id: number;
  codigo: number | string;
  descripcion: string;
  creadaEn: string;
}

export function NavbarDesktop() {
  const scrollPosition = useScrollPosition();
  const { data: session, status } = useSession();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [verTodas, setVerTodas] = useState(false);

  const [leidos, setLeidos] = useState<number[]>(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("notificaciones_leidas");
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  });

  const fetchNotificaciones = async () => {
    try {
      const res = await fetch(
        verTodas
          ? "/api/notificaciones/todas"
          : "/api/notificaciones/ultimas"
      );

      if (!res.ok) {
        throw new Error("No se pudieron cargar las notificaciones");
      }

      const data = await res.json();

      if (Array.isArray(data)) {
        setNotificaciones(data);
      } else if (Array.isArray(data.notificaciones)) {
        setNotificaciones(data.notificaciones);
      } else {
        setNotificaciones([]);
      }
    } catch (error) {
      console.error("Error al cargar notificaciones:", error);
      setNotificaciones([]);
    }
  };

  useEffect(() => {
    if (status !== "authenticated") return;

    const yaMostro = sessionStorage.getItem("notificaciones_mostradas");

    fetchNotificaciones();
    const interval = setInterval(fetchNotificaciones, 5000);

    if (!yaMostro) {
      setShowNotifications(true);
      sessionStorage.setItem("notificaciones_mostradas", "true");
    }

    return () => clearInterval(interval);
  }, [verTodas, status]);

  const notificacionesActivas = Array.isArray(notificaciones)
    ? notificaciones.filter((n) => !leidos.includes(n.id))
    : [];

  const marcarComoLeido = (id: number) => {
    const nuevos = [...new Set([...leidos, id])];
    setLeidos(nuevos);
    sessionStorage.setItem("notificaciones_leidas", JSON.stringify(nuevos));
  };

  const marcarTodasComoLeidas = () => {
    const todos = notificaciones.map((n) => n.id);
    setLeidos(todos);
    sessionStorage.setItem("notificaciones_leidas", JSON.stringify(todos));
  };

  const verDeNuevo = () => {
    sessionStorage.removeItem("notificaciones_mostradas");
    sessionStorage.removeItem("notificaciones_leidas");
    setLeidos([]);
    setShowNotifications(true);
    fetchNotificaciones();
  };

  const alternarVista = () => {
    setVerTodas((prev) => !prev);
    setLeidos([]);
    sessionStorage.removeItem("notificaciones_leidas");
  };

  if (status === "loading") return null;

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 z-30 h-16 w-full transition-all duration-300",
        scrollPosition > 20 ? "bg-black" : "bg-transparent"
      )}
    >
      <div className="h-full bg-black px-2 md:px-4 lg:px-6">
        <div className="flex h-full items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex h-14 w-[110px] items-center justify-center overflow-hidden"
            >
              <Image
                src="/iconos/logo.jpeg"
                alt="Distribución G&D"
                width={110}
                height={56}
                className="h-full w-full object-contain"
                priority
              />
            </Link>

            <div className="ml-4 flex gap-4">
              {itemsNavbar.map((item) => (
                <Link
                  key={item.name}
                  href={item.link}
                  className="hover:text-green-700 transition-all duration-300"
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          {session?.user && (
            <div className="flex gap-4 items-center relative">
              <div className="relative">
                <div
                  className="relative cursor-pointer"
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  <BellRing className="text-white" />
                  {notificacionesActivas.length > 0 && (
                    <span className="absolute -top-1 -right-3 text-xs bg-red-500 text-white px-1 rounded-full">
                      {notificacionesActivas.length}
                    </span>
                  )}
                </div>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-96 bg-white text-black shadow-lg rounded-lg p-4 z-50 max-h-96 overflow-y-auto">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-bold text-md">Notificaciones</h3>
                      <button
                        onClick={marcarTodasComoLeidas}
                        className="text-blue-600 text-sm hover:underline"
                      >
                        Marcar todas como leídas
                      </button>
                    </div>

                    {notificacionesActivas.length === 0 ? (
                      <div className="text-sm text-gray-500 space-y-2">
                        <p>No hay notificaciones pendientes.</p>
                        <button
                          onClick={verDeNuevo}
                          className="text-blue-600 hover:underline"
                        >
                          Ver notificaciones de nuevo
                        </button>
                      </div>
                    ) : (
                      notificacionesActivas.map((n) => (
                        <div
                          key={n.id}
                          className="text-sm border-b border-gray-200 pb-2 mb-2 flex justify-between items-start gap-2"
                        >
                          <div>
                            El producto <strong>{n.descripcion}</strong> con
                            código <strong>{n.codigo}</strong> está en existencia
                            0.
                          </div>
                          <button
                            onClick={() => marcarComoLeido(n.id)}
                            title="Marcar como leído"
                          >
                            <CheckCircle className="w-5 h-5 text-green-500 hover:text-green-700 mt-1" />
                          </button>
                        </div>
                      ))
                    )}

                    <div className="mt-4 text-right">
                      <button
                        onClick={alternarVista}
                        className="text-sm text-purple-700 hover:underline flex items-center gap-1 ml-auto"
                      >
                        <List className="w-4 h-4" />
                        {verTodas ? "Ver solo las últimas 24h" : "Ver todas"}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <UserProfileCard />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}