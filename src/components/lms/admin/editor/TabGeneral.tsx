import { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ImageUploader } from "../wizard/ImageUploader";
import { AIGenerateButton } from "../wizard/AIGenerateButton";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { LMS_CATEGORIAS, LMS_NIVELES } from "@/types/lms";
import { useLMSAI } from "@/hooks/lms/useLMSAI";
import { useState } from "react";
import type { CursoEditorFormData } from "./types";

interface TabGeneralProps {
  form: UseFormReturn<CursoEditorFormData>;
}

export function TabGeneral({ form }: TabGeneralProps) {
  const { generateCourseMetadata, loading: aiLoading } = useLMSAI();
  const [aiSuccess, setAiSuccess] = useState(false);

  const handleAIDescription = async () => {
    const titulo = form.getValues("titulo");
    if (!titulo) return;
    const result = await generateCourseMetadata(titulo);
    if (result) {
      if (result.descripcion) form.setValue("descripcion", result.descripcion);
      if (result.categoria) form.setValue("categoria", result.categoria as any);
      if (result.nivel) form.setValue("nivel", result.nivel as any);
      setAiSuccess(true);
      setTimeout(() => setAiSuccess(false), 3000);
    }
  };

  return (
    <div className="space-y-6 py-4">
      {/* Código + Título */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <FormField
          control={form.control}
          name="codigo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Código *</FormLabel>
              <FormControl><Input placeholder="CURSO-001" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="titulo"
          render={({ field }) => (
            <FormItem className="md:col-span-3">
              <FormLabel>Título *</FormLabel>
              <FormControl><Input placeholder="Nombre del curso" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Descripción con AI */}
      <FormField
        control={form.control}
        name="descripcion"
        render={({ field }) => (
          <FormItem>
            <div className="flex items-center justify-between">
              <FormLabel>Descripción</FormLabel>
              <AIGenerateButton
                onClick={handleAIDescription}
                loading={aiLoading}
                success={aiSuccess}
                disabled={!form.getValues("titulo")}
                tooltip="Generar descripción, categoría y nivel con IA"
              />
            </div>
            <FormControl>
              <Textarea
                placeholder="Describe el contenido y objetivos del curso..."
                className="min-h-[120px]"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Imagen de portada */}
      <FormField
        control={form.control}
        name="imagen_portada_url"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Imagen de portada</FormLabel>
            <FormControl>
              <ImageUploader
                value={field.value || ''}
                onChange={field.onChange}
                courseTitle={form.watch("titulo")}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Categoría + Nivel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="categoria"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoría</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  {LMS_CATEGORIAS.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="nivel"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nivel *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  {LMS_NIVELES.map(n => (
                    <SelectItem key={n.value} value={n.value}>{n.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
