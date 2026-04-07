"use client";

import { cn } from "@/lib/utils";
import React from "react";
import { itemsNavbar } from "@/data/itemsNavbar";
import Link from "next/link";
import { useScrollPosition } from "@/hooks/useScrollPosition";

export function NavbarDesktop() {
  const scrollPosition = useScrollPosition();

  return (
    <div
      className={cn(
        "z-30 fixed top-0 left-0 right-0 w-full h-16 transition-all duration-300",
        scrollPosition > 20 ? "bg-black text-white" : "bg-black text-white"
      )}
    >
      <div className="px-[4%] mx-auto h-full flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center shrink-0">
            <img
              src="/iconos/logo-gyd.png"
              alt="Logo G&D"
              className="h-10 w-auto object-contain"
            />
          </Link>

          <div className="flex items-center gap-6">
            {itemsNavbar.map((item) => (
              <Link
                key={item.name}
                href={item.link}
                className="text-white hover:text-green-500 transition-all duration-300"
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}