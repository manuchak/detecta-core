import { UseFormReturn } from "react-hook-form";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, AlertCircle, Image as ImageIcon, Clock } from "lucide-react";
import {
  FormControl, FormDescription, FormField, FormItem, FormLabel,
} from "@/components/ui/form";
import type { CursoEditorFormData } from "./types";
import type { LMSModulo, LMSContenido } from "@/types/lms";

interface TabPublicacionProps {
  form: UseFormReturn<CursoEditorFormData>;
  modulos: (LMSModulo & { contenidos: LMSContenido[] })[];
}

export function TabPublicacion({ form, modulos }: TabPublicacionProps) {
  const values = form.watch();
  const modulosActivos = modulos.filter(m => m.activo);
  const totalContenidos = modulosActivos.reduce((acc, m) => acc + (m.contenidos?.filter(c => c.activo).length || 0), 0);

  // Checklist items
  const checks = [
    { label: "Título definido", ok: !!values.titulo && values.titulo.length >= 3 },
    { label: "Código asignado", ok: !!values.codigo && values.codigo.length >= 2 },
    { label: "Descripción añadida", ok: !!values.descripcion && values.descripcion.length > 10 },
    { label: "Al menos 1 módulo", ok: modulosActivos.length > 0 },
    { label: "Al menos 1 contenido", ok: totalContenidos > 0 },
    { label: "Imagen de portada", ok: !!values.imagen_portada_url },
  ];

  const completedCount = checks.filter(c => c.ok).length;
  const allComplete = completedCount === checks.length;

  return (
    <div className="space-y-6 py-4">
      {/* Preview card */}
      <Card className="overflow-hidden">
        <div className="relative h-32 bg-muted flex items-center justify-center">
          {values.imagen_portada_url ? (
            <img src={values.imagen_portada_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <ImageIcon className="w-8 h-8 text-muted-foreground/40" />
          )}
          <div className="absolute top-2 right-2">
            <Badge variant={values.publicado ? "default" : "secondary"}>
              {values.publicado ? "Publicado" : "Borrador"}
            </Badge>
          </div>
        </div>
        <CardContent className="p-4 space-y-1">
          <p className="font-semibold text-sm">{values.titulo || "Sin título"}</p>
          <p className="text-xs text-muted-foreground line-clamp-2">{values.descripcion || "Sin descripción"}</p>
          <div className="flex items-center gap-3 pt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{values.duracion_estimada_min} min</span>
            <span>{modulosActivos.length} módulos</span>
            <span>{totalContenidos} contenidos</span>
          </div>
        </CardContent>
      </Card>

      {/* Checklist */}
      <div>
        <p className="text-sm font-medium mb-3">
          Checklist de publicación ({completedCount}/{checks.length})
        </p>
        <div className="space-y-2">
          {checks.map((check, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              {check.ok ? (
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
              )}
              <span className={check.ok ? "text-foreground" : "text-muted-foreground"}>{check.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Switches */}
      <div className="space-y-3">
        <FormField
          control={form.control}
          name="activo"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Activo</FormLabel>
                <FormDescription>Los cursos inactivos no aparecen para los usuarios</FormDescription>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="publicado"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Publicado</FormLabel>
                <FormDescription>
                  {allComplete
                    ? "Solo los cursos publicados son visibles para inscripción"
                    : "Completa todos los requisitos antes de publicar"
                  }
                </FormDescription>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
