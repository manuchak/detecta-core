import { UseFormReturn } from "react-hook-form";
import { Switch } from "@/components/ui/switch";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { CursoPreviewCard } from "./CursoPreviewCard";
import { Eye, EyeOff, Power } from "lucide-react";

interface StepRevisarProps {
  form: UseFormReturn<any>;
}

export function StepRevisar({ form }: StepRevisarProps) {
  const formValues = form.watch();

  return (
    <div className="space-y-6">
      <div className="apple-card p-6">
        <h3 className="apple-text-headline mb-4">Vista previa</h3>
        <p className="text-sm text-muted-foreground mb-5">
          Así se verá el curso en el catálogo
        </p>
        <CursoPreviewCard data={formValues} />
      </div>

      <div className="apple-card p-6 space-y-5">
        <h3 className="apple-text-headline">Estado de publicación</h3>
        
        <FormField
          control={form.control}
          name="activo"
          render={({ field }) => (
            <FormItem className="flex items-start justify-between gap-4 p-4 rounded-lg border bg-card">
              <div className="space-y-1">
                <FormLabel className="text-base flex items-center gap-2">
                  <Power className="w-4 h-4" />
                  Activo
                </FormLabel>
                <FormDescription>
                  Los cursos inactivos no aparecen en ningún listado
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="publicado"
          render={({ field }) => (
            <FormItem className="flex items-start justify-between gap-4 p-4 rounded-lg border bg-card">
              <div className="space-y-1">
                <FormLabel className="text-base flex items-center gap-2">
                  {field.value ? (
                    <Eye className="w-4 h-4 text-green-600" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-muted-foreground" />
                  )}
                  Publicado
                </FormLabel>
                <FormDescription>
                  Solo los cursos publicados están disponibles para inscripción.
                  {form.watch('es_obligatorio') && (
                    <span className="block mt-1 text-orange-600 font-medium">
                      Al publicar, los usuarios con roles objetivo serán inscritos automáticamente.
                    </span>
                  )}
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
