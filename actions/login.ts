"use server";

import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { signIn } from "../auth";

interface LoginData {
  correo: string;
  password: string;
}

export async function login({ correo, password }: LoginData) {
  if (!correo || !password) {
    return { error: "Todos los campos son obligatorios" };
  }

  try {
    const user = await db.usuario.findUnique({
      where: { correo },
    });

    if (!user) {
      return { error: "Usuario no encontrado" };
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return { error: "Contraseña incorrecta" };
    }

    let redirectTo = "/";

    switch (user.rol) {
      case "ADMINISTRADOR":
        redirectTo = "/";
        break;

      case "SUPERVISOR":
      case "CAPTURISTA":
      case "CONSULTA":
        redirectTo = "/gestion_almacen";
        break;

      default:
        return { error: "Rol no autorizado" };
    }

    await signIn("credentials", {
      correo,
      password,
      redirect: false,
    });

    return {
      success: true,
      redirectTo,
    };
  } catch (error) {
    console.error("Error en login:", error);
    return { error: "Error interno del servidor" };
  }
}