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

interface StepIdentidadProps {
  form: UseFormReturn<any>;
}

export function StepIdentidad({ form }: StepIdentidadProps) {
  return (
    <div className="space-y-6">
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
                <FormControl>
                  <Input 
                    placeholder="Ej: Introducción a la Seguridad Vehicular" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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
