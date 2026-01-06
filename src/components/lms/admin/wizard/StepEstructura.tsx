import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { CourseOutlineBuilder } from "./CourseOutlineBuilder";
import { useLMSAI } from "@/hooks/lms/useLMSAI";
import { Sparkles, Layers, Clock, BookOpen } from "lucide-react";
import { toast } from "sonner";

export interface ModuleOutline {
  id: string;
  titulo: string;
  descripcion?: string;
  orden: number;
  contenidos: ContentOutline[];
}

export interface ContentOutline {
  id: string;
  titulo: string;
  tipo: 'video' | 'documento' | 'texto_enriquecido' | 'quiz' | 'interactivo';
  duracion_min: number;
  orden: number;
  contenido?: any;
}

interface StepEstructuraProps {
  form: UseFormReturn<any>;
  modulos: ModuleOutline[];
  onModulosChange: (modulos: ModuleOutline[]) => void;
}

export function StepEstructura({ form, modulos, onModulosChange }: StepEstructuraProps) {
  const { loading, generateCourseStructure } = useLMSAI();
  const [hasGeneratedOnce, setHasGeneratedOnce] = useState(false);

  const titulo = form.watch("titulo");
  const duracionEstimada = form.watch("duracion_estimada_min") || 60;

  // Calculate total duration from content
  const duracionTotal = modulos.reduce((acc, mod) => 
    acc + mod.contenidos.reduce((cAcc, c) => cAcc + c.duracion_min, 0), 0
  );

  const totalContenidos = modulos.reduce((acc, mod) => acc + mod.contenidos.length, 0);

  const handleGenerateWithAI = async () => {
    if (!titulo || titulo.length < 3) {
      toast.error("Ingresa un título para generar la estructura");
      return;
    }

    const result = await generateCourseStructure(titulo, duracionEstimada);
    if (result?.modulos) {
      // Convert AI result to our format and apply directly
      const nuevosModulos: ModuleOutline[] = result.modulos.map((m, idx) => ({
        id: crypto.randomUUID(),
        titulo: m.titulo,
        descripcion: m.descripcion,
        orden: idx + 1,
        contenidos: m.contenidos.map((c, cIdx) => ({
          id: crypto.randomUUID(),
          titulo: c.titulo,
          tipo: mapTipoContenido(c.tipo),
          duracion_min: c.duracion_min,
          orden: cIdx + 1,
        })),
      }));
      
      onModulosChange(nuevosModulos);
      setHasGeneratedOnce(true);
      toast.success(`Estructura generada: ${nuevosModulos.length} módulos`);
    }
  };

  return (
    <div className="space-y-6">
      {/* AI Generation Banner */}
      <div className="flex items-center justify-between p-4 bg-primary/5 border border-primary/20 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium text-sm">Constructor de Estructura</p>
            <p className="text-xs text-muted-foreground">
              {modulos.length === 0 
                ? "Genera una estructura con IA o crea módulos manualmente" 
                : "Arrastra para reordenar, edita inline o agrega más contenido"}
            </p>
          </div>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleGenerateWithAI}
          disabled={loading || !titulo || titulo.length < 3}
          className="gap-2"
        >
          <Sparkles className="w-4 h-4" />
          {loading ? "Generando..." : hasGeneratedOnce ? "Regenerar" : "Generar con IA"}
        </Button>
      </div>

      {/* Stats Bar */}
      {modulos.length > 0 && (
        <div className="flex items-center gap-4 px-4 py-2 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-1.5 text-sm">
            <Layers className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">{modulos.length}</span>
            <span className="text-muted-foreground">módulos</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <BookOpen className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">{totalContenidos}</span>
            <span className="text-muted-foreground">contenidos</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">{duracionTotal}</span>
            <span className="text-muted-foreground">min</span>
          </div>
        </div>
      )}

      {/* Course Outline Builder */}
      <CourseOutlineBuilder
        modulos={modulos}
        onChange={onModulosChange}
        cursoTitulo={titulo}
      />

      {/* Empty State */}
      {modulos.length === 0 && !loading && (
        <div className="text-center py-8 px-4 border-2 border-dashed border-muted-foreground/20 rounded-xl">
          <Layers className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-4">
            Tu curso aún no tiene estructura. Genera una con IA o crea tu primer módulo.
          </p>
          <div className="flex gap-2 justify-center">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleGenerateWithAI}
              disabled={loading || !titulo}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Generar con IA
            </Button>
            <Button 
              variant="secondary" 
              size="sm"
              onClick={() => {
                onModulosChange([{
                  id: crypto.randomUUID(),
                  titulo: "Nuevo Módulo",
                  orden: 1,
                  contenidos: [],
                }]);
              }}
            >
              + Agregar módulo
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper to map AI tipo to our content type
function mapTipoContenido(tipo: string): ContentOutline['tipo'] {
  const map: Record<string, ContentOutline['tipo']> = {
    'video': 'video',
    'documento': 'documento',
    'texto': 'texto_enriquecido',
    'texto_enriquecido': 'texto_enriquecido',
    'quiz': 'quiz',
    'evaluacion': 'quiz',
    'interactivo': 'interactivo',
    'flashcards': 'interactivo',
  };
  return map[tipo.toLowerCase()] || 'texto_enriquecido';
}
