"use client";

import { cn } from "@/lib/utils";
import React, { useState } from "react";
import { itemsNavbar } from "@/data/itemsNavbar";
import Link from "next/link";
import Image from "next/image";
import { useScrollPosition } from "@/hooks/useScrollPosition";
import { UserProfileCard } from "@/components/shared/UserProfileCard";
import { useSession } from "next-auth/react";
import { Menu, X } from "lucide-react";

export function NavbarDesktop() {
  const scrollPosition = useScrollPosition();
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);

  if (status === "loading") return null;

  const rol = session?.user?.rol ?? "";

  const itemsPermitidos = itemsNavbar.filter((item) =>
    item.roles.includes(rol)
  );

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300",
        scrollPosition > 20 ? "bg-black shadow-lg" : "bg-black md:bg-transparent"
      )}
    >
      <div className="h-16 bg-black px-3 md:px-4 lg:px-6">
        <div className="flex h-full items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              onClick={() => setOpen(false)}
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

            <nav className="hidden md:flex ml-4 gap-4 text-white">
              {itemsPermitidos.map((item) => (
                <Link
                  key={item.name}
                  href={item.link}
                  className="transition-all duration-300 hover:text-green-500"
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>

          <div className="hidden md:flex items-center">
            {session?.user && <UserProfileCard />}
          </div>

          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="flex md:hidden items-center justify-center rounded-lg p-2 text-white hover:bg-white/10 transition"
            aria-label="Abrir menú"
          >
            {open ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden bg-black border-t border-white/10 px-4 py-4 shadow-xl">
          <nav className="flex flex-col gap-3 text-white">
            {itemsPermitidos.map((item) => (
              <Link
                key={item.name}
                href={item.link}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-3 text-sm font-medium transition hover:bg-white/10 hover:text-green-500"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {session?.user && (
            <div className="mt-4 border-t border-white/10 pt-4">
              <UserProfileCard />
            </div>
          )}
        </div>
      )}
    </header>
  );
}