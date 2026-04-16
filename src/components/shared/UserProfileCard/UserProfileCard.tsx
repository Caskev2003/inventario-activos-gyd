"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { signOut, useSession } from "next-auth/react";
import { User2 } from "lucide-react";

export function UserProfileCard() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="animate-pulse w-8 h-8 rounded-full bg-white/40" />;
  }

  if (!session?.user) {
    return null;
  }

  const imageUrl = session.user.image || "";

  // 🔥 FUNCIÓN CORREGIDA PARA CERRAR SESIÓN
  const handleLogout = async () => {
    try {
      await signOut({ redirect: false }); // Cierra sesión sin redirigir automático
      window.location.href = "/login"; // 🔥 Forzamos la redirección
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button>
          <Avatar className="cursor-pointer border-2 border-white hover:border-blue-500 transition">
            {imageUrl ? (
              <AvatarImage src={imageUrl} alt="avatar" />
            ) : (
              <AvatarFallback>
                <User2 size={20} />
              </AvatarFallback>
            )}
          </Avatar>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-64 bg-[#3a3a3a] text-white border-2 border-white/30 rounded-2xl shadow-xl mt-2 p-5">
        <div className="flex justify-center mb-4">
          <Avatar className="cursor-pointer border-2 border-white hover:border-blue-500 transition w-24 h-24">
            {imageUrl ? (
              <AvatarImage src={imageUrl} alt="avatar" />
            ) : (
              <AvatarFallback>
                <User2 size={20} />
              </AvatarFallback>
            )}
          </Avatar>
        </div>

        <DropdownMenuLabel className="text-center uppercase text-sm font-bold">
          {session.user.name}
        </DropdownMenuLabel>

        <div className="flex items-center text-sm font-normal text-white mb-2">
          <span className="mr-3 text-xs text-gray-300">rol del usuario:</span>
          <span className="text-xs text-white">{session.user.rol}</span>
        </div>

        <div className="flex items-center text-sm font-normal text-white mb-2">
          <span className="mr-3 text-xs text-gray-300">correo:</span>
          <span className="text-xs text-white">{session.user.email}</span>
        </div>

        <DropdownMenuSeparator className="bg-white/30 my-2" />

        <DropdownMenuItem
          className="bg-gradient-to-b from-[#c62828] to-[#9d4245] hover:opacity-90 text-white rounded-2xl text-sm py-2 cursor-pointer transition justify-center text-center w-full"
          onClick={handleLogout}
        >
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}