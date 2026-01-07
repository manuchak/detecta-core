import { useState, useMemo } from "react";
import { UseFormReturn } from "react-hook-form";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { CursoPreviewCard } from "./CursoPreviewCard";
import { 
  Eye, EyeOff, Power, LayoutGrid, BookOpen, Clock, Layers, 
  Play, FileText, AlignLeft, HelpCircle, Sparkles, 
  AlertCircle, CheckCircle, ExternalLink, Upload, Youtube
} from "lucide-react";
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

const TIPO_COLORS: Record<string, string> = {
  video: "text-red-500",
  documento: "text-blue-500",
  texto_enriquecido: "text-green-500",
  quiz: "text-purple-500",
  interactivo: "text-orange-500",
};

function isContentComplete(contenido: ContentOutline): boolean {
  const c = contenido.contenido;
  if (!c) return false;
  
  switch (contenido.tipo) {
    case 'video':
    case 'documento':
      return !!c.url && c.url.length > 5;
    case 'texto_enriquecido':
      return !!c.html && c.html.length > 20;
    case 'quiz':
      return (c.preguntas_count || 0) > 0;
    case 'interactivo':
      return true;
    default:
      return false;
  }
}

function getProviderIcon(provider?: string) {
  if (provider === 'youtube') return <Youtube className="w-3 h-3 text-red-500" />;
  if (provider === 'storage') return <Upload className="w-3 h-3 text-blue-500" />;
  return <ExternalLink className="w-3 h-3 text-muted-foreground" />;
}

export function StepVistaPrevia({ form, modulos }: StepVistaPreviaProps) {
  const formValues = form.watch();
  const [previewMode, setPreviewMode] = useState<'catalog' | 'student'>('catalog');

  const totalContenidos = modulos.reduce((acc, mod) => acc + mod.contenidos.length, 0);
  const duracionTotal = modulos.reduce((acc, mod) => 
    acc + mod.contenidos.reduce((cAcc, c) => cAcc + c.duracion_min, 0), 0
  );

  const contenidosIncompletos = useMemo(() => {
    return modulos.flatMap(m => 
      m.contenidos.filter(c => !isContentComplete(c))
    );
  }, [modulos]);

  const contenidosCompletos = totalContenidos - contenidosIncompletos.length;

  return (
    <div className="space-y-6">
      {/* Incomplete Content Warning */}
      {contenidosIncompletos.length > 0 && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              {contenidosIncompletos.length} contenido{contenidosIncompletos.length > 1 ? 's' : ''} sin completar
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
              Puedes crear el curso ahora y completar el contenido después desde el editor de curso.
            </p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {contenidosIncompletos.slice(0, 5).map(c => (
                <Badge key={c.id} variant="outline" className="text-amber-700 border-amber-300 text-xs">
                  {c.titulo}
                </Badge>
              ))}
              {contenidosIncompletos.length > 5 && (
                <Badge variant="outline" className="text-amber-700 border-amber-300 text-xs">
                  +{contenidosIncompletos.length - 5} más
                </Badge>
              )}
            </div>
          </div>
        </div>
      )}

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
                    {contenidosCompletos > 0 && (
                      <span className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="w-3.5 h-3.5" />
                        {contenidosCompletos} listos
                      </span>
                    )}
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
                          const colorClass = TIPO_COLORS[contenido.tipo] || "text-muted-foreground";
                          const complete = isContentComplete(contenido);
                          
                          return (
                            <div 
                              key={contenido.id}
                              className={cn(
                                "flex items-center gap-2 p-2 rounded transition-colors",
                                complete ? "hover:bg-muted/50" : "bg-amber-50/50 dark:bg-amber-950/20"
                              )}
                            >
                              <Icon className={cn("w-4 h-4 shrink-0", colorClass)} />
                              <div className="flex-1 min-w-0">
                                <span className="text-sm truncate block">{contenido.titulo}</span>
                                
                                {/* Show content preview for complete items */}
                                {contenido.tipo === 'video' && contenido.contenido?.url && (
                                  <div className="flex items-center gap-1 mt-0.5">
                                    {getProviderIcon(contenido.contenido.provider)}
                                    <span className="text-[10px] text-muted-foreground truncate max-w-[180px]">
                                      {contenido.contenido.url}
                                    </span>
                                  </div>
                                )}
                                
                                {contenido.tipo === 'documento' && contenido.contenido?.url && (
                                  <div className="flex items-center gap-1 mt-0.5">
                                    <ExternalLink className="w-2.5 h-2.5 text-muted-foreground" />
                                    <span className="text-[10px] text-muted-foreground truncate max-w-[180px]">
                                      Documento adjunto
                                    </span>
                                  </div>
                                )}
                                
                                {contenido.tipo === 'texto_enriquecido' && contenido.contenido?.html && (
                                  <span className="text-[10px] text-muted-foreground">
                                    {contenido.contenido.html.length} caracteres
                                  </span>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-2 shrink-0">
                                {!complete && contenido.tipo !== 'interactivo' && (
                                  <Badge variant="outline" className="text-amber-600 border-amber-300 text-[10px] px-1.5 py-0">
                                    Pendiente
                                  </Badge>
                                )}
                                <span className="text-xs text-muted-foreground">{contenido.duracion_min}m</span>
                              </div>
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
