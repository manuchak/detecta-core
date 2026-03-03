import { useState } from "react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ChevronDown, ChevronRight, GripVertical, Plus, Pencil, Trash2, Check, X, Eye } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ContenidoInlineEditor } from "./ContenidoInlineEditor";
import { AIGenerateButton } from "../wizard/AIGenerateButton";
import { useLMSAI } from "@/hooks/lms/useLMSAI";
import { useLMSActualizarModulo, useLMSEliminarModulo } from "@/hooks/lms/useLMSAdminModulos";
import { useLMSCrearContenido, useLMSReordenarContenidos } from "@/hooks/lms/useLMSAdminContenidos";
import { toast } from "sonner";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { LMSModulo, LMSContenido, TipoContenido } from "@/types/lms";

interface ModuloInlineEditorProps {
  modulo: LMSModulo & { contenidos: LMSContenido[] };
  cursoId: string;
  cursoTitulo?: string;
  defaultOpen?: boolean;
  editingContenidoId?: string;
  onExpandChange?: (isOpen: boolean) => void;
  onEditingContenidoChange?: (contenidoId: string | null) => void;
}

const TIPOS_CONTENIDO: { value: TipoContenido; label: string }[] = [
  { value: 'video', label: 'Video' },
  { value: 'documento', label: 'Documento' },
  { value: 'texto_enriquecido', label: 'Texto enriquecido' },
  { value: 'quiz', label: 'Evaluación (Quiz)' },
  { value: 'interactivo', label: 'Interactivo' },
  { value: 'embed', label: 'Embed externo' },
];

const SUGERENCIAS_TITULO = [
  "Introducción",
  "Fundamentos",
  "Conceptos Clave",
  "Práctica Guiada",
  "Casos de Estudio",
  "Evaluación Final",
];

export function ModuloInlineEditor({ modulo, cursoId, cursoTitulo, defaultOpen, editingContenidoId, onExpandChange, onEditingContenidoChange }: ModuloInlineEditorProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen ?? false);
  const [isEditing, setIsEditing] = useState(false);
  const [titulo, setTitulo] = useState(modulo.titulo);
  const [descripcion, setDescripcion] = useState(modulo.descripcion || '');
  const [activo, setActivo] = useState(modulo.activo ?? true);
  const [showAddContent, setShowAddContent] = useState(false);
  const [newContentTitle, setNewContentTitle] = useState('');
  const [newContentType, setNewContentType] = useState<TipoContenido>('texto_enriquecido');
  const [aiDescSuccess, setAiDescSuccess] = useState(false);

  const actualizarModulo = useLMSActualizarModulo();
  const eliminarModulo = useLMSEliminarModulo();
  const crearContenido = useLMSCrearContenido();
  const reordenarContenidos = useLMSReordenarContenidos();
  const { loading: aiLoading, generateCourseMetadata } = useLMSAI();

  // Sortable for this module
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: modulo.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  // DnD sensors for contents
  const contentSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const contenidosActivos = (modulo.contenidos || []).filter(c => c.activo);

  const handleContentDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = contenidosActivos.findIndex(c => c.id === active.id);
    const newIndex = contenidosActivos.findIndex(c => c.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(contenidosActivos, oldIndex, newIndex);
    reordenarContenidos.mutate({
      moduloId: modulo.id,
      cursoId,
      contenidos: reordered.map((c, idx) => ({ id: c.id, orden: idx + 1 })),
    });
  };

  const handleSaveModulo = () => {
    if (!titulo.trim()) return;
    actualizarModulo.mutate({
      id: modulo.id,
      cursoId,
      data: { titulo, descripcion: descripcion || undefined, activo } as any,
    });
    setIsEditing(false);
  };

  const handleDeleteModulo = () => {
    eliminarModulo.mutate({ moduloId: modulo.id, cursoId });
  };

  const handleAddContent = () => {
    if (!newContentTitle.trim()) return;
    crearContenido.mutate({
      moduloId: modulo.id,
      cursoId,
      data: {
        titulo: newContentTitle,
        tipo: newContentType,
        duracion_min: 10,
        es_obligatorio: true,
      },
    });
    setNewContentTitle('');
    setShowAddContent(false);
  };

  const handleGenerateDescription = async () => {
    const context = cursoTitulo ? `${titulo} - ${cursoTitulo}` : titulo;
    if (!context.trim()) {
      toast.error("Escribe un título primero");
      return;
    }
    const result = await generateCourseMetadata(context);
    if (result?.descripcion) {
      setDescripcion(result.descripcion);
      setAiDescSuccess(true);
      toast.success("Descripción generada");
      setTimeout(() => setAiDescSuccess(false), 2000);
    }
  };

  const handleSugerencia = (sugerencia: string) => {
    const suffix = cursoTitulo ? `: ${cursoTitulo}` : '';
    setTitulo(`${sugerencia}${suffix}`);
  };

  const isInactivo = !modulo.activo;

  return (
    <div ref={setNodeRef} style={style}>
      <Collapsible open={isOpen} onOpenChange={(open) => { setIsOpen(open); onExpandChange?.(open); }}>
        <div className={`rounded-lg border bg-card overflow-hidden ${isInactivo ? 'opacity-60' : ''}`}>
          {/* Module header */}
          <div className="flex items-center gap-2 p-3 hover:bg-muted/30 transition-colors">
            <span {...attributes} {...listeners} className="cursor-grab text-muted-foreground">
              <GripVertical className="w-4 h-4" />
            </span>

            <CollapsibleTrigger className="flex items-center gap-2 flex-1 min-w-0 text-left">
              {isOpen ? <ChevronDown className="w-4 h-4 shrink-0" /> : <ChevronRight className="w-4 h-4 shrink-0" />}
              
              {!isEditing && (
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate block">{modulo.titulo}</span>
                    {isInactivo && (
                      <Badge variant="outline" className="text-[10px] h-5 shrink-0">Inactivo</Badge>
                    )}
                  </div>
                  {modulo.descripcion && (
                    <span className="text-xs text-muted-foreground truncate block">{modulo.descripcion}</span>
                  )}
                </div>
              )}
            </CollapsibleTrigger>

            {!isEditing && (
              <div className="flex items-center gap-1 shrink-0">
                <Badge variant="secondary" className="text-[10px] h-5">
                  {contenidosActivos.length} contenido{contenidosActivos.length !== 1 ? 's' : ''}
                </Badge>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); setIsEditing(true); setIsOpen(true); }}>
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={e => e.stopPropagation()}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Eliminar módulo?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Se eliminará "{modulo.titulo}" y todos sus contenidos. Si hay progreso registrado, se desactivará.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteModulo}>Eliminar</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>

          {/* Inline editing form (shown above collapsible content) */}
          {isEditing && (
            <div className="border-t px-3 py-3 space-y-3" onClick={e => e.stopPropagation()}>
              {/* Quick title suggestions */}
              <div className="flex flex-wrap gap-1">
                {SUGERENCIAS_TITULO.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleSugerencia(s)}
                    className="px-2 py-0.5 text-[11px] rounded-full border bg-muted/50 hover:bg-primary/10 hover:border-primary/30 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>

              {/* Title */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Título</label>
                <Input
                  value={titulo}
                  onChange={e => setTitulo(e.target.value)}
                  className="h-8 text-sm font-medium"
                  autoFocus
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleSaveModulo();
                    if (e.key === 'Escape') { setTitulo(modulo.titulo); setDescripcion(modulo.descripcion || ''); setActivo(modulo.activo ?? true); setIsEditing(false); }
                  }}
                />
              </div>

              {/* Description with AI button */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-muted-foreground">Descripción</label>
                  <AIGenerateButton
                    onClick={handleGenerateDescription}
                    loading={aiLoading}
                    success={aiDescSuccess}
                    disabled={!titulo.trim()}
                    tooltip="Generar descripción con IA"
                    size="icon"
                    className="h-6 w-6"
                  />
                </div>
                <Textarea
                  value={descripcion}
                  onChange={e => setDescripcion(e.target.value)}
                  placeholder="Descripción del módulo (opcional)"
                  className="min-h-[60px] text-sm"
                />
              </div>

              {/* Preview card */}
              {(titulo.trim() || descripcion.trim()) && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Eye className="w-3 h-3" />
                    <span>Vista previa</span>
                  </div>
                  <div className="rounded-md border bg-muted/30 p-3">
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                        {modulo.orden}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{titulo || 'Sin título'}</p>
                        {descripcion && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{descripcion}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions: toggle + save/cancel */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <Switch checked={activo} onCheckedChange={setActivo} className="scale-90" />
                  <span className="text-xs text-muted-foreground">{activo ? 'Activo' : 'Inactivo'}</span>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="default" className="h-7 text-xs" onClick={handleSaveModulo}>
                    <Check className="w-3 h-3 mr-1" /> Guardar
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setTitulo(modulo.titulo); setDescripcion(modulo.descripcion || ''); setActivo(modulo.activo ?? true); setIsEditing(false); }}>
                    <X className="w-3 h-3 mr-1" /> Cancelar
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Collapsible contents */}
          <CollapsibleContent>
            <div className="border-t px-3 pb-3">
              {/* Content list with DnD */}
              <div className="mt-2 space-y-0.5">
                {contenidosActivos.length === 0 && (
                  <p className="text-xs text-muted-foreground py-3 text-center">Sin contenidos aún</p>
                )}
                <DndContext sensors={contentSensors} collisionDetection={closestCenter} onDragEnd={handleContentDragEnd}>
                  <SortableContext items={contenidosActivos.map(c => c.id)} strategy={verticalListSortingStrategy}>
                    {contenidosActivos.map(contenido => (
                      <ContenidoInlineEditor
                        key={contenido.id}
                        contenido={contenido}
                        cursoId={cursoId}
                        cursoTitulo={cursoTitulo}
                        moduloTitulo={modulo.titulo}
                        defaultEditing={contenido.id === editingContenidoId}
                        onEditingChange={(editing) => onEditingContenidoChange?.(editing ? contenido.id : null)}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              </div>

              {/* Add content inline */}
              {showAddContent ? (
                <div className="mt-3 p-3 rounded-md border border-dashed space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Input
                      placeholder="Título del contenido"
                      value={newContentTitle}
                      onChange={e => setNewContentTitle(e.target.value)}
                      className="h-8 text-sm"
                      autoFocus
                      onKeyDown={e => { if (e.key === 'Enter') handleAddContent(); if (e.key === 'Escape') setShowAddContent(false); }}
                    />
                    <Select value={newContentType} onValueChange={v => setNewContentType(v as TipoContenido)}>
                      <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {TIPOS_CONTENIDO.map(t => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" className="h-7 text-xs" onClick={handleAddContent} disabled={!newContentTitle.trim() || crearContenido.isPending}>
                      <Check className="w-3 h-3 mr-1" /> Agregar
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setShowAddContent(false)}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 w-full h-8 text-xs text-muted-foreground hover:text-foreground border border-dashed"
                  onClick={() => setShowAddContent(true)}
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Agregar contenido
                </Button>
              )}
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    </div>
  );
}
