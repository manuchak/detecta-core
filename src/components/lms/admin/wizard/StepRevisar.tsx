import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { CursoPreviewCard } from "./CursoPreviewCard";
import { AISuggestionCard } from "./AISuggestionCard";
import { Eye, EyeOff, Power, Sparkles, Layers } from "lucide-react";
import { useLMSAI } from "@/hooks/lms/useLMSAI";

interface StepRevisarProps {
  form: UseFormReturn<any>;
}

interface ModuloSugerido {
  titulo: string;
  descripcion: string;
  contenidos: { titulo: string; tipo: string; duracion_min: number }[];
}

export function StepRevisar({ form }: StepRevisarProps) {
  const formValues = form.watch();
  const { loading, generateCourseStructure } = useLMSAI();
  const [modulosSugeridos, setModulosSugeridos] = useState<ModuloSugerido[] | null>(null);

  const handleGenerateStructure = async () => {
    const titulo = form.getValues("titulo");
    const duracion = form.getValues("duracion_estimada_min") || 60;
    
    if (!titulo) return;
    
    const result = await generateCourseStructure(titulo, duracion);
    if (result?.modulos) {
      setModulosSugeridos(result.modulos);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sugerencia de Estructura con AI */}
      <div className="apple-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-muted-foreground" />
            <h3 className="apple-text-headline">Estructura sugerida</h3>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleGenerateStructure}
            disabled={loading || !form.getValues("titulo")}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {loading ? "Generando..." : "Sugerir módulos con IA"}
          </Button>
        </div>
        
        {!modulosSugeridos && !loading && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Genera una estructura de módulos basada en el título y duración del curso
          </p>
        )}

        {modulosSugeridos && (
          <AISuggestionCard
            title="Módulos sugeridos"
            onAccept={() => setModulosSugeridos(null)}
            onReject={() => setModulosSugeridos(null)}
            onRegenerate={handleGenerateStructure}
            loading={loading}
          >
            <div className="space-y-3">
              {modulosSugeridos.map((modulo, idx) => (
                <div key={idx} className="p-3 bg-muted/50 rounded-lg">
                  <p className="font-medium text-sm">{idx + 1}. {modulo.titulo}</p>
                  <p className="text-xs text-muted-foreground mt-1">{modulo.descripcion}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {modulo.contenidos.map((c, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 bg-background rounded-full border">
                        {c.titulo} ({c.duracion_min}m)
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              💡 Podrás crear estos módulos después de guardar el curso
            </p>
          </AISuggestionCard>
        )}
      </div>

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
