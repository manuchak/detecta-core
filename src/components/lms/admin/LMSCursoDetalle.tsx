import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowLeft, Plus, GripVertical, Edit2, Trash2, Eye, EyeOff,
  ChevronDown, ChevronRight, BookOpen, FileText, Video, HelpCircle
} from "lucide-react";
import { useLMSAdminCursoDetalle } from "@/hooks/lms/useLMSAdminCursos";
import { useLMSAdminModulos, useLMSCrearModulo, useLMSActualizarModulo, useLMSEliminarModulo } from "@/hooks/lms/useLMSAdminModulos";
import { useLMSAdminContenidos, useLMSCrearContenido, useLMSActualizarContenido, useLMSEliminarContenido } from "@/hooks/lms/useLMSAdminContenidos";
import { LMSModuloForm } from "./LMSModuloForm";
import { LMSContenidoForm } from "./LMSContenidoForm";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";

const TIPO_ICONO: Record<string, React.ElementType> = {
  video: Video,
  texto: FileText,
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

  if (loadingCurso) {
    return (
      <div className="container max-w-5xl py-8 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!curso) {
    return (
      <div className="container max-w-5xl py-8">
        <p className="text-muted-foreground">Curso no encontrado</p>
        <Button variant="link" onClick={() => navigate('/lms/admin')}>
          Volver al panel
        </Button>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/lms/admin')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{curso.titulo}</h1>
            {curso.es_obligatorio && <Badge variant="destructive">Obligatorio</Badge>}
            {!curso.publicado && <Badge variant="secondary">Borrador</Badge>}
          </div>
          <p className="text-muted-foreground">{curso.codigo}</p>
        </div>
        <Button variant="outline" onClick={() => navigate(`/lms/admin/cursos/${cursoId}/editar`)}>
          <Edit2 className="w-4 h-4 mr-2" />
          Editar Curso
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{modulos.length}</div>
            <p className="text-sm text-muted-foreground">Módulos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {modulos.reduce((acc, m) => acc + (m.lms_contenidos?.length || 0), 0)}
            </div>
            <p className="text-sm text-muted-foreground">Contenidos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{curso.duracion_estimada_horas || 0}h</div>
            <p className="text-sm text-muted-foreground">Duración</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{curso.nivel}</div>
            <p className="text-sm text-muted-foreground">Nivel</p>
          </CardContent>
        </Card>
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
                onDeleteContenido={(c) => setDeleteDialog({ type: 'contenido', id: c.id, nombre: c.titulo })}
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
        nextOrden={editingModulo?.lms_contenidos?.length + 1 || 1}
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
  const contenidos = modulo.lms_contenidos || [];
  
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
                const Icon = TIPO_ICONO[contenido.tipo_contenido] || TIPO_ICONO.default;
                return (
                  <div 
                    key={contenido.id} 
                    className="flex items-center gap-3 p-3 bg-background rounded-md border"
                  >
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{contenido.titulo}</span>
                        {contenido.es_quiz && <Badge variant="outline" className="text-xs">Quiz</Badge>}
                        {!contenido.activo && <Badge variant="secondary" className="text-xs">Inactivo</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {contenido.duracion_estimada_minutos} min • {contenido.tipo_contenido}
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
