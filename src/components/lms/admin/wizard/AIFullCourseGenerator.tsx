import { useState, useCallback, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles, Wand2, Loader2, CheckCircle2, AlertCircle, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { ModuleOutline, ContentOutline } from "../wizard/StepEstructura";

const ROLES_DISPONIBLES = [
  { value: "custodio", label: "Custodio" },
  { value: "monitorista", label: "Monitorista" },
  { value: "coordinador", label: "Coordinador" },
  { value: "administrativo", label: "Administrativo" },
  { value: "instalador", label: "Instalador" },
  { value: "general", label: "General / Todos" },
];

interface ProgressState {
  step: number;
  totalSteps: number;
  label: string;
  percent: number;
}

interface AIFullCourseGeneratorProps {
  onComplete: (
    formValues: {
      codigo: string;
      titulo: string;
      descripcion: string;
      categoria: string;
      duracion_estimada_min: number;
      roles_objetivo: string[];
      enfoque_instruccional?: string;
    },
    modulos: ModuleOutline[]
  ) => void;
}

type AIAction =
  | "generate_course_metadata"
  | "generate_course_structure"
  | "generate_rich_text"
  | "generate_quiz_questions"
  | "generate_flashcards";

async function invokeAI<T>(action: AIAction, data: Record<string, unknown>, timeout = 45000): Promise<T | null> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error("timeout")), timeout);
  });

  try {
    const responsePromise = supabase.functions.invoke("lms-ai-assistant", {
      body: { action, data },
    });

    const { data: response, error } = await Promise.race([
      responsePromise,
      timeoutPromise,
    ]) as { data: any; error: any };

    if (error) {
      console.error(`[FullCourse] ${action} error:`, error);
      return null;
    }
    if (response?.error) {
      console.error(`[FullCourse] ${action} API error:`, response.error);
      return null;
    }
    return response?.data as T;
  } catch (err: any) {
    if (err?.message === "timeout") {
      console.warn(`[FullCourse] ${action} timed out`);
    } else {
      console.error(`[FullCourse] ${action} exception:`, err);
    }
    return null;
  }
}

function mapTipoContenido(tipo: string): ContentOutline["tipo"] {
  const map: Record<string, ContentOutline["tipo"]> = {
    video: "video",
    documento: "documento",
    texto: "texto_enriquecido",
    texto_enriquecido: "texto_enriquecido",
    quiz: "quiz",
    evaluacion: "quiz",
    interactivo: "interactivo",
    flashcards: "interactivo",
  };
  return map[tipo.toLowerCase()] || "texto_enriquecido";
}

export function AIFullCourseGenerator({ onComplete }: AIFullCourseGeneratorProps) {
  const [tema, setTema] = useState("");
  const [enfoque, setEnfoque] = useState("");
  const [rol, setRol] = useState("custodio");
  const [duracion, setDuracion] = useState(60);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<ProgressState | null>(null);
  const [error, setError] = useState<string | null>(null);

  const updateProgress = (step: number, totalSteps: number, label: string) => {
    setProgress({
      step,
      totalSteps,
      label,
      percent: Math.round((step / totalSteps) * 100),
    });
  };

  const handleGenerate = useCallback(async () => {
    if (!tema || tema.length < 5) {
      toast.error("Escribe un tema con al menos 5 caracteres");
      return;
    }

    setLoading(true);
    setError(null);
    cancelledRef.current = false;
    setProgress({ step: 0, totalSteps: 1, label: "Iniciando...", percent: 0 });

    try {
      // Step 1: Metadata
      updateProgress(1, 5, "Generando metadata del curso...");
      const metadata = await invokeAI<{
        codigo: string;
        descripcion: string;
        categoria: string;
        nivel: string;
      }>("generate_course_metadata", { titulo: tema });

      if (!metadata) {
        setError("No se pudo generar la metadata. Intenta con otro tema.");
        setLoading(false);
        return;
      }

      // Step 2: Structure
      updateProgress(2, 5, "Generando estructura de módulos...");
      const structure = await invokeAI<{
        modulos: {
          titulo: string;
          descripcion: string;
          contenidos: { titulo: string; tipo: string; duracion_min: number }[];
        }[];
      }>("generate_course_structure", { tema, duracion_min: duracion, enfoque: enfoque || undefined });

      if (!structure?.modulos?.length) {
        setError("No se pudo generar la estructura. Intenta de nuevo.");
        setLoading(false);
        return;
      }

      // Build module outlines
      const modulos: ModuleOutline[] = structure.modulos.map((m, idx) => ({
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

      // Collect content tasks
      const textContents: { moduleIdx: number; contentIdx: number; titulo: string; moduloTitulo: string }[] = [];
      const quizContents: { moduleIdx: number; contentIdx: number; titulo: string; moduloTitulo: string }[] = [];
      const flashcardContents: { moduleIdx: number; contentIdx: number; titulo: string; moduloTitulo: string }[] = [];

      modulos.forEach((mod, mIdx) => {
        mod.contenidos.forEach((c, cIdx) => {
          if (c.tipo === "texto_enriquecido") {
            textContents.push({ moduleIdx: mIdx, contentIdx: cIdx, titulo: c.titulo, moduloTitulo: mod.titulo });
          } else if (c.tipo === "quiz") {
            quizContents.push({ moduleIdx: mIdx, contentIdx: cIdx, titulo: c.titulo, moduloTitulo: mod.titulo });
          } else if (c.tipo === "interactivo") {
            flashcardContents.push({ moduleIdx: mIdx, contentIdx: cIdx, titulo: c.titulo, moduloTitulo: mod.titulo });
          }
        });
      });

      const totalContentTasks = textContents.length + quizContents.length + flashcardContents.length;
      const totalSteps = 2 + totalContentTasks + 1; // metadata + structure + contents + done
      let currentStep = 2;

      // Step 3+: Generate text content
      for (const item of textContents) {
        if (cancelledRef.current) return;
        currentStep++;
        updateProgress(currentStep, totalSteps, `Generando texto: ${item.titulo.substring(0, 40)}...`);
        try {
          const result = await invokeAI<{ html: string }>("generate_rich_text", {
            tema: item.titulo,
            contexto: `Módulo: ${item.moduloTitulo}. Curso: ${tema}. Rol objetivo: ${rol}${enfoque ? `. Enfoque instruccional: ${enfoque}` : ''}`,
            longitud: "media",
          });
          if (result?.html) {
            modulos[item.moduleIdx].contenidos[item.contentIdx].contenido = {
              ...modulos[item.moduleIdx].contenidos[item.contentIdx].contenido,
              html: result.html,
            };
          }
        } catch {
          // Continue on partial failure
        }
      }

      // Generate quiz questions
      for (const item of quizContents) {
        if (cancelledRef.current) return;
        currentStep++;
        updateProgress(currentStep, totalSteps, `Generando quiz: ${item.moduloTitulo.substring(0, 40)}...`);
        try {
          const result = await invokeAI<{
            questions: {
              question: string;
              type: "single" | "multiple";
              options: { id: string; text: string; isCorrect: boolean }[];
              explanation: string;
            }[];
          }>("generate_quiz_questions", {
            tema: item.moduloTitulo,
            cantidad: 5,
            contexto: `Curso: ${tema}. Contenido: ${item.titulo}. Rol: ${rol}${enfoque ? `. Enfoque instruccional: ${enfoque}` : ''}`,
          });
          if (result?.questions) {
            modulos[item.moduleIdx].contenidos[item.contentIdx].contenido = {
              ...modulos[item.moduleIdx].contenidos[item.contentIdx].contenido,
              preguntas: result.questions.map((q) => ({
                id: crypto.randomUUID(),
                question: q.question,
                type: q.type,
                options: q.options,
                explanation: q.explanation,
              })),
            };
          }
        } catch {
          // Continue
        }
      }

      // Generate flashcards
      for (const item of flashcardContents) {
        if (cancelledRef.current) return;
        currentStep++;
        updateProgress(currentStep, totalSteps, `Generando flashcards: ${item.moduloTitulo.substring(0, 40)}...`);
        try {
          const result = await invokeAI<{
            cards: { front: string; back: string }[];
          }>("generate_flashcards", {
            tema: item.moduloTitulo,
            cantidad: 6,
            contexto: `Curso: ${tema}. Contenido: ${item.titulo}. Rol: ${rol}${enfoque ? `. Enfoque instruccional: ${enfoque}` : ''}`,
          });
          if (result?.cards) {
            modulos[item.moduleIdx].contenidos[item.contentIdx].contenido = {
              ...modulos[item.moduleIdx].contenidos[item.contentIdx].contenido,
              flashcards: result.cards.map((c) => ({
                id: crypto.randomUUID(),
                front: c.front,
                back: c.back,
              })),
            };
          }
        } catch {
          // Continue
        }
      }

      // Done!
      updateProgress(totalSteps, totalSteps, "¡Curso generado!");

      const totalDuracion = modulos.reduce(
        (acc, mod) => acc + mod.contenidos.reduce((cAcc, c) => cAcc + c.duracion_min, 0),
        0
      );

      onComplete(
        {
          codigo: metadata.codigo,
          titulo: tema,
          descripcion: metadata.descripcion,
          categoria: metadata.categoria,
          duracion_estimada_min: totalDuracion || duracion,
          roles_objetivo: [rol],
          enfoque_instruccional: enfoque || undefined,
        },
        modulos
      );

      toast.success(`Curso generado: ${modulos.length} módulos, ${totalContentTasks} contenidos`);
    } catch (err) {
      console.error("[FullCourse] Fatal error:", err);
      setError("Error inesperado al generar el curso. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }, [tema, enfoque, rol, duracion, onComplete]);

  const cancelledRef = useRef(false);

  const handleCancel = () => {
    cancelledRef.current = true;
    setLoading(false);
    setProgress(null);
    setError(null);
  };

  return (
    <div className="relative overflow-hidden rounded-xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 via-background to-primary/5">
      {/* Header */}
      <div className="flex items-center gap-3 p-5 pb-0">
        <div className="p-2.5 rounded-xl bg-primary/10">
          <Wand2 className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-base">Curso Completo con IA</h3>
          <p className="text-xs text-muted-foreground">
            Genera metadata, módulos, contenido de texto, quizzes y flashcards en un solo click
          </p>
        </div>
      </div>

      {/* Form or Progress */}
      <div className="p-5 space-y-4">
        {!loading && !progress?.percent ? (
          <>
            {/* Topic Input */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Tema del curso *</label>
              <Input
                value={tema}
                onChange={(e) => setTema(e.target.value)}
                placeholder="Ej: Protocolos de seguridad en custodia de valores"
                className="bg-background"
              />
            </div>

            {/* Enfoque Instruccional */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Enfoque instruccional <span className="text-muted-foreground font-normal">(opcional)</span>
              </label>
              <textarea
                value={enfoque}
                onChange={(e) => setEnfoque(e.target.value)}
                placeholder="Describe cómo quieres que se enseñe: metodología, tono, nivel de profundidad, tipo de ejemplos... Ej: Basado en casos reales. Tono directo, sin tecnicismos. Priorizar ejercicios prácticos."
                className="flex min-h-[72px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                rows={2}
              />
              <p className="text-xs text-muted-foreground">
                Esta instrucción guiará todo el contenido generado: textos, quizzes, flashcards y guiones de video
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Role Select */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Rol objetivo</label>
                <Select value={rol} onValueChange={setRol}>
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES_DISPONIBLES.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Duration Slider */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  Duración estimada: <span className="text-primary">{duracion} min</span>
                </label>
                <Slider
                  value={[duracion]}
                  onValueChange={([v]) => setDuracion(v)}
                  min={30}
                  max={180}
                  step={15}
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  ~{Math.max(2, Math.round(duracion / 30))} módulos, ~{Math.max(4, Math.round(duracion / 8))} contenidos
                </p>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-lg">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <Button
              onClick={handleGenerate}
              disabled={!tema || tema.length < 5}
              className="w-full gap-2"
              size="lg"
            >
              <Sparkles className="w-4 h-4" />
              Generar Curso Completo
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              La generación puede tomar 1-3 minutos dependiendo de la complejidad
            </p>
          </>
        ) : (
          /* Progress View */
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  )}
                  <span className="font-medium">{progress?.label}</span>
                </span>
                <span className="text-muted-foreground text-xs">
                  {progress?.step}/{progress?.totalSteps}
                </span>
              </div>
              <Progress value={progress?.percent || 0} className="h-2" />
            </div>

            {loading && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                className="w-full gap-2 text-muted-foreground"
              >
                <X className="w-3 h-3" />
                Cancelar
              </Button>
            )}

            {error && (
              <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-lg">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
