import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Menu, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ModuleSidebar } from "@/components/lms/ModuleSidebar";
import { ContentRenderer } from "@/components/lms/ContentRenderer";
import { useLMSAdminCursoDetalle } from "@/hooks/lms/useLMSAdminCursos";

export default function LMSAdminCursoPreview() {
  const { cursoId } = useParams<{ cursoId: string }>();
  const navigate = useNavigate();

  const [contenidoActualId, setContenidoActualId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: curso, isLoading, error } = useLMSAdminCursoDetalle(cursoId);

  // Lista plana de todos los contenidos
  const todosLosContenidos = useMemo(() => {
    if (!curso?.modulos) return [];
    return curso.modulos.flatMap((m: any) => m.contenidos || []);
  }, [curso]);

  // Seleccionar primer contenido al cargar
  const contenidoActualIdResuelto = contenidoActualId || todosLosContenidos[0]?.id || null;

  const contenidoActual = useMemo(
    () => todosLosContenidos.find((c: any) => c.id === contenidoActualIdResuelto),
    [todosLosContenidos, contenidoActualIdResuelto]
  );

  const indiceActual = useMemo(
    () => todosLosContenidos.findIndex((c: any) => c.id === contenidoActualIdResuelto),
    [todosLosContenidos, contenidoActualIdResuelto]
  );

  const hasPrevious = indiceActual > 0;
  const hasNext = indiceActual < todosLosContenidos.length - 1;

  const goToPrevious = () => {
    if (hasPrevious) setContenidoActualId(todosLosContenidos[indiceActual - 1].id);
  };
  const goToNext = () => {
    if (hasNext) setContenidoActualId(todosLosContenidos[indiceActual + 1].id);
  };

  if (isLoading) {
    return (
      <div className="h-screen flex">
        <div className="w-80 border-r p-4 space-y-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-32 w-full" />
        </div>
        <div className="flex-1 p-8">
          <Skeleton className="h-8 w-1/2 mb-4" />
          <Skeleton className="aspect-video w-full" />
        </div>
      </div>
    );
  }

  if (error || !curso) {
    return (
      <div className="p-8">
        <Alert variant="destructive">
          <AlertDescription>No se pudo cargar el curso.</AlertDescription>
        </Alert>
        <Button variant="outline" className="mt-4" onClick={() => navigate(`/lms/admin`)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al admin
        </Button>
      </div>
    );
  }

  const sidebarContent = (
    <ModuleSidebar
      modulos={curso.modulos || []}
      progresos={[]}
      contenidoActualId={contenidoActualIdResuelto || undefined}
      onSelectContenido={(id) => {
        setContenidoActualId(id);
        setSidebarOpen(false);
      }}
      progresoGeneral={0}
    />
  );

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header con badge PREVIEW */}
      <header className="h-14 border-b bg-card flex items-center px-4 gap-4 flex-shrink-0">
        <Button variant="ghost" size="sm" onClick={() => navigate(`/lms/admin/cursos/${cursoId}`)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>

        <div className="flex-1 min-w-0 flex items-center gap-3">
          <h1 className="font-semibold text-foreground truncate">{curso.titulo}</h1>
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700 flex-shrink-0">
            <Eye className="w-3 h-3 mr-1" />
            PREVIEW
          </Badge>
        </div>

        {/* Botón menú móvil */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="lg:hidden">
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-80">
            {sidebarContent}
          </SheetContent>
        </Sheet>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar desktop */}
        <aside className="hidden lg:block w-80 flex-shrink-0 overflow-y-auto">
          {sidebarContent}
        </aside>

        {/* Contenido principal */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-6 lg:p-8 space-y-6">
            {contenidoActual ? (
              <>
                <h2 className="text-xl font-semibold text-foreground">
                  {contenidoActual.titulo}
                </h2>

                {/* Renderizador sin callbacks de progreso */}
                <ContentRenderer
                  contenido={contenidoActual}
                />

                {/* Navegación */}
                <div className="flex justify-between items-center pt-6 border-t">
                  <Button variant="outline" onClick={goToPrevious} disabled={!hasPrevious}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Anterior
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {indiceActual + 1} de {todosLosContenidos.length}
                  </span>
                  <Button onClick={goToNext} disabled={!hasNext}>
                    Siguiente
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No hay contenido disponible en este curso</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
