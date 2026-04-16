"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Activo } from "../tabla-activos/TablaActivos.types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type TipoEquipoActivo =
  | "EQUIPO_MOBILIARIO"
  | "EQUIPO_OFICINA"
  | "EQUIPO_REPARTO"
  | "EQUIPO_TRANSPORTE";

type Sucursal =
  | "TAPACHULA"
  | "CIUDAD_HIDALGO"
  | "TOSCANA"
  | "TUXTLA_GUTIERREZ"
  | "OFICINAS_ADMINISTRATIVAS"
  | "ALMACEN_CIUDAD_HIDALGO"
  | "ALMACEN_TUXTLA_GUTIERREZ";

type EstadoActivo = "ACTIVO" | "INACTIVO" | "MANTENIMIENTO" | "BAJA";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activo: Activo | null;
  onSuccess: () => void;
}

export function ModalEditarActivo({
  open,
  onOpenChange,
  activo,
  onSuccess,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [archivoImagen, setArchivoImagen] = useState<File | null>(null);
  const [previewImagen, setPreviewImagen] = useState<string | null>(null);

  const [formData, setFormData] = useState<{
    id: number;
    numeroControl: string;
    descripcionActivo: string;
    tipoEquipo: TipoEquipoActivo;
    existencia: number;
    medidas: string;
    modeloMarca: string;
    numeroSerie: string;
    condicionesActivo: string;
    observaciones: string;
    imagenActivo: string;
    sucursal: Sucursal;
    ubicacion: string;
    responsableDirectoId: number;
    status: EstadoActivo;
  }>({
    id: 0,
    numeroControl: "",
    descripcionActivo: "",
    tipoEquipo: "EQUIPO_MOBILIARIO",
    existencia: 1,
    medidas: "",
    modeloMarca: "",
    numeroSerie: "",
    condicionesActivo: "",
    observaciones: "",
    imagenActivo: "",
    sucursal: "TAPACHULA",
    ubicacion: "",
    responsableDirectoId: 0,
    status: "ACTIVO",
  });

  useEffect(() => {
    if (activo) {
      setFormData({
        id: activo.id,
        numeroControl: activo.numeroControl ?? "",
        descripcionActivo: activo.descripcionActivo ?? "",
        tipoEquipo: activo.tipoEquipo ?? "EQUIPO_MOBILIARIO",
        existencia: Number(activo.existencia ?? 1),
        medidas: activo.medidas ?? "",
        modeloMarca: activo.modeloMarca ?? "",
        numeroSerie: activo.numeroSerie ?? "",
        condicionesActivo: activo.condicionesActivo ?? "",
        observaciones: activo.observaciones ?? "",
        imagenActivo: activo.imagenActivo ?? "",
        sucursal: activo.sucursal ?? "TAPACHULA",
        ubicacion: activo.ubicacion ?? "",
        responsableDirectoId: Number(activo.responsableDirectoId ?? 0),
        status: activo.status ?? "ACTIVO",
      });

      setArchivoImagen(null);
      setPreviewImagen(null);
    }
  }, [activo]);

  useEffect(() => {
    return () => {
      if (previewImagen) {
        URL.revokeObjectURL(previewImagen);
      }
    };
  }, [previewImagen]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "existencia" || name === "responsableDirectoId"
          ? Number(value)
          : value,
    }));
  };

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
    const formDataUpload = new FormData();
    formDataUpload.append("file", file);

    const res = await fetch("/api/activos/upload", {
      method: "POST",
      body: formDataUpload,
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.error || "No se pudo subir la imagen");
    }

    return data.fileName as string;
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      let imagenActivo = formData.imagenActivo || null;

      if (archivoImagen) {
        imagenActivo = await subirImagen(archivoImagen);
      }

      await axios.put("/api/activos", {
        ...formData,
        numeroControl: formData.numeroControl.toUpperCase(),
        imagenActivo,
      });

      toast({
        title: "Activo actualizado",
        description: "Los cambios se guardaron correctamente.",
      });

      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Error al actualizar",
        description:
          error?.response?.data?.error ||
          error?.response?.data?.message ||
          error?.message ||
          "No se pudo actualizar el activo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!activo) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto border border-white/10 bg-[#353535] text-white">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold">
            Editar activo
          </DialogTitle>
        </DialogHeader>

        <div className="mt-2 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm">Número de control</label>
            <Input
              name="numeroControl"
              value={formData.numeroControl}
              onChange={handleChange}
              className="bg-white text-black"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm">Descripción</label>
            <Input
              name="descripcionActivo"
              value={formData.descripcionActivo}
              onChange={handleChange}
              className="bg-white text-black"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm">Tipo de equipo</label>
            <select
              name="tipoEquipo"
              value={formData.tipoEquipo}
              onChange={handleChange}
              className="h-10 w-full rounded-md border bg-white px-3 text-black"
            >
              <option value="EQUIPO_MOBILIARIO">Equipo mobiliario</option>
              <option value="EQUIPO_OFICINA">Equipo de oficina</option>
              <option value="EQUIPO_REPARTO">Equipo de reparto</option>
              <option value="EQUIPO_TRANSPORTE">Equipo de transporte</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm">Existencia</label>
            <Input
              type="number"
              min={1}
              name="existencia"
              value={formData.existencia}
              onChange={handleChange}
              className="bg-white text-black"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm">Medidas</label>
            <Input
              name="medidas"
              value={formData.medidas}
              onChange={handleChange}
              className="bg-white text-black"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm">Modelo / Marca</label>
            <Input
              name="modeloMarca"
              value={formData.modeloMarca}
              onChange={handleChange}
              className="bg-white text-black"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm">Número de serie</label>
            <Input
              name="numeroSerie"
              value={formData.numeroSerie}
              onChange={handleChange}
              className="bg-white text-black"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm">Condiciones</label>
            <Input
              name="condicionesActivo"
              value={formData.condicionesActivo}
              onChange={handleChange}
              className="bg-white text-black"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm">Ubicación</label>
            <Input
              name="ubicacion"
              value={formData.ubicacion}
              onChange={handleChange}
              className="bg-white text-black"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm">Sucursal</label>
            <select
              name="sucursal"
              value={formData.sucursal}
              onChange={handleChange}
              className="h-10 w-full rounded-md border bg-white px-3 text-black"
            >
              <option value="TAPACHULA">Tapachula</option>
              <option value="CIUDAD_HIDALGO">Ciudad Hidalgo</option>
              <option value="TOSCANA">Toscana</option>
              <option value="TUXTLA_GUTIERREZ">Tuxtla Gutiérrez</option>
              <option value="OFICINAS_ADMINISTRATIVAS">Oficinas Administrativas</option>
              <option value="ALMACEN_CIUDAD_HIDALGO">Almacén Ciudad Hidalgo</option>
              <option value="ALMACEN_TUXTLA_GUTIERREZ">Almacén Tuxtla Gutiérrez</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm">Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="h-10 w-full rounded-md border bg-white px-3 text-black"
            >
              <option value="ACTIVO">Activo</option>
              <option value="INACTIVO">Inactivo</option>
              <option value="MANTENIMIENTO">Mantenimiento</option>
              <option value="BAJA">Baja</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm">Observaciones</label>
            <textarea
              name="observaciones"
              value={formData.observaciones}
              onChange={handleChange}
              rows={4}
              className="w-full resize-none rounded-md border bg-white px-3 py-2 text-black"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm">Imagen del activo</label>
            <Input
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={handleSeleccionImagen}
              className="bg-white text-black file:mr-4 file:rounded-md file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-white hover:file:bg-blue-700"
              disabled={loading}
            />

            <div className="mt-4 flex flex-col gap-6 md:flex-row">
              <div>
                <p className="mb-2 text-sm text-gray-300">Imagen actual:</p>
                {formData.imagenActivo ? (
                  <img
                    src={`/api/activos/imagen/${encodeURIComponent(formData.imagenActivo)}`}
                    alt={formData.descripcionActivo}
                    className="h-36 w-36 rounded-lg border border-gray-600 bg-white object-cover"
                  />
                ) : (
                  <div className="flex h-36 w-36 items-center justify-center rounded-lg border border-dashed border-gray-500 text-sm text-gray-300">
                    Sin imagen
                  </div>
                )}
              </div>

              <div>
                <p className="mb-2 text-sm text-gray-300">Nueva vista previa:</p>
                {previewImagen ? (
                  <img
                    src={previewImagen}
                    alt="Nueva vista previa"
                    className="h-36 w-36 rounded-lg border border-gray-600 bg-white object-cover"
                  />
                ) : (
                  <div className="flex h-36 w-36 items-center justify-center rounded-lg border border-dashed border-gray-500 text-sm text-gray-300">
                    No has seleccionado una nueva imagen
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-center gap-3">
          <Button
            type="button"
            onClick={() => onOpenChange(false)}
            className="bg-gray-500 hover:bg-red-600"
            disabled={loading}
          >
            Cancelar
          </Button>

          <Button
            type="button"
            onClick={handleSubmit}
            className="bg-[#1e3a5f] hover:bg-green-600"
            disabled={loading}
          >
            {loading ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}