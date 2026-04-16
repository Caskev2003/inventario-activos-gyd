"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// shadcn/ui
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

const ROLES = [
  "ADMINISTRADOR",
  "INVENTARIOS",
  "AUXILIAR_INVENTARIOS",
  "CONSULTA",
] as const;

const userEditSchema = z.object({
  nombre: z.string().min(1, "Nombre requerido").max(120, "Máximo 120 caracteres"),
  correo: z.string().email("Correo inválido"),
  telefono: z.string().trim().optional().or(z.literal("")),
  imagen: z.string().trim().optional().or(z.literal("")),
  rol: z.enum(ROLES),
});

type UserEditValues = z.infer<typeof userEditSchema>;

export type Usuario = {
  id: number;
  nombre: string | null;
  correo: string;
  imagen?: string | null;
  rol: (typeof ROLES)[number];
  telefono?: string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  user: Usuario;
  endpoint: string;
  onUpdated?: (u: Usuario) => void;
};

export default function EditarUsuario({
  open,
  onClose,
  user,
  endpoint,
  onUpdated,
}: Props) {
  const [loading, setLoading] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);

  const form = useForm<UserEditValues>({
    resolver: zodResolver(userEditSchema),
    defaultValues: {
      nombre: user.nombre ?? "",
      correo: user.correo ?? "",
      telefono: user.telefono ?? "",
      imagen: user.imagen ?? "",
      rol: user.rol,
    },
    mode: "onChange",
  });

  React.useEffect(() => {
    form.reset({
      nombre: user.nombre ?? "",
      correo: user.correo ?? "",
      telefono: user.telefono ?? "",
      imagen: user.imagen ?? "",
      rol: user.rol,
    });
  }, [user, form]);

  async function onSubmit(values: UserEditValues) {
    try {
      setLoading(true);
      setServerError(null);

      const payload = {
        nombre: values.nombre,
        correo: values.correo,
        telefono: values.telefono || null,
        imagen: values.imagen || null,
        rol: values.rol,
      };

      const res = await fetch(`${endpoint}?id=${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Error actualizando usuario");
      }

      onUpdated?.(data);
      onClose();
    } catch (err: any) {
      setServerError(err?.message || "Error actualizando usuario");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => (!o ? onClose() : null)}>
      <DialogContent className="sm:max-w-lg bg-[#2b2b2b] text-white border border-white/20">
        <DialogHeader>
          <DialogTitle>Editar usuario</DialogTitle>
          <DialogDescription className="text-gray-300">
            Modifica los datos del usuario. La contraseña se cambia desde la opción
            de recuperación en el login.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                className="text-black bg-white"
                placeholder="Nombre completo"
                {...form.register("nombre")}
              />
              {form.formState.errors.nombre && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.nombre.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="correo">Correo</Label>
              <Input
                id="correo"
                type="email"
                className="text-black bg-white"
                placeholder="usuario@dominio.com"
                {...form.register("correo")}
              />
              {form.formState.errors.correo && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.correo.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                className="text-black bg-white"
                placeholder="Ej. 9621234567"
                {...form.register("telefono")}
              />
              {form.formState.errors.telefono && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.telefono.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="imagen">URL imagen</Label>
              <Input
                id="imagen"
                className="text-black bg-white"
                placeholder="https://..."
                {...form.register("imagen")}
              />
              {form.formState.errors.imagen && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.imagen.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label>Rol</Label>
              <Select
                value={form.watch("rol")}
                onValueChange={(value) =>
                  form.setValue("rol", value as UserEditValues["rol"], {
                    shouldValidate: true,
                    shouldDirty: true,
                  })
                }
              >
                <SelectTrigger className="text-black bg-white">
                  <SelectValue placeholder="Selecciona un rol" />
                </SelectTrigger>

                <SelectContent className="text-black bg-white">
                  {ROLES.map((rol) => (
                    <SelectItem key={rol} value={rol}>
                      {rol.replaceAll("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {form.formState.errors.rol && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.rol.message}
                </p>
              )}
            </div>
          </div>

          {serverError && (
            <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
              {serverError}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-10 text-white hover:text-black px-4 py-2 rounded-2xl text-sm sm:text-base font-semibold transition-all duration-200 hover:bg-white"
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              disabled={loading}
              className="h-10 text-white px-4 py-2 rounded-2xl text-sm sm:text-base font-semibold bg-[#426689] transition-all duration-200 hover:bg-gradient-to-b hover:from-green-700 hover:to-green-500"
            >
              {loading ? "Guardando..." : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}