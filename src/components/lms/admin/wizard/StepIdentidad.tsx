import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ImageUploader } from "./ImageUploader";
import { AIGenerateButton } from "./AIGenerateButton";
import { AISuggestionCard } from "./AISuggestionCard";
import { useLMSAI } from "@/hooks/lms/useLMSAI";

import { Sparkles } from "lucide-react";
import { AIFullCourseGenerator } from "./AIFullCourseGenerator";
import type { ModuleOutline } from "./StepEstructura";

interface StepIdentidadProps {
  form: UseFormReturn<any>;
  onFullCourseGenerated?: (
    formValues: {
      codigo: string;
      titulo: string;
      descripcion: string;
      categoria: string;
      duracion_estimada_min: number;
      roles_objetivo: string[];
    },
    modulos: ModuleOutline[]
  ) => void;
}

export function StepIdentidad({ form, onFullCourseGenerated }: StepIdentidadProps) {
  const { loading, generateCourseMetadata } = useLMSAI();
  const [suggestion, setSuggestion] = useState<{
    codigo: string;
    descripcion: string;
    categoria: string;
  } | null>(null);

  const handleGenerateMetadata = async () => {
    const titulo = form.getValues("titulo");
    if (!titulo || titulo.length < 3) return;
    
    const result = await generateCourseMetadata(titulo);
    if (result) {
      setSuggestion({
        codigo: result.codigo,
        descripcion: result.descripcion,
        categoria: result.categoria,
      });
    }
  };

  const handleAcceptSuggestion = () => {
    if (suggestion) {
      form.setValue("codigo", suggestion.codigo);
      form.setValue("descripcion", suggestion.descripcion);
      form.setValue("categoria", suggestion.categoria);
      setSuggestion(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Full Course Generator */}
      {onFullCourseGenerated && (
        <AIFullCourseGenerator onComplete={onFullCourseGenerated} />
      )}

      {/* Banner de AI */}
      <div className="flex items-center gap-3 p-4 bg-primary/5 border border-primary/20 rounded-xl">
        <div className="p-2 rounded-lg bg-primary/10">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <p className="font-medium text-sm">Asistente de IA disponible</p>
          <p className="text-xs text-muted-foreground">
            Escribe el título y presiona "Generar con IA" para autocompletar código, descripción y categoría
          </p>
        </div>
      </div>

      <div className="apple-card p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <FormField
            control={form.control}
            name="codigo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Código *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="CURSO-001" 
                    className="font-mono"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="titulo"
            render={({ field }) => (
              <FormItem className="md:col-span-3">
                <FormLabel>Título del curso *</FormLabel>
                <div className="flex gap-2">
                  <FormControl>
                    <Input 
                      placeholder="Ej: Introducción a la Seguridad Vehicular" 
                      {...field} 
                    />
                  </FormControl>
                  <AIGenerateButton
                    onClick={handleGenerateMetadata}
                    loading={loading}
                    disabled={!field.value || field.value.length < 3}
                    tooltip="Generar código, descripción y categoría"
                    size="default"
                  />
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {suggestion && (
          <AISuggestionCard
            title="Sugerencia de IA"
            onAccept={handleAcceptSuggestion}
            onReject={() => setSuggestion(null)}
            onRegenerate={handleGenerateMetadata}
            loading={loading}
          >
            <div className="space-y-2">
              <p><strong>Código:</strong> {suggestion.codigo}</p>
              <p><strong>Descripción:</strong> {suggestion.descripcion}</p>
              <p><strong>Categoría:</strong> {suggestion.categoria}</p>
            </div>
          </AISuggestionCard>
        )}

        <FormField
          control={form.control}
          name="descripcion"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="¿De qué trata este curso? ¿Qué aprenderán los participantes?"
                  className="min-h-[100px] resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="apple-card p-6">
        <FormField
          control={form.control}
          name="imagen_portada_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Imagen de portada</FormLabel>
              <FormControl>
                <ImageUploader
                  value={field.value}
                  onChange={field.onChange}
                  courseTitle={form.watch("titulo")}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}