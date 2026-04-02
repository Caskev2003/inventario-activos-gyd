"use client"
import { cn } from "@/lib/utils"
import React from "react"
import { itemsNavbar } from "@/data/itemsNavbar"
import Link from "next/link"
import { useScrollPosition } from "@/hooks/useScrollPosition"
import { UserProfileCard } from "@/components/shared/UserProfileCard"
import Image from "next/image"

export function NavbarDesktop() {
  const scrollPosition = useScrollPosition()

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 z-30 h-16 w-full transition-all duration-300",
        scrollPosition > 20 ? "bg-black" : "bg-transparent"
      )}
    >
      <div className="h-full bg-black px-2 md:px-4 lg:px-6 overflow-hidden">
        <div className="flex h-full items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex h-14 w-[90px] items-center justify-center overflow-hidden"
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
                  className="transition-all duration-300 hover:text-green-700"
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          <UserProfileCard />
        </div>
      </div>
    </div>
  )
}