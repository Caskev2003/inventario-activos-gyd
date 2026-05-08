"use client";

import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

import { Menu } from "lucide-react";
import { itemsNavbar } from "@/data/itemsNavbar";
import Link from "next/link";
import { Logo } from "@/components/shared/Logo";
import { useSession } from "next-auth/react";
import { UserProfileCard } from "@/components/shared/UserProfileCard";

export function NavbarMobile() {
  const { data: session, status } = useSession();

  if (status === "loading") return null;

  const rol = session?.user?.rol ?? "";

  const itemsPermitidos = itemsNavbar.filter((item) =>
    item.roles.includes(rol)
  );

  return (
    <div className="p-4 flex justify-between items-center bg-black text-white shadow-md fixed top-0 left-0 right-0 z-50 md:hidden">
      <p className="text-lg font-bold">DISTRIBUCIÓN G&D</p>

      <Sheet>
        <SheetTrigger asChild>
          <button type="button">
            <Menu className="text-white cursor-pointer" size={26} />
          </button>
        </SheetTrigger>

        <SheetContent side="left" className="bg-neutral-900 text-white z-50">
          <div className="flex flex-col gap-4 ml-4 mt-8">
            {itemsPermitidos.map((item) => (
              <Link
                key={item.name}
                href={item.link}
                className="hover:text-green-500 transition-all duration-300 text-lg"
              >
                {item.name}
              </Link>
            ))}
          </div>

          {session?.user && (
            <div className="mt-8 px-4">
              <UserProfileCard />
            </div>
          )}

          <div className="flex justify-center mt-12">
            <Logo />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}