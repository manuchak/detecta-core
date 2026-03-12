import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, CheckCircle2, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ModuleSidebar } from "@/components/lms/ModuleSidebar";
import { ContentRenderer } from "@/components/lms/ContentRenderer";
import { useLMSCursoDetalle, useLMSInscripcion, useLMSInscribirse } from "@/hooks/useLMSCursos";
import { useLMSProgresoContenidos, useLMSMarcarCompletado, useLMSActualizarVideoProgreso } from "@/hooks/useLMSProgreso";
import { useLMSGenerarCertificado } from "@/hooks/useLMSCertificados";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { LMSContenido, VideoContent } from "@/types/lms";

export default function CursoViewer() {
  const { cursoId } = useParams<{ cursoId: string }>();
  const navigate = useNavigate();
  
  const [contenidoActualId, setContenidoActualId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const { data: curso, isLoading: loadingCurso, error: errorCurso } = useLMSCursoDetalle(cursoId);
  const { data: inscripcion, isLoading: loadingInscripcion } = useLMSInscripcion(cursoId);
  const { data: progresos, isLoading: loadingProgresos } = useLMSProgresoContenidos(inscripcion?.id);
  
  const inscribirse = useLMSInscribirse();
  const marcarCompletado = useLMSMarcarCompletado();
  const actualizarVideoProgreso = useLMSActualizarVideoProgreso();
  const generarCertificado = useLMSGenerarCertificado();
  
  const [certificadoGenerado, setCertificadoGenerado] = useState(false);

  // Lista plana de todos los contenidos
  const todosLosContenidos = useMemo(() => {
    if (!curso?.modulos) return [];
    return curso.modulos.flatMap(m => m.contenidos || []);
  }, [curso]);

  // Helper: check if a content item is completed
  const isCompletado = useCallback((contenidoId: string) => {
    return progresos?.some(p => p.contenido_id === contenidoId && p.completado) || false;
  }, [progresos]);

  // Helper: check if a content item is unlocked (sequential locking)
  const isDesbloqueado = useCallback((contenidoId: string) => {
    const idx = todosLosContenidos.findIndex(c => c.id === contenidoId);
    if (idx <= 0) return true; // First item always unlocked

    // Walk backwards to find the nearest previous mandatory content
    for (let i = idx - 1; i >= 0; i--) {
      const prev = todosLosContenidos[i];
      if (prev.es_obligatorio) {
        return isCompletado(prev.id);
      }
    }
    // No previous mandatory content found — unlocked
    return true;
  }, [todosLosContenidos, isCompletado]);

  // Seleccionar primer contenido no completado o el primero
  useEffect(() => {
    if (todosLosContenidos.length > 0 && !contenidoActualId) {
      const primerNoCompletado = todosLosContenidos.find(c => 
        !progresos?.some(p => p.contenido_id === c.id && p.completado)
      );
      setContenidoActualId(primerNoCompletado?.id || todosLosContenidos[0].id);
    }
  }, [todosLosContenidos, progresos, contenidoActualId]);

  // Contenido actual
  const contenidoActual = useMemo(() => 
    todosLosContenidos.find(c => c.id === contenidoActualId),
    [todosLosContenidos, contenidoActualId]
  );

  // Índice actual
  const indiceActual = useMemo(() => 
    todosLosContenidos.findIndex(c => c.id === contenidoActualId),
    [todosLosContenidos, contenidoActualId]
  );

  // Navegación
  const hasPrevious = indiceActual > 0;
  const hasNext = indiceActual < todosLosContenidos.length - 1;

  // Can advance to next? Current mandatory content must be completed
  const canGoNext = useMemo(() => {
    if (!hasNext) return false;
    const nextId = todosLosContenidos[indiceActual + 1]?.id;
    return nextId ? isDesbloqueado(nextId) : false;
  }, [hasNext, todosLosContenidos, indiceActual, isDesbloqueado]);

  const goToPrevious = () => {
    if (hasPrevious) {
      setContenidoActualId(todosLosContenidos[indiceActual - 1].id);
    }
  };

  const goToNext = () => {
    if (canGoNext) {
      setContenidoActualId(todosLosContenidos[indiceActual + 1].id);
    }
  };

  // Safe navigation — only if unlocked
  const handleSelectContenido = useCallback((id: string) => {
    if (isDesbloqueado(id)) {
      setContenidoActualId(id);
    }
  }, [isDesbloqueado]);

  // Calcular progreso general
  const progresoGeneral = useMemo(() => {
    if (!progresos || todosLosContenidos.length === 0) return 0;
    const obligatorios = todosLosContenidos.filter(c => c.es_obligatorio);
    if (obligatorios.length === 0) return 100;
    const completados = obligatorios.filter(c => 
      progresos.some(p => p.contenido_id === c.id && p.completado)
    ).length;
    return Math.round((completados / obligatorios.length) * 100);
  }, [progresos, todosLosContenidos]);

  // Verificar si contenido actual está completado
  const contenidoCompletado = useMemo(() => 
    isCompletado(contenidoActualId || ''),
    [isCompletado, contenidoActualId]
  );

  // Auto-generate certificate when course is completed
  useEffect(() => {
    const generateCertificate = async () => {
      if (
        progresoGeneral === 100 && 
        inscripcion?.id && 
        inscripcion?.estado !== 'completado' &&
        !certificadoGenerado &&
        !generarCertificado.isPending
      ) {
        setCertificadoGenerado(true);
        
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: result } = await supabase.rpc('lms_otorgar_puntos', {
              p_usuario_id: user.id,
              p_accion: 'curso_completado',
              p_referencia_id: cursoId || null,
              p_referencia_tipo: 'curso'
            });
            
            if (result?.puntos_otorgados > 0) {
              toast.success(`¡+${result.puntos_otorgados} puntos por completar el curso!`, {
                description: `Total: ${result.puntos_totales} puntos`
              });
            }
          }
        } catch (err) {
          console.error('Error awarding course completion points:', err);
        }
        
        generarCertificado.mutate(inscripcion.id);
      }
    };
    
    generateCertificate();
  }, [progresoGeneral, inscripcion, certificadoGenerado, generarCertificado.isPending, cursoId]);

  // Handler for non-quiz content completion
  const handleComplete = () => {
    if (contenidoActualId && inscripcion?.id && contenidoActual) {
      // Don't call lms_marcar_contenido_completado for quizzes — 
      // useLMSGuardarQuiz already handles quiz progress directly
      if (contenidoActual.tipo === 'quiz') {
        // Just auto-advance to next content
        if (hasNext && isDesbloqueado(todosLosContenidos[indiceActual + 1]?.id)) {
          setContenidoActualId(todosLosContenidos[indiceActual + 1].id);
        }
        return;
      }

      marcarCompletado.mutate({ 
        contenidoId: contenidoActualId,
        tipoContenido: contenidoActual.tipo as 'video' | 'documento' | 'texto_enriquecido' | 'embed' | 'quiz'
      }, {
        onSuccess: () => {
          // Auto-avanzar al siguiente contenido si está desbloqueado
          if (hasNext) {
            const nextId = todosLosContenidos[indiceActual + 1]?.id;
            if (nextId) {
              // After marking current as complete, next should be unlocked
              setContenidoActualId(nextId);
            }
          }
        }
      });
    }
  };

  const handleVideoProgress = (posicion: number, porcentaje: number) => {
    if (inscripcion?.id && contenidoActualId) {
      actualizarVideoProgreso.mutate({
        inscripcionId: inscripcion.id,
        contenidoId: contenidoActualId,
        posicionSeg: posicion,
        porcentajeVisto: porcentaje
      });
    }
  };

  // Auto-inscribirse si no está inscrito
  useEffect(() => {
    if (!loadingInscripcion && !inscripcion && cursoId && !inscribirse.isPending && !inscribirse.isSuccess) {
      inscribirse.mutate(cursoId);
    }
  }, [loadingInscripcion, inscripcion, cursoId, inscribirse.isPending, inscribirse.isSuccess]);

  if (loadingCurso || loadingInscripcion) {
    return (
      <div className="h-screen flex">
        <div className="w-80 border-r p-4 space-y-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <div className="flex-1 p-8">
          <Skeleton className="h-8 w-1/2 mb-4" />
          <Skeleton className="aspect-video w-full" />
        </div>
      </div>
    );
  }

  if (errorCurso || !curso) {
    return (
      <div className="p-8">
        <Alert variant="destructive">
          <AlertDescription>No se pudo cargar el curso. Por favor, intenta de nuevo.</AlertDescription>
        </Alert>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/lms')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a cursos
        </Button>
      </div>
    );
  }

  // Obtener posición de video y progreso de quiz guardados
  const progresoContenido = progresos?.find(p => p.contenido_id === contenidoActualId);
  const videoPosition = progresoContenido?.video_posicion_seg || 0;
  const progresoQuiz = progresoContenido ? {
    quiz_intentos: progresoContenido.quiz_intentos ?? undefined,
    quiz_mejor_puntaje: progresoContenido.quiz_mejor_puntaje ?? undefined,
    quiz_respuestas: progresoContenido.quiz_respuestas as any
  } : undefined;

  const progresoVideo = progresoContenido ? {
    video_posicion_seg: progresoContenido.video_posicion_seg ?? 0,
    video_porcentaje_visto: progresoContenido.video_porcentaje_visto ?? 0
  } : undefined;

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="h-14 border-b bg-card flex items-center px-4 gap-4 flex-shrink-0">
        <Button variant="ghost" size="sm" onClick={() => navigate('/lms')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-foreground truncate">{curso.titulo}</h1>
        </div>

        {/* Botón menú móvil */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="lg:hidden">
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-80">
            <ModuleSidebar
              modulos={curso.modulos || []}
              progresos={progresos || []}
              contenidoActualId={contenidoActualId || undefined}
              onSelectContenido={(id) => {
                handleSelectContenido(id);
                setSidebarOpen(false);
              }}
              progresoGeneral={progresoGeneral}
              isDesbloqueado={isDesbloqueado}
            />
          </SheetContent>
        </Sheet>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar desktop */}
        <aside className="hidden lg:block w-80 flex-shrink-0 overflow-y-auto">
          <ModuleSidebar
            modulos={curso.modulos || []}
            progresos={progresos || []}
            contenidoActualId={contenidoActualId || undefined}
            onSelectContenido={handleSelectContenido}
            progresoGeneral={progresoGeneral}
            isDesbloqueado={isDesbloqueado}
          />
        </aside>

        {/* Contenido principal */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-6 lg:p-8 space-y-6">
            {contenidoActual ? (
              <>
                {/* Título del contenido */}
                <div className="flex items-center gap-3">
                  {contenidoCompletado && (
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                  )}
                  <h2 className="text-xl font-semibold text-foreground">
                    {contenidoActual.titulo}
                  </h2>
                </div>

                {/* Renderizador de contenido */}
                <ContentRenderer
                  contenido={contenidoActual}
                  inscripcionId={inscripcion?.id}
                  progresoQuiz={progresoQuiz}
                  progresoVideo={progresoVideo}
                  onComplete={handleComplete}
                  onVideoProgress={handleVideoProgress}
                  initialVideoPosition={videoPosition}
                  cursoTitulo={curso.titulo}
                />

                {/* Botón manual de completar — solo para documento (embed y texto_enriquecido ya tienen su propio botón interno) */}
                {!contenidoCompletado && contenidoActual.tipo === 'documento' && (
                  <div className="flex justify-center pt-4">
                    <Button 
                      onClick={handleComplete}
                      disabled={marcarCompletado.isPending}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Marcar como completado
                    </Button>
                  </div>
                )}

                {/* Navegación */}
                <div className="flex justify-between items-center pt-6 border-t">
                  <Button
                    variant="outline"
                    onClick={goToPrevious}
                    disabled={!hasPrevious}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Anterior
                  </Button>

                  <span className="text-sm text-muted-foreground">
                    {indiceActual + 1} de {todosLosContenidos.length}
                  </span>

                  <Button
                    onClick={goToNext}
                    disabled={!canGoNext}
                  >
                    Siguiente
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>

                {/* Mensaje de curso completado */}
                {progresoGeneral === 100 && (
                  <Alert className="border-green-500 bg-green-50 dark:bg-green-950/20">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800 dark:text-green-200">
                      ¡Felicidades! Has completado todos los contenidos obligatorios de este curso.
                    </AlertDescription>
                  </Alert>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No hay contenido disponible</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
