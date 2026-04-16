"use client";

import { cn } from "@/lib/utils";
import React from "react";
import { itemsNavbar } from "@/data/itemsNavbar";
import Link from "next/link";
import { useScrollPosition } from "@/hooks/useScrollPosition";
import { useSession } from "next-auth/react";
import { UserProfileCard } from "@/components/shared/UserProfileCard"; // 👈 IMPORTANTE

export function NavbarDesktop() {
  const scrollPosition = useScrollPosition();
  const { data: session, status } = useSession();

  if (status === "loading") return null;

  const rol = session?.user?.rol ?? "";

  const itemsPermitidos = itemsNavbar.filter((item) =>
    item.roles.includes(rol)
  );

  return (
    <div
      className={cn(
        "z-30 left-0 right-0 top-0 h-16 fixed w-full transition-all duration-300",
        scrollPosition > 20 ? "bg-black text-white" : "bg-transparent text-white"
      )}
    >
      <div className="px-[4%] mx-auto h-full flex items-center justify-between bg-black">
        
        {/* IZQUIERDA */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center">
            <img
              src="/iconos/logo-gyd.png"
              alt="Logo G&D"
              className="h-12 w-auto object-contain"
            />
          </Link>

          <div className="flex gap-4">
            {itemsPermitidos.map((item) => (
              <Link
                key={item.name}
                href={item.link}
                className="hover:text-green-500 transition-all duration-300"
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>

        {/* DERECHA 👇 */}
        {session?.user && (
          <div className="flex items-center">
            <UserProfileCard />
          </div>
        )}

      </div>
    </div>
  );
}