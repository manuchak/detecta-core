import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Plus, GripVertical, Edit2, Trash2, EyeOff, Eye,
  ChevronDown, ChevronRight, BookOpen, FileText, Video, HelpCircle,
  Layers, Clock, Users, BarChart
} from "lucide-react";
import { useLMSAdminCursoDetalle } from "@/hooks/lms/useLMSAdminCursos";
import { useLMSCrearModulo, useLMSActualizarModulo, useLMSEliminarModulo } from "@/hooks/lms/useLMSAdminModulos";
import { useLMSCrearContenido, useLMSActualizarContenido, useLMSEliminarContenido } from "@/hooks/lms/useLMSAdminContenidos";
import { LMSModuloForm } from "./LMSModuloForm";
import { LMSContenidoForm } from "./LMSContenidoForm";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CustomBreadcrumb } from "@/components/ui/custom-breadcrumb";
import { toast } from "sonner";
import type { TipoContenido } from "@/types/lms";

const TIPO_ICONO: Record<string, React.ElementType> = {
  video: Video,
  texto_enriquecido: FileText,
  documento: FileText,
  quiz: HelpCircle,
  default: BookOpen
};

export function LMSCursoDetalle() {
  const { cursoId } = useParams<{ cursoId: string }>();
  const navigate = useNavigate();
  
  const { data: cursoData, isLoading: loadingCurso } = useLMSAdminCursoDetalle(cursoId!);
  const curso = cursoData;
  const modulos = curso?.modulos || [];
  const loadingModulos = loadingCurso;
  
  const createModulo = useLMSCrearModulo();
  const updateModulo = useLMSActualizarModulo();
  const deleteModulo = useLMSEliminarModulo();
  
  const createContenido = useLMSCrearContenido();
  const updateContenido = useLMSActualizarContenido();
  const deleteContenido = useLMSEliminarContenido();

  const [moduloFormOpen, setModuloFormOpen] = useState(false);
  const [editingModulo, setEditingModulo] = useState<any>(null);
  
  const [contenidoFormOpen, setContenidoFormOpen] = useState(false);
  const [editingContenido, setEditingContenido] = useState<any>(null);
  const [selectedModuloId, setSelectedModuloId] = useState<string | null>(null);
  
  const [deleteDialog, setDeleteDialog] = useState<{ type: 'modulo' | 'contenido'; id: string; nombre: string } | null>(null);
  const [expandedModulos, setExpandedModulos] = useState<Set<string>>(new Set());

  const toggleModulo = (moduloId: string) => {
    const newExpanded = new Set(expandedModulos);
    if (newExpanded.has(moduloId)) {
      newExpanded.delete(moduloId);
    } else {
      newExpanded.add(moduloId);
    }
    setExpandedModulos(newExpanded);
  };

  const handleCreateModulo = async (data: any) => {
    try {
      await createModulo.mutateAsync({ cursoId: cursoId!, data });
      setModuloFormOpen(false);
      toast.success("Módulo creado exitosamente");
    } catch (error) {
      toast.error("Error al crear el módulo");
    }
  };

  const handleUpdateModulo = async (data: any) => {
    if (!editingModulo) return;
    try {
      await updateModulo.mutateAsync({ id: editingModulo.id, cursoId: cursoId!, data });
      setModuloFormOpen(false);
      setEditingModulo(null);
      toast.success("Módulo actualizado");
    } catch (error) {
      toast.error("Error al actualizar el módulo");
    }
  };

  const handleDeleteModulo = async () => {
    if (!deleteDialog || deleteDialog.type !== 'modulo') return;
    try {
      await deleteModulo.mutateAsync({ moduloId: deleteDialog.id, cursoId: cursoId! });
      setDeleteDialog(null);
      toast.success("Módulo eliminado");
    } catch (error) {
      toast.error("Error al eliminar el módulo");
    }
  };

  const handleCreateContenido = async (data: any) => {
    if (!selectedModuloId) return;
    try {
      await createContenido.mutateAsync({ moduloId: selectedModuloId, cursoId: cursoId!, data });
      setContenidoFormOpen(false);
      setSelectedModuloId(null);
      toast.success("Contenido creado exitosamente");
    } catch (error) {
      toast.error("Error al crear el contenido");
    }
  };

  const handleUpdateContenido = async (data: any) => {
    if (!editingContenido) return;
    try {
      await updateContenido.mutateAsync({ id: editingContenido.id, moduloId: selectedModuloId!, cursoId: cursoId!, data });
      setContenidoFormOpen(false);
      setEditingContenido(null);
      toast.success("Contenido actualizado");
    } catch (error) {
      toast.error("Error al actualizar el contenido");
    }
  };

  const handleDeleteContenido = async () => {
    if (!deleteDialog || deleteDialog.type !== 'contenido') return;
    try {
      await deleteContenido.mutateAsync({ contenidoId: deleteDialog.id, moduloId: selectedModuloId || '', cursoId: cursoId! });
      setDeleteDialog(null);
      toast.success("Contenido eliminado");
    } catch (error) {
      toast.error("Error al eliminar el contenido");
    }
  };

  // Calcular nextOrden para contenido basado en el módulo seleccionado
  const getNextContenidoOrden = () => {
    if (!selectedModuloId) return 1;
    const selectedModulo = modulos.find(m => m.id === selectedModuloId);
    return (selectedModulo?.contenidos?.length || 0) + 1;
  };

  if (loadingCurso) {
    return (
      <div className="container max-w-5xl py-8 space-y-6">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-10 w-64" />
        <div className="apple-grid-metrics">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      </div>
    );
  }

  if (!curso) {
    return (
      <div className="container max-w-5xl py-8 space-y-4">
        <CustomBreadcrumb items={[{ label: "LMS", href: "/lms" }, { label: "Administración", href: "/lms/admin" }, { label: "Curso" }]} />
        <div className="apple-empty-state">
          <div className="mx-auto w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
            <BookOpen className="w-8 h-8 text-muted-foreground/50" />
          </div>
          <h3 className="apple-text-headline mb-2">Curso no encontrado</h3>
          <p className="apple-text-body text-muted-foreground">
            El curso que buscas no existe o fue eliminado
          </p>
        </div>
      </div>
    );
  }

  // Calcular duración en horas desde minutos
  const duracionHoras = Math.round((curso.duracion_estimada_min || 0) / 60);
  const totalContenidos = modulos.reduce((acc, m) => acc + (m.contenidos?.length || 0), 0);

  return (
    <div className="container max-w-5xl py-8 space-y-6">
      {/* Breadcrumb */}
      <CustomBreadcrumb 
        items={[
          { label: "LMS", href: "/lms" },
          { label: "Administración", href: "/lms/admin" },
          { label: curso.titulo }
        ]} 
      />

      {/* Header - Apple Style */}
      <div className="apple-section-header">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="apple-text-largetitle">{curso.titulo}</h1>
            {curso.publicado ? (
              <Badge className="bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400">
                <Eye className="w-3 h-3 mr-1" />
                Publicado
              </Badge>
            ) : (
              <Badge variant="secondary">
                <EyeOff className="w-3 h-3 mr-1" />
                Borrador
              </Badge>
            )}
            {curso.es_obligatorio && (
              <Badge variant="destructive" className="bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400">
                Obligatorio
              </Badge>
            )}
          </div>
          <p className="apple-text-subtitle mt-1 font-mono">{curso.codigo}</p>
        </div>
        <Button variant="outline" onClick={() => navigate(`/lms/admin/cursos/${cursoId}/editar`)}>
          <Edit2 className="w-4 h-4 mr-2" />
          Editar Curso
        </Button>
      </div>

      {/* Stats - Apple Metric Cards */}
      <div className="apple-grid-metrics">
        <div className="apple-metric-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center">
              <Layers className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="apple-metric-value">{modulos.length}</div>
              <div className="apple-metric-label">Módulos</div>
            </div>
          </div>
        </div>
        <div className="apple-metric-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="apple-metric-value">{totalContenidos}</div>
              <div className="apple-metric-label">Contenidos</div>
            </div>
          </div>
        </div>
        <div className="apple-metric-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="apple-metric-value">{duracionHoras > 0 ? `${duracionHoras}h` : `${curso.duracion_estimada_min}m`}</div>
              <div className="apple-metric-label">Duración</div>
            </div>
          </div>
        </div>
        <div className="apple-metric-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center">
              <BarChart className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="apple-metric-value capitalize">{curso.nivel}</div>
              <div className="apple-metric-label">Nivel</div>
            </div>
          </div>
        </div>
      </div>

      {/* Módulos y Contenidos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Estructura del Curso</CardTitle>
          <Button onClick={() => { setEditingModulo(null); setModuloFormOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Módulo
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingModulos ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : modulos.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No hay módulos en este curso</p>
              <p className="text-sm">Comienza agregando el primer módulo</p>
            </div>
          ) : (
            modulos.map((modulo) => (
              <ModuloCard
                key={modulo.id}
                modulo={modulo}
                expanded={expandedModulos.has(modulo.id)}
                onToggle={() => toggleModulo(modulo.id)}
                onEdit={() => { setEditingModulo(modulo); setModuloFormOpen(true); }}
                onDelete={() => setDeleteDialog({ type: 'modulo', id: modulo.id, nombre: modulo.titulo })}
                onAddContenido={() => { setSelectedModuloId(modulo.id); setEditingContenido(null); setContenidoFormOpen(true); }}
                onEditContenido={(c) => { setEditingContenido(c); setSelectedModuloId(modulo.id); setContenidoFormOpen(true); }}
                onDeleteContenido={(c) => { setSelectedModuloId(modulo.id); setDeleteDialog({ type: 'contenido', id: c.id, nombre: c.titulo }); }}
              />
            ))
          )}
        </CardContent>
      </Card>

      {/* Forms */}
      <LMSModuloForm
        open={moduloFormOpen}
        onOpenChange={setModuloFormOpen}
        cursoId={cursoId!}
        modulo={editingModulo}
        nextOrden={modulos.length + 1}
        onSubmit={editingModulo ? handleUpdateModulo : handleCreateModulo}
        isLoading={createModulo.isPending || updateModulo.isPending}
      />

      <LMSContenidoForm
        open={contenidoFormOpen}
        onOpenChange={setContenidoFormOpen}
        moduloId={selectedModuloId || ""}
        contenido={editingContenido}
        nextOrden={getNextContenidoOrden()}
        onSubmit={editingContenido ? handleUpdateContenido : handleCreateContenido}
        isLoading={createContenido.isPending || updateContenido.isPending}
      />

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar {deleteDialog?.type === 'modulo' ? 'módulo' : 'contenido'}?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará "{deleteDialog?.nombre}" y no se puede deshacer.
              {deleteDialog?.type === 'modulo' && " Todos los contenidos del módulo también serán eliminados."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteDialog?.type === 'modulo' ? handleDeleteModulo : handleDeleteContenido}
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

interface ModuloCardProps {
  modulo: any;
  expanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddContenido: () => void;
  onEditContenido: (c: any) => void;
  onDeleteContenido: (c: any) => void;
}

function ModuloCard({ 
  modulo, 
  expanded, 
  onToggle, 
  onEdit, 
  onDelete, 
  onAddContenido,
  onEditContenido,
  onDeleteContenido 
}: ModuloCardProps) {
  const contenidos = modulo.contenidos || [];
  
  return (
    <Collapsible open={expanded} onOpenChange={onToggle}>
      <div className="border rounded-lg">
        <CollapsibleTrigger asChild>
          <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/50 transition-colors">
            <GripVertical className="w-4 h-4 text-muted-foreground" />
            {expanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{modulo.titulo}</span>
                {!modulo.activo && (
                  <Badge variant="secondary" className="text-xs">
                    <EyeOff className="w-3 h-3 mr-1" />
                    Inactivo
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {contenidos.length} contenido{contenidos.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="border-t px-4 py-3 space-y-2 bg-muted/30">
            {contenidos.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Sin contenidos en este módulo
              </p>
            ) : (
              contenidos.map((contenido: any) => {
                const Icon = TIPO_ICONO[contenido.tipo] || TIPO_ICONO.default;
                const esQuiz = contenido.tipo === 'quiz';
                return (
                  <div 
                    key={contenido.id} 
                    className="flex items-center gap-3 p-3 bg-background rounded-md border"
                  >
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{contenido.titulo}</span>
                        {esQuiz && <Badge variant="outline" className="text-xs">Quiz</Badge>}
                        {!contenido.activo && <Badge variant="secondary" className="text-xs">Inactivo</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {contenido.duracion_min} min • {contenido.tipo}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => onEditContenido(contenido)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onDeleteContenido(contenido)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                );
              })
            )}
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full mt-2"
              onClick={onAddContenido}
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar Contenido
            </Button>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
