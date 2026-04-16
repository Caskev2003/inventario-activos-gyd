"use client";

import { cn } from "@/lib/utils";
import React from "react";
import { itemsNavbar } from "@/data/itemsNavbar";
import Link from "next/link";
import Image from "next/image";
import { useScrollPosition } from "@/hooks/useScrollPosition";
import { UserProfileCard } from "@/components/shared/UserProfileCard"
import { useSession } from "next-auth/react";

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

            <div className="ml-4 flex gap-4 text-white">
              {itemsPermitidos.map((item) => (
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
            <div className="flex items-center">
              <UserProfileCard />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}