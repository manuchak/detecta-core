import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  BookOpen, 
  Plus, 
  Pencil, 
  Trash2, 
  Copy, 
  Eye, 
  EyeOff,
  MoreVertical,
  Users,
  Clock,
  ChevronRight,
  Archive,
  RotateCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  useLMSAdminCursos, 
  useLMSEliminarCurso, 
  useLMSDuplicarCurso,
  useLMSTogglePublicacion,
  useLMSArchivarCurso,
  useLMSReactivarCurso
} from "@/hooks/lms/useLMSAdminCursos";
import { useLMSEstadisticasCurso } from "@/hooks/lms/useLMSAdminInscripciones";
import { LMS_CATEGORIAS, LMS_NIVELES } from "@/types/lms";
import type { LMSCurso } from "@/types/lms";
import { LMSArchivarCursoDialog } from "./LMSArchivarCursoDialog";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export function LMSCursosLista() {
  const navigate = useNavigate();
  const [showArchived, setShowArchived] = useState(false);
  const { data: cursos, isLoading, error } = useLMSAdminCursos(showArchived);
  const eliminarCurso = useLMSEliminarCurso();
  const duplicarCurso = useLMSDuplicarCurso();
  const togglePublicacion = useLMSTogglePublicacion();
  const archivarCurso = useLMSArchivarCurso();
  const reactivarCurso = useLMSReactivarCurso();
  
  const [cursoAEliminar, setCursoAEliminar] = useState<LMSCurso | null>(null);
  const [cursoAArchivar, setCursoAArchivar] = useState<LMSCurso | null>(null);

  const handleEliminar = async () => {
    if (cursoAEliminar) {
      await eliminarCurso.mutateAsync(cursoAEliminar.id);
      setCursoAEliminar(null);
    }
  };

  const handleArchivar = async (reason: string) => {
    if (cursoAArchivar) {
      await archivarCurso.mutateAsync({ cursoId: cursoAArchivar.id, reason });
      setCursoAArchivar(null);
    }
  };

  const handleReactivar = async (cursoId: string) => {
    await reactivarCurso.mutateAsync(cursoId);
  };

  const handleDuplicar = async (cursoId: string) => {
    await duplicarCurso.mutateAsync(cursoId);
  };

  const handleTogglePublicacion = async (cursoId: string, publicadoActual: boolean) => {
    await togglePublicacion.mutateAsync({ cursoId, publicado: !publicadoActual });
  };

  const getNivelLabel = (nivel: string) => {
    return LMS_NIVELES.find(n => n.value === nivel)?.label || nivel;
  };

  const getCategoriaLabel = (categoria: string | undefined) => {
    if (!categoria) return null;
    return LMS_CATEGORIAS.find(c => c.value === categoria)?.label || categoria;
  };

  // Separate active and archived courses
  const activeCursos = cursos?.filter(c => !c.archived_at) || [];
  const archivedCursos = cursos?.filter(c => c.archived_at) || [];
  const displayCursos = showArchived ? cursos : activeCursos;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="py-8 text-center">
          <p className="text-destructive">Error al cargar cursos</p>
          <p className="text-sm text-muted-foreground mt-1">{String(error)}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header con acción */}
      <div className="apple-section-header">
        <div className="flex items-center gap-4">
          <p className="apple-text-body text-muted-foreground">
            {activeCursos.length} cursos activos
            {showArchived && archivedCursos.length > 0 && (
              <span className="text-amber-600 ml-2">
                + {archivedCursos.length} archivados
              </span>
            )}
          </p>
          <div className="flex items-center gap-2">
            <Switch 
              id="show-archived" 
              checked={showArchived} 
              onCheckedChange={setShowArchived} 
            />
            <Label htmlFor="show-archived" className="text-sm text-muted-foreground cursor-pointer">
              Mostrar archivados
            </Label>
          </div>
        </div>
        <Button className="apple-button-primary" onClick={() => navigate('/lms/admin/cursos/nuevo')}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Curso
        </Button>
      </div>

      {/* Empty State */}
      {!displayCursos || displayCursos.length === 0 ? (
        <div className="apple-empty-state">
          <div className="mx-auto w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
            <BookOpen className="w-8 h-8 text-muted-foreground/50" />
          </div>
          <h3 className="apple-text-headline mb-2">
            {showArchived ? "No hay cursos archivados" : "No hay cursos creados"}
          </h3>
          <p className="apple-text-body text-muted-foreground mb-4">
            {showArchived 
              ? "Los cursos archivados aparecerán aquí"
              : "Crea tu primer curso para comenzar a capacitar"
            }
          </p>
          {!showArchived && (
            <Button className="apple-button-primary" onClick={() => navigate('/lms/admin/cursos/nuevo')}>
              <Plus className="w-4 h-4 mr-2" />
              Crear Primer Curso
            </Button>
          )}
        </div>
      ) : (
        <div className="apple-list">
          {displayCursos.map((curso) => (
            <CursoCard
              key={curso.id}
              curso={curso}
              onEditar={() => navigate(`/lms/admin/cursos/${curso.id}/editar`)}
              onVer={() => navigate(`/lms/admin/cursos/${curso.id}`)}
              onEliminar={() => setCursoAEliminar(curso)}
              onArchivar={() => setCursoAArchivar(curso)}
              onReactivar={() => handleReactivar(curso.id)}
              onDuplicar={() => handleDuplicar(curso.id)}
              onTogglePublicacion={() => handleTogglePublicacion(curso.id, curso.publicado)}
              getNivelLabel={getNivelLabel}
              getCategoriaLabel={getCategoriaLabel}
              isReactivating={reactivarCurso.isPending}
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!cursoAEliminar} onOpenChange={() => setCursoAEliminar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar curso?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente el curso y todo su contenido.
              Solo es posible si no hay inscripciones.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEliminar}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Archive Dialog */}
      {cursoAArchivar && (
        <LMSArchivarCursoDialog
          open={!!cursoAArchivar}
          onOpenChange={() => setCursoAArchivar(null)}
          cursoTitulo={cursoAArchivar.titulo}
          inscripcionesCount={0} // Will be fetched by CursoCard
          onConfirm={handleArchivar}
          isLoading={archivarCurso.isPending}
        />
      )}
    </div>
  );
}

// Componente de tarjeta de curso individual
function CursoCard({ 
  curso, 
  onEditar, 
  onVer, 
  onEliminar,
  onArchivar,
  onReactivar,
  onDuplicar, 
  onTogglePublicacion,
  getNivelLabel,
  getCategoriaLabel,
  isReactivating,
}: {
  curso: LMSCurso;
  onEditar: () => void;
  onVer: () => void;
  onEliminar: () => void;
  onArchivar: () => void;
  onReactivar: () => void;
  onDuplicar: () => void;
  onTogglePublicacion: () => void;
  getNivelLabel: (nivel: string) => string;
  getCategoriaLabel: (categoria: string | undefined) => string | null;
  isReactivating?: boolean;
}) {
  const { data: estadisticas } = useLMSEstadisticasCurso(curso.id);
  const isArchived = !!curso.archived_at;

  const statusBorderColor = isArchived 
    ? 'border-l-amber-500'
    : curso.publicado 
      ? 'border-l-green-500' 
      : 'border-l-muted-foreground/30';

  return (
    <div 
      className={`apple-card p-4 cursor-pointer border-l-4 ${statusBorderColor} ${!curso.activo || isArchived ? 'opacity-70' : ''}`}
      onClick={onVer}
    >
      <div className="flex items-start gap-4">
        <div className="hidden sm:flex items-center justify-center w-12 h-12 rounded-xl bg-primary/5">
          <BookOpen className="w-6 h-6 text-primary" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="apple-text-headline truncate">
                  {curso.titulo}
                </h3>
                <Badge variant="outline" className="text-xs font-mono">
                  {curso.codigo}
                </Badge>
                
                {isArchived ? (
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800">
                    <Archive className="w-3 h-3 mr-1" />
                    Archivado
                  </Badge>
                ) : curso.publicado ? (
                  <Badge className="bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800">
                    <Eye className="w-3 h-3 mr-1" />
                    Publicado
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="opacity-70">
                    <EyeOff className="w-3 h-3 mr-1" />
                    Borrador
                  </Badge>
                )}
                
                {curso.es_obligatorio && (
                  <Badge variant="destructive" className="bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800">
                    Obligatorio
                  </Badge>
                )}
              </div>
              
              {curso.descripcion && (
                <p className="apple-text-body text-muted-foreground mt-1 line-clamp-1">
                  {curso.descripcion}
                </p>
              )}
              
              <div className="flex items-center gap-4 mt-2 apple-text-caption">
                {getCategoriaLabel(curso.categoria) && (
                  <span>{getCategoriaLabel(curso.categoria)}</span>
                )}
                <span>{getNivelLabel(curso.nivel)}</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {curso.duracion_estimada_min} min
                </span>
                {estadisticas && (
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {estadisticas.total} inscritos
                  </span>
                )}
                {isArchived && curso.archived_at && (
                  <span className="text-amber-600">
                    Archivado {formatDistanceToNow(new Date(curso.archived_at), { 
                      addSuffix: true, 
                      locale: es 
                    })}
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onVer}>
                    <ChevronRight className="w-4 h-4 mr-2" />
                    Ver detalles
                  </DropdownMenuItem>
                  
                  {!isArchived && (
                    <>
                      <DropdownMenuItem onClick={onEditar}>
                        <Pencil className="w-4 h-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={onTogglePublicacion}>
                        {curso.publicado ? (
                          <>
                            <EyeOff className="w-4 h-4 mr-2" />
                            Despublicar
                          </>
                        ) : (
                          <>
                            <Eye className="w-4 h-4 mr-2" />
                            Publicar
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={onDuplicar}>
                        <Copy className="w-4 h-4 mr-2" />
                        Duplicar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={onArchivar}
                        className="text-amber-600 focus:text-amber-600"
                      >
                        <Archive className="w-4 h-4 mr-2" />
                        Archivar
                      </DropdownMenuItem>
                    </>
                  )}
                  
                  {isArchived && (
                    <>
                      <DropdownMenuItem 
                        onClick={onReactivar}
                        disabled={isReactivating}
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        {isReactivating ? "Reactivando..." : "Reactivar"}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={onDuplicar}>
                        <Copy className="w-4 h-4 mr-2" />
                        Duplicar
                      </DropdownMenuItem>
                    </>
                  )}
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={onEliminar}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
