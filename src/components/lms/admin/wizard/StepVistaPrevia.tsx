import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { CursoPreviewCard } from "./CursoPreviewCard";
import { Eye, EyeOff, Power, LayoutGrid, BookOpen, Clock, Layers, Play, FileText, AlignLeft, HelpCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ModuleOutline, ContentOutline } from "./StepEstructura";

interface StepVistaPreviaProps {
  form: UseFormReturn<any>;
  modulos: ModuleOutline[];
}

const TIPO_ICONS: Record<string, any> = {
  video: Play,
  documento: FileText,
  texto_enriquecido: AlignLeft,
  quiz: HelpCircle,
  interactivo: Sparkles,
};

export function StepVistaPrevia({ form, modulos }: StepVistaPreviaProps) {
  const formValues = form.watch();
  const [previewMode, setPreviewMode] = useState<'catalog' | 'student'>('catalog');

  const totalContenidos = modulos.reduce((acc, mod) => acc + mod.contenidos.length, 0);
  const duracionTotal = modulos.reduce((acc, mod) => 
    acc + mod.contenidos.reduce((cAcc, c) => cAcc + c.duracion_min, 0), 0
  );

  return (
    <div className="space-y-6">
      {/* Preview Tabs */}
      <div className="apple-card p-6">
        <Tabs value={previewMode} onValueChange={(v) => setPreviewMode(v as any)}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="apple-text-headline">Vista Previa</h3>
            <TabsList className="h-8">
              <TabsTrigger value="catalog" className="text-xs gap-1.5">
                <LayoutGrid className="w-3.5 h-3.5" />
                Catálogo
              </TabsTrigger>
              <TabsTrigger value="student" className="text-xs gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                Estudiante
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="catalog" className="mt-0">
            <p className="text-sm text-muted-foreground mb-4">
              Así se verá el curso en el catálogo
            </p>
            <CursoPreviewCard data={formValues} />
          </TabsContent>

          <TabsContent value="student" className="mt-0">
            <p className="text-sm text-muted-foreground mb-4">
              Así verán la estructura los estudiantes
            </p>
            
            {modulos.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Layers className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No hay módulos definidos</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                {/* Course Header Preview */}
                <div className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg">
                  <h4 className="font-semibold">{formValues.titulo || "Sin título"}</h4>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {formValues.descripcion || "Sin descripción"}
                  </p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5" />
                      {modulos.length} módulos
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5" />
                      {totalContenidos} contenidos
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {duracionTotal} min
                    </span>
                  </div>
                </div>

                {/* Modules Preview */}
                {modulos.map((modulo, idx) => (
                  <div key={modulo.id} className="border rounded-lg overflow-hidden">
                    <div className="p-3 bg-muted/30 border-b">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">
                          {idx + 1}. {modulo.titulo}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {modulo.contenidos.length} items
                        </span>
                      </div>
                    </div>
                    <div className="p-2 space-y-1">
                      {modulo.contenidos.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-2">
                          Sin contenidos
                        </p>
                      ) : (
                        modulo.contenidos.map((contenido) => {
                          const Icon = TIPO_ICONS[contenido.tipo] || AlignLeft;
                          return (
                            <div 
                              key={contenido.id}
                              className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 transition-colors"
                            >
                              <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                              <span className="text-sm flex-1 truncate">{contenido.titulo}</span>
                              <span className="text-xs text-muted-foreground">{contenido.duracion_min}m</span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Publication Status */}
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
