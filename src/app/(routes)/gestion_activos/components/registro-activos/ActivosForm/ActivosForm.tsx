"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { activoSchema, type ActivosFormValues } from "./ActivosForm.form";
import axios from "axios";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

type Sucursal =
  | "TAPACHULA"
  | "CIUDAD_HIDALGO"
  | "TOSCANA"
  | "TUXTLA_GUTIERREZ";

const SUCURSALES_VALIDAS: Sucursal[] = [
  "TAPACHULA",
  "CIUDAD_HIDALGO",
  "TOSCANA",
  "TUXTLA_GUTIERREZ",
];

function esSucursalValida(valor: string | null): valor is Sucursal {
  return !!valor && SUCURSALES_VALIDAS.includes(valor as Sucursal);
}

function formatearSucursal(sucursal: Sucursal) {
  switch (sucursal) {
    case "TAPACHULA":
      return "Tapachula";
    case "CIUDAD_HIDALGO":
      return "Ciudad Hidalgo";
    case "TOSCANA":
      return "Toscana";
    case "TUXTLA_GUTIERREZ":
      return "Tuxtla Gutiérrez";
    default:
      return sucursal;
  }
}

export function ActivosForm() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sucursalDesdeUrl = searchParams.get("sucursal");

  const sucursalActual: Sucursal = useMemo(() => {
    return esSucursalValida(sucursalDesdeUrl) ? sucursalDesdeUrl : "TAPACHULA";
  }, [sucursalDesdeUrl]);

  const form = useForm<ActivosFormValues>({
    resolver: zodResolver(activoSchema),
    defaultValues: {
      numeroControl: "",
      descripcionActivo: "",
      existencia: 1,
      medidas: "",
      modeloMarca: "",
      numeroSerie: "",
      condicionesActivo: "",
      observaciones: "",
      sucursal: sucursalActual,
      ubicacion: "",
      responsableDirectoId: 0,
      status: "ACTIVO",
    },
  });

  useEffect(() => {
    form.setValue("sucursal", sucursalActual);
  }, [sucursalActual, form]);

  useEffect(() => {
    const userId = Number(session?.user?.id);

    if (!isNaN(userId) && userId > 0) {
      form.setValue("responsableDirectoId", userId);
    }
  }, [session?.user?.id, form]);

  const onSubmit = async (values: ActivosFormValues) => {
    try {
      setIsSubmitting(true);

      const payload: ActivosFormValues = {
        ...values,
        sucursal: sucursalActual,
        responsableDirectoId: Number(session?.user?.id ?? values.responsableDirectoId),
      };

      await axios.post("/api/activos", payload);

      toast({
        title: "Activo registrado correctamente",
      });

      form.reset({
        numeroControl: "",
        descripcionActivo: "",
        existencia: 1,
        medidas: "",
        modeloMarca: "",
        numeroSerie: "",
        condicionesActivo: "",
        observaciones: "",
        sucursal: sucursalActual,
        ubicacion: "",
        responsableDirectoId: Number(session?.user?.id ?? 0),
        status: "ACTIVO",
      });

      router.push(`/gestion_activos?sucursal=${sucursalActual}`);
      router.refresh();
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Error",
        description:
          error?.response?.data?.error ||
          error?.response?.data?.message ||
          "No se pudo registrar el activo",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSalir = () => {
    const confirmar = confirm("¿Seguro que deseas salir? Se perderán los cambios");
    if (confirmar) {
      router.push(`/gestion_activos?sucursal=${sucursalActual}`);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <FormField
          control={form.control}
          name="numeroControl"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white text-sm">
                Número de control
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  className="h-9 bg-white text-black text-sm"
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage className="text-red-400 text-xs" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="descripcionActivo"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white text-sm">Descripción</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  className="h-9 bg-white text-black text-sm"
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage className="text-red-400 text-xs" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="existencia"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white text-sm">Existencia</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  value={field.value ?? ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    field.onChange(value === "" ? undefined : Number(value));
                  }}
                  className="h-9 bg-white text-black text-sm"
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage className="text-red-400 text-xs" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="medidas"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white text-sm">Medidas</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  className="h-9 bg-white text-black text-sm"
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage className="text-red-400 text-xs" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="modeloMarca"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white text-sm">
                Modelo / Marca
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  className="h-9 bg-white text-black text-sm"
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage className="text-red-400 text-xs" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="numeroSerie"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white text-sm">No. Serie</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  className="h-9 bg-white text-black text-sm"
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage className="text-red-400 text-xs" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="condicionesActivo"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white text-sm">Condiciones</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  className="h-9 bg-white text-black text-sm"
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage className="text-red-400 text-xs" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="ubicacion"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white text-sm">Ubicación</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  className="h-9 bg-white text-black text-sm"
                  placeholder="Ej. Oficina 1, Almacén A, Recepción"
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage className="text-red-400 text-xs" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="sucursal"
          render={() => (
            <FormItem>
              <FormLabel className="text-white text-sm">Sucursal</FormLabel>
              <FormControl>
                <Input
                  readOnly
                  value={formatearSucursal(sucursalActual)}
                  className="h-9 bg-zinc-300 text-black text-sm"
                />
              </FormControl>
              <FormMessage className="text-red-400 text-xs" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white text-sm">Status</FormLabel>
              <FormControl>
                <select
                  {...field}
                  className="h-9 w-full rounded-md border bg-white px-3 text-black text-sm"
                  disabled={isSubmitting}
                >
                  <option value="ACTIVO">Activo</option>
                  <option value="INACTIVO">Inactivo</option>
                  <option value="MANTENIMIENTO">Mantenimiento</option>
                  <option value="BAJA">Baja</option>
                </select>
              </FormControl>
              <FormMessage className="text-red-400 text-xs" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="responsableDirectoId"
          render={() => (
            <FormItem className="md:col-span-2">
              <FormLabel className="text-white text-sm">
                Responsable directo
              </FormLabel>
              <FormControl>
                <Input
                  readOnly
                  value={`${session?.user?.id ?? ""} - ${session?.user?.name ?? ""}`}
                  className="h-9 bg-zinc-300 text-black text-sm"
                />
              </FormControl>
              <FormMessage className="text-red-400 text-xs" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="observaciones"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel className="text-white text-sm">
                Observaciones
              </FormLabel>
              <FormControl>
                <textarea
                  {...field}
                  rows={3}
                  className="w-full rounded-md border bg-white px-3 py-2 text-sm text-black resize-none"
                  placeholder="Observaciones adicionales"
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage className="text-red-400 text-xs" />
            </FormItem>
          )}
        />

        <div className="md:col-span-2 flex justify-center gap-3 pt-1">
          <Button
            type="button"
            onClick={handleSalir}
            className="h-9 px-5 text-sm bg-gray-500 hover:bg-red-600"
            disabled={isSubmitting}
          >
            Cancelar
          </Button>

          <Button
            type="submit"
            className="h-9 px-8 text-sm bg-[#1e3a5f] hover:bg-green-600"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Guardando..." : "Registrar activo"}
          </Button>
        </div>
      </form>
    </Form>
  );
}