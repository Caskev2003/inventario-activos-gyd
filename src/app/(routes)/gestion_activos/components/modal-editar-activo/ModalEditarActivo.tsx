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

  const [formData, setFormData] = useState({
    id: 0,
    numeroControl: "",
    descripcionActivo: "",
    existencia: 1,
    medidas: "",
    modeloMarca: "",
    numeroSerie: "",
    condicionesActivo: "",
    observaciones: "",
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
        existencia: Number(activo.existencia ?? 1),
        medidas: activo.medidas ?? "",
        modeloMarca: activo.modeloMarca ?? "",
        numeroSerie: activo.numeroSerie ?? "",
        condicionesActivo: activo.condicionesActivo ?? "",
        observaciones: activo.observaciones ?? "",
        sucursal: activo.sucursal ?? "TAPACHULA",
        ubicacion: activo.ubicacion ?? "",
        responsableDirectoId: Number(activo.responsableDirectoId ?? 0),
        status: activo.status ?? "ACTIVO",
      });
    }
  }, [activo]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: name === "existencia" || name === "responsableDirectoId"
        ? Number(value)
        : value,
    }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      await axios.put("/api/activos", formData);

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
      <DialogContent className="max-w-4xl bg-[#353535] border border-white/10 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">
            Editar activo
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          <div>
            <label className="text-sm mb-1 block">Número de control</label>
            <Input
              name="numeroControl"
              value={formData.numeroControl}
              onChange={handleChange}
              className="bg-white text-black"
            />
          </div>

          <div>
            <label className="text-sm mb-1 block">Descripción</label>
            <Input
              name="descripcionActivo"
              value={formData.descripcionActivo}
              onChange={handleChange}
              className="bg-white text-black"
            />
          </div>

          <div>
            <label className="text-sm mb-1 block">Existencia</label>
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
            <label className="text-sm mb-1 block">Medidas</label>
            <Input
              name="medidas"
              value={formData.medidas}
              onChange={handleChange}
              className="bg-white text-black"
            />
          </div>

          <div>
            <label className="text-sm mb-1 block">Modelo / Marca</label>
            <Input
              name="modeloMarca"
              value={formData.modeloMarca}
              onChange={handleChange}
              className="bg-white text-black"
            />
          </div>

          <div>
            <label className="text-sm mb-1 block">Número de serie</label>
            <Input
              name="numeroSerie"
              value={formData.numeroSerie}
              onChange={handleChange}
              className="bg-white text-black"
            />
          </div>

          <div>
            <label className="text-sm mb-1 block">Condiciones</label>
            <Input
              name="condicionesActivo"
              value={formData.condicionesActivo}
              onChange={handleChange}
              className="bg-white text-black"
            />
          </div>

          <div>
            <label className="text-sm mb-1 block">Ubicación</label>
            <Input
              name="ubicacion"
              value={formData.ubicacion}
              onChange={handleChange}
              className="bg-white text-black"
            />
          </div>

          <div>
            <label className="text-sm mb-1 block">Sucursal</label>
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
            </select>
          </div>

          <div>
            <label className="text-sm mb-1 block">Status</label>
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
            <label className="text-sm mb-1 block">Observaciones</label>
            <textarea
              name="observaciones"
              value={formData.observaciones}
              onChange={handleChange}
              rows={4}
              className="w-full rounded-md border bg-white px-3 py-2 text-black resize-none"
            />
          </div>
        </div>

        <div className="flex justify-center gap-3 mt-4">
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