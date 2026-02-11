import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, GripVertical, Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ContenidoInlineEditor } from "./ContenidoInlineEditor";
import { useLMSActualizarModulo, useLMSEliminarModulo } from "@/hooks/lms/useLMSAdminModulos";
import { useLMSCrearContenido } from "@/hooks/lms/useLMSAdminContenidos";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { LMSModulo, LMSContenido, TipoContenido, LMS_TIPOS_CONTENIDO } from "@/types/lms";

interface ModuloInlineEditorProps {
  modulo: LMSModulo & { contenidos: LMSContenido[] };
  cursoId: string;
  cursoTitulo?: string;
  dragHandleProps?: any;
}

const TIPOS_CONTENIDO: { value: TipoContenido; label: string }[] = [
  { value: 'video', label: 'Video' },
  { value: 'documento', label: 'Documento' },
  { value: 'texto_enriquecido', label: 'Texto enriquecido' },
  { value: 'quiz', label: 'Evaluación (Quiz)' },
  { value: 'interactivo', label: 'Interactivo' },
  { value: 'embed', label: 'Embed externo' },
];

export function ModuloInlineEditor({ modulo, cursoId, cursoTitulo, dragHandleProps }: ModuloInlineEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [titulo, setTitulo] = useState(modulo.titulo);
  const [descripcion, setDescripcion] = useState(modulo.descripcion || '');
  const [showAddContent, setShowAddContent] = useState(false);
  const [newContentTitle, setNewContentTitle] = useState('');
  const [newContentType, setNewContentType] = useState<TipoContenido>('texto_enriquecido');

  const actualizarModulo = useLMSActualizarModulo();
  const eliminarModulo = useLMSEliminarModulo();
  const crearContenido = useLMSCrearContenido();

  const contenidosActivos = (modulo.contenidos || []).filter(c => c.activo);

  const handleSaveModulo = () => {
    if (!titulo.trim()) return;
    actualizarModulo.mutate({
      id: modulo.id,
      cursoId,
      data: { titulo, descripcion: descripcion || undefined },
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

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="rounded-lg border bg-card overflow-hidden">
        {/* Module header */}
        <div className="flex items-center gap-2 p-3 hover:bg-muted/30 transition-colors">
          <span {...dragHandleProps} className="cursor-grab text-muted-foreground">
            <GripVertical className="w-4 h-4" />
          </span>

          <CollapsibleTrigger className="flex items-center gap-2 flex-1 min-w-0 text-left">
            {isOpen ? <ChevronDown className="w-4 h-4 shrink-0" /> : <ChevronRight className="w-4 h-4 shrink-0" />}
            
            {isEditing ? (
              <div className="flex flex-col gap-2 flex-1" onClick={e => e.stopPropagation()}>
                <Input
                  value={titulo}
                  onChange={e => setTitulo(e.target.value)}
                  className="h-8 text-sm font-medium"
                  autoFocus
                  onKeyDown={e => { if (e.key === 'Enter') handleSaveModulo(); if (e.key === 'Escape') { setTitulo(modulo.titulo); setDescripcion(modulo.descripcion || ''); setIsEditing(false); } }}
                />
                <Textarea
                  value={descripcion}
                  onChange={e => setDescripcion(e.target.value)}
                  placeholder="Descripción del módulo (opcional)"
                  className="min-h-[60px] text-sm"
                />
                <div className="flex gap-1">
                  <Button size="sm" variant="default" className="h-7 text-xs" onClick={handleSaveModulo}>
                    <Check className="w-3 h-3 mr-1" /> Guardar
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setTitulo(modulo.titulo); setDescripcion(modulo.descripcion || ''); setIsEditing(false); }}>
                    <X className="w-3 h-3 mr-1" /> Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex-1 min-w-0">
                <span className="font-medium text-sm truncate block">{modulo.titulo}</span>
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

        {/* Collapsible contents */}
        <CollapsibleContent>
          <div className="border-t px-3 pb-3">
            {/* Content list */}
            <div className="mt-2 space-y-0.5">
              {contenidosActivos.length === 0 && (
                <p className="text-xs text-muted-foreground py-3 text-center">Sin contenidos aún</p>
              )}
              {contenidosActivos.map(contenido => (
                <ContenidoInlineEditor
                  key={contenido.id}
                  contenido={contenido}
                  cursoId={cursoId}
                  cursoTitulo={cursoTitulo}
                  moduloTitulo={modulo.titulo}
                />
              ))}
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
  );
}
