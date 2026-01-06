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
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  useLMSTogglePublicacion 
} from "@/hooks/lms/useLMSAdminCursos";
import { useLMSEstadisticasCurso } from "@/hooks/lms/useLMSAdminInscripciones";
import { LMS_CATEGORIAS, LMS_NIVELES } from "@/types/lms";
import type { LMSCurso } from "@/types/lms";

export function LMSCursosLista() {
  const navigate = useNavigate();
  const { data: cursos, isLoading, error } = useLMSAdminCursos();
  const eliminarCurso = useLMSEliminarCurso();
  const duplicarCurso = useLMSDuplicarCurso();
  const togglePublicacion = useLMSTogglePublicacion();
  
  const [cursoAEliminar, setCursoAEliminar] = useState<string | null>(null);

  const handleEliminar = async () => {
    if (cursoAEliminar) {
      await eliminarCurso.mutateAsync(cursoAEliminar);
      setCursoAEliminar(null);
    }
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Cursos</h2>
          <p className="text-sm text-muted-foreground">
            {cursos?.length || 0} cursos en total
          </p>
        </div>
        <Button onClick={() => navigate('/lms/admin/cursos/nuevo')}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Curso
        </Button>
      </div>

      {!cursos || cursos.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No hay cursos</h3>
            <p className="text-muted-foreground mb-4">
              Crea tu primer curso para comenzar
            </p>
            <Button onClick={() => navigate('/lms/admin/cursos/nuevo')}>
              <Plus className="w-4 h-4 mr-2" />
              Crear Curso
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {cursos.map((curso) => (
            <CursoCard
              key={curso.id}
              curso={curso}
              onEditar={() => navigate(`/lms/admin/cursos/${curso.id}/editar`)}
              onVer={() => navigate(`/lms/admin/cursos/${curso.id}`)}
              onEliminar={() => setCursoAEliminar(curso.id)}
              onDuplicar={() => handleDuplicar(curso.id)}
              onTogglePublicacion={() => handleTogglePublicacion(curso.id, curso.publicado)}
              getNivelLabel={getNivelLabel}
              getCategoriaLabel={getCategoriaLabel}
            />
          ))}
        </div>
      )}

      <AlertDialog open={!!cursoAEliminar} onOpenChange={() => setCursoAEliminar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar curso?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción desactivará el curso. Si hay inscripciones activas, 
              no podrás eliminarlo.
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
    </div>
  );
}

// Componente de tarjeta de curso individual
function CursoCard({ 
  curso, 
  onEditar, 
  onVer, 
  onEliminar, 
  onDuplicar, 
  onTogglePublicacion,
  getNivelLabel,
  getCategoriaLabel
}: {
  curso: LMSCurso;
  onEditar: () => void;
  onVer: () => void;
  onEliminar: () => void;
  onDuplicar: () => void;
  onTogglePublicacion: () => void;
  getNivelLabel: (nivel: string) => string;
  getCategoriaLabel: (categoria: string | undefined) => string | null;
}) {
  const { data: estadisticas } = useLMSEstadisticasCurso(curso.id);

  return (
    <Card 
      className={`hover:shadow-md transition-shadow cursor-pointer ${!curso.activo ? 'opacity-60' : ''}`}
      onClick={onVer}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="hidden sm:flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
            <BookOpen className="w-6 h-6 text-primary" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-medium text-foreground truncate">
                    {curso.titulo}
                  </h3>
                  <Badge variant="outline" className="text-xs">
                    {curso.codigo}
                  </Badge>
                  {curso.publicado ? (
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                      Publicado
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Borrador</Badge>
                  )}
                  {curso.es_obligatorio && (
                    <Badge variant="destructive" className="text-xs">
                      Obligatorio
                    </Badge>
                  )}
                </div>
                
                {curso.descripcion && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                    {curso.descripcion}
                  </p>
                )}
                
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
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
      </CardContent>
    </Card>
  );
}
