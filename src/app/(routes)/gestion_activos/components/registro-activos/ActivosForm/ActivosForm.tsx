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
import BarcodePreview from "@/components/barcode/BarcodePreview";

type Sucursal =
  | "TAPACHULA"
  | "CIUDAD_HIDALGO"
  | "TOSCANA"
  | "TUXTLA_GUTIERREZ"
  | "OFICINAS_ADMINISTRATIVAS"
  | "ALMACEN_CIUDAD_HIDALGO"
  | "ALMACEN_TUXTLA_GUTIERREZ";

const SUCURSALES_VALIDAS: Sucursal[] = [
  "TAPACHULA",
  "CIUDAD_HIDALGO",
  "TOSCANA",
  "TUXTLA_GUTIERREZ",
  "OFICINAS_ADMINISTRATIVAS",
  "ALMACEN_CIUDAD_HIDALGO",
  "ALMACEN_TUXTLA_GUTIERREZ",
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
    case "OFICINAS_ADMINISTRATIVAS":
      return "Oficinas Administrativas";
    case "ALMACEN_CIUDAD_HIDALGO":
      return "Almacén Ciudad Hidalgo";
    case "ALMACEN_TUXTLA_GUTIERREZ":
      return "Almacén Tuxtla Gutiérrez";
    default:
      return sucursal;
  }
}

export function ActivosForm() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [archivoImagen, setArchivoImagen] = useState<File | null>(null);
  const [previewImagen, setPreviewImagen] = useState<string | null>(null);
  const [codigoBarras, setCodigoBarras] = useState("");

  const sucursalDesdeUrl = searchParams.get("sucursal");

  const sucursalActual: Sucursal = useMemo(() => {
    return esSucursalValida(sucursalDesdeUrl) ? sucursalDesdeUrl : "TAPACHULA";
  }, [sucursalDesdeUrl]);

  const form = useForm<ActivosFormValues>({
    resolver: zodResolver(activoSchema),
    defaultValues: {
      numeroControl: "",
      descripcionActivo: "",
      tipoEquipo: "EQUIPO_MOBILIARIO",
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

  useEffect(() => {
    return () => {
      if (previewImagen) {
        URL.revokeObjectURL(previewImagen);
      }
    };
  }, [previewImagen]);

  useEffect(() => {
    const subscription = form.watch((values, info) => {
      if (info.name === "numeroControl") {
        setCodigoBarras((values.numeroControl ?? "").toUpperCase());
      }
    });

    return () => subscription.unsubscribe();
  }, [form]);

  const handleSeleccionImagen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;

    if (previewImagen) {
      URL.revokeObjectURL(previewImagen);
    }

    setArchivoImagen(file);

    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setPreviewImagen(previewUrl);
    } else {
      setPreviewImagen(null);
    }
  };

  const subirImagen = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/activos/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.error || "No se pudo subir la imagen");
    }

    return data.fileName as string;
  };
const imprimirEtiqueta = () => {
  const contenido = document.getElementById("area-etiqueta");
  if (!contenido || !codigoBarras.trim()) return;

  const ventana = window.open("", "_blank", "width=400,height=300");
  if (!ventana) return;

  ventana.document.write(`
    <html>
      <head>
        <title>Etiqueta</title>
        <style>
          @page {
            size: 50.8mm 25.4mm;
            margin: 0;
          }

          html, body {
            width: 50.8mm;
            height: 25.4mm;
            margin: 0;
            padding: 0;
            overflow: hidden;
            background: white;
          }

          body {
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .etiqueta {
            width: 50.8mm;
            height: 25.4mm;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
          }
        </style>
      </head>
      <body>
        <div class="etiqueta">
          ${contenido.innerHTML}
        </div>

        <script>
          let yaImprimio = false;

          function imprimirUnaSolaVez() {
            if (yaImprimio) return;
            yaImprimio = true;

            setTimeout(() => {
              window.print();
              setTimeout(() => window.close(), 300);
            }, 300);
          }

          window.addEventListener("load", imprimirUnaSolaVez);
        </script>
      </body>
    </html>
  `);

  ventana.document.close();
};
  const onSubmit = async (values: ActivosFormValues) => {
    try {
      setIsSubmitting(true);

      let imagenActivo: string | null = null;

      if (archivoImagen) {
        imagenActivo = await subirImagen(archivoImagen);
      }

      const payload = {
        ...values,
        numeroControl: values.numeroControl.toUpperCase(),
        sucursal: sucursalActual,
        responsableDirectoId: Number(
          session?.user?.id ?? values.responsableDirectoId
        ),
        imagenActivo,
      };

      await axios.post("/api/activos", payload);

      toast({
        title: "Activo registrado correctamente",
      });

      form.reset({
        numeroControl: "",
        descripcionActivo: "",
        tipoEquipo: "EQUIPO_MOBILIARIO",
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

      if (previewImagen) {
        URL.revokeObjectURL(previewImagen);
      }

      setArchivoImagen(null);
      setPreviewImagen(null);
      setCodigoBarras("");

      router.push(`/gestion_activos?sucursal=${sucursalActual}`);
      router.refresh();
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Error",
        description:
          error?.response?.data?.error ||
          error?.response?.data?.message ||
          error?.message ||
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
        className="grid grid-cols-1 gap-4 md:grid-cols-2"
      >
        <FormField
          control={form.control}
          name="numeroControl"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm text-white">
                Número de control
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                  className="h-9 bg-white text-sm text-black"
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage className="text-xs text-red-400" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="descripcionActivo"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm text-white">Descripción</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ""}
                  className="h-9 bg-white text-sm text-black"
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage className="text-xs text-red-400" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tipoEquipo"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm text-white">Tipo de equipo</FormLabel>
              <FormControl>
                <select
                  {...field}
                  className="h-9 w-full rounded-md border bg-white px-3 text-sm text-black"
                  disabled={isSubmitting}
                >
                  <option value="EQUIPO_MOBILIARIO">Equipo mobiliario</option>
                  <option value="EQUIPO_OFICINA">Equipo de oficina</option>
                  <option value="EQUIPO_REPARTO">Equipo de reparto</option>
                  <option value="EQUIPO_TRANSPORTE">Equipo de transporte</option>
                </select>
              </FormControl>
              <FormMessage className="text-xs text-red-400" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="existencia"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm text-white">Existencia</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  value={field.value ?? ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    field.onChange(value === "" ? undefined : Number(value));
                  }}
                  className="h-9 bg-white text-sm text-black"
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage className="text-xs text-red-400" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="medidas"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm text-white">Medidas</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ""}
                  className="h-9 bg-white text-sm text-black"
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage className="text-xs text-red-400" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="modeloMarca"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm text-white">
                Modelo / Marca
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ""}
                  className="h-9 bg-white text-sm text-black"
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage className="text-xs text-red-400" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="numeroSerie"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm text-white">No. Serie</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ""}
                  className="h-9 bg-white text-sm text-black"
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage className="text-xs text-red-400" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="condicionesActivo"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm text-white">Condiciones</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ""}
                  className="h-9 bg-white text-sm text-black"
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage className="text-xs text-red-400" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="ubicacion"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm text-white">Ubicación</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ""}
                  className="h-9 bg-white text-sm text-black"
                  placeholder="Ej. Oficina 1, Almacén A, Recepción"
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage className="text-xs text-red-400" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="sucursal"
          render={() => (
            <FormItem>
              <FormLabel className="text-sm text-white">Sucursal</FormLabel>
              <FormControl>
                <Input
                  readOnly
                  value={formatearSucursal(sucursalActual)}
                  className="h-9 bg-zinc-300 text-sm text-black"
                />
              </FormControl>
              <FormMessage className="text-xs text-red-400" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm text-white">Status</FormLabel>
              <FormControl>
                <select
                  {...field}
                  className="h-9 w-full rounded-md border bg-white px-3 text-sm text-black"
                  disabled={isSubmitting}
                >
                  <option value="ACTIVO">Activo</option>
                  <option value="INACTIVO">Inactivo</option>
                  <option value="MANTENIMIENTO">Mantenimiento</option>
                  <option value="BAJA">Baja</option>
                </select>
              </FormControl>
              <FormMessage className="text-xs text-red-400" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="responsableDirectoId"
          render={() => (
            <FormItem className="md:col-span-2">
              <FormLabel className="text-sm text-white">
                Responsable directo
              </FormLabel>
              <FormControl>
                <Input
                  readOnly
                  value={`${session?.user?.id ?? ""} - ${session?.user?.name ?? ""}`}
                  className="h-9 bg-zinc-300 text-sm text-black"
                />
              </FormControl>
              <FormMessage className="text-xs text-red-400" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="observaciones"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel className="text-sm text-white">
                Observaciones
              </FormLabel>
              <FormControl>
                <textarea
                  {...field}
                  value={field.value ?? ""}
                  rows={3}
                  className="w-full resize-none rounded-md border bg-white px-3 py-2 text-sm text-black"
                  placeholder="Observaciones adicionales"
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage className="text-xs text-red-400" />
            </FormItem>
          )}
        />

        <div className="rounded-xl border border-gray-600 bg-[#1f1f1f] p-4 md:col-span-2">
          <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-white">
                Código para etiqueta
              </label>
              <Input
                type="text"
                value={codigoBarras}
                onChange={(e) => {
                  const valor = e.target.value.toUpperCase();
                  setCodigoBarras(valor);
                  form.setValue("numeroControl", valor);
                }}
                placeholder="Ej. CDH REF 001-001"
                className="h-9 bg-white text-sm text-black"
                disabled={isSubmitting}
              />

              <p className="mt-2 text-xs text-gray-300">
                La etiqueta se imprimirá en formato 70mm x 30mm.
              </p>

              <div className="mt-4">
                <Button
                  type="button"
                  onClick={imprimirEtiqueta}
                  className="h-9 bg-green-600 px-5 text-sm hover:bg-green-700"
                  disabled={isSubmitting || !codigoBarras.trim()}
                >
                  Imprimir etiqueta
                </Button>
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm text-gray-300">Vista previa de etiqueta:</p>
              <div className="overflow-auto rounded-lg border border-gray-600 bg-white p-3">
                <div id="area-etiqueta">
                  <BarcodePreview value={codigoBarras} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          <FormItem>
            <FormLabel className="text-sm text-white">
              Imagen del activo
            </FormLabel>
            <FormControl>
              <Input
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={handleSeleccionImagen}
                className="h-auto bg-white text-sm text-black file:mr-4 file:rounded-md file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-white hover:file:bg-blue-700"
                disabled={isSubmitting}
              />
            </FormControl>
          </FormItem>

          {previewImagen && (
            <div className="mt-3">
              <p className="mb-2 text-sm text-gray-300">Vista previa:</p>
              <img
                src={previewImagen}
                alt="Vista previa del activo"
                className="h-32 w-32 rounded-lg border border-gray-600 object-cover"
              />
            </div>
          )}
        </div>

        <div className="flex justify-center gap-3 pt-1 md:col-span-2">
          <Button
            type="button"
            onClick={handleSalir}
            className="h-9 bg-gray-500 px-5 text-sm hover:bg-red-600"
            disabled={isSubmitting}
          >
            Cancelar
          </Button>

          <Button
            type="submit"
            className="h-9 bg-[#1e3a5f] px-8 text-sm hover:bg-green-600"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Guardando..." : "Registrar activo"}
          </Button>
        </div>
      </form>
    </Form>
  );
}