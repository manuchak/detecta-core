import { useState, useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  StickyNote, Plus, Pin, PinOff, Pencil, Trash2, Search,
  MoreVertical, X, Loader2,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  useNotasOperativo,
  type NotaOperativo, type NotaCategoria, type NotaPrioridad,
} from '../../hooks/useNotasOperativo';
import { toast } from 'sonner';

interface NotasTabProps {
  operativoId: string;
  operativoTipo: string;
}

const CATEGORIAS: { value: NotaCategoria; label: string; className: string }[] = [
  { value: 'general', label: 'General', className: 'bg-muted text-muted-foreground' },
  { value: 'incidencia', label: 'Incidencia', className: 'bg-destructive/10 text-destructive' },
  { value: 'acuerdo', label: 'Acuerdo', className: 'bg-success/10 text-success' },
  { value: 'seguimiento', label: 'Seguimiento', className: 'bg-primary/10 text-primary' },
];

const PRIORIDADES: { value: NotaPrioridad; label: string; color: string }[] = [
  { value: 'baja', label: 'Baja', color: 'bg-success' },
  { value: 'media', label: 'Media', color: 'bg-warning' },
  { value: 'alta', label: 'Alta', color: 'bg-destructive' },
];

export function NotasTab({ operativoId, operativoTipo }: NotasTabProps) {
  const { notas, isLoading, crearNota, editarNota, eliminarNota, togglePin } =
    useNotasOperativo(operativoId, operativoTipo);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [contenido, setContenido] = useState('');
  const [categoria, setCategoria] = useState<NotaCategoria>('general');
  const [prioridad, setPrioridad] = useState<NotaPrioridad>('baja');
  const [filtroCategoria, setFiltroCategoria] = useState<NotaCategoria | 'todas'>('todas');
  const [busqueda, setBusqueda] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const notasFiltradas = useMemo(() => {
    let result = notas;
    if (filtroCategoria !== 'todas') {
      result = result.filter((n) => n.categoria === filtroCategoria);
    }
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      result = result.filter(
        (n) => n.contenido.toLowerCase().includes(q) || n.autor_nombre.toLowerCase().includes(q)
      );
    }
    return result;
  }, [notas, filtroCategoria, busqueda]);

  const resetForm = () => {
    setContenido('');
    setCategoria('general');
    setPrioridad('baja');
    setShowForm(false);
    setEditingId(null);
  };

  const handleSubmit = async () => {
    if (!contenido.trim()) return;
    try {
      if (editingId) {
        await editarNota.mutateAsync({ id: editingId, contenido, categoria, prioridad });
        toast.success('Nota actualizada');
      } else {
        await crearNota.mutateAsync({ contenido, categoria, prioridad });
        toast.success('Nota creada');
      }
      resetForm();
    } catch {
      toast.error('Error al guardar la nota');
    }
  };

  const startEdit = (nota: NotaOperativo) => {
    setEditingId(nota.id);
    setContenido(nota.contenido);
    setCategoria(nota.categoria);
    setPrioridad(nota.prioridad);
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await eliminarNota.mutateAsync(deleteId);
      toast.success('Nota eliminada');
    } catch {
      toast.error('Error al eliminar');
    }
    setDeleteId(null);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const catInfo = (cat: NotaCategoria) => CATEGORIAS.find((c) => c.value === cat)!;
  const prioInfo = (prio: NotaPrioridad) => PRIORIDADES.find((p) => p.value === prio)!;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus className="h-4 w-4 mr-1" /> Nueva Nota
        </Button>
        <div className="flex items-center gap-1 ml-auto">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-8 h-9 w-48"
            />
          </div>
        </div>
      </div>

      {/* Category filter chips */}
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => setFiltroCategoria('todas')}
          className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
            filtroCategoria === 'todas'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          Todas
        </button>
        {CATEGORIAS.map((c) => (
          <button
            key={c.value}
            onClick={() => setFiltroCategoria(c.value)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
              filtroCategoria === c.value ? c.className + ' ring-1 ring-current' : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Form */}
      {showForm && (
        <Card className="border-primary/30">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{editingId ? 'Editar Nota' : 'Nueva Nota'}</span>
              <Button variant="ghost" size="icon" onClick={resetForm} className="h-7 w-7">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Textarea
              placeholder="Escribe tu nota aquí..."
              value={contenido}
              onChange={(e) => setContenido(e.target.value)}
              rows={3}
            />
            <div className="flex flex-wrap gap-4">
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Categoría</span>
                <div className="flex gap-1">
                  {CATEGORIAS.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => setCategoria(c.value)}
                      className={`px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
                        categoria === c.value ? c.className + ' ring-1 ring-current' : 'bg-muted/50 text-muted-foreground'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Prioridad</span>
                <div className="flex gap-1">
                  {PRIORIDADES.map((p) => (
                    <button
                      key={p.value}
                      onClick={() => setPrioridad(p.value)}
                      className={`px-2 py-0.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1 ${
                        prioridad === p.value ? 'bg-accent text-accent-foreground ring-1 ring-current' : 'bg-muted/50 text-muted-foreground'
                      }`}
                    >
                      <span className={`h-2 w-2 rounded-full ${p.color}`} />
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={resetForm}>Cancelar</Button>
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={!contenido.trim() || crearNota.isPending || editarNota.isPending}
              >
                {(crearNota.isPending || editarNota.isPending) && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                {editingId ? 'Guardar' : 'Crear'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes list */}
      {notasFiltradas.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12 text-muted-foreground">
            <StickyNote className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">Sin notas</p>
            <p className="text-sm mt-1">Crea la primera nota para este operativo</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notasFiltradas.map((nota) => {
            const cat = catInfo(nota.categoria);
            const prio = prioInfo(nota.prioridad);
            return (
              <Card
                key={nota.id}
                className={nota.is_pinned ? 'border-primary/40 bg-primary/5' : ''}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-2">
                    {nota.is_pinned && <Pin className="h-4 w-4 text-primary shrink-0 mt-0.5" />}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <Badge className={cat.className + ' text-[11px]'}>{cat.label}</Badge>
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <span className={`h-2 w-2 rounded-full ${prio.color}`} />
                          {prio.label}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap break-words">{nota.contenido}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {nota.autor_nombre} · {formatDistanceToNow(new Date(nota.created_at), { addSuffix: true, locale: es })}
                        {nota.updated_at !== nota.created_at && ' (editada)'}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => togglePin.mutate({ id: nota.id, is_pinned: nota.is_pinned })}>
                          {nota.is_pinned ? <PinOff className="h-4 w-4 mr-2" /> : <Pin className="h-4 w-4 mr-2" />}
                          {nota.is_pinned ? 'Desfijar' : 'Fijar'}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => startEdit(nota)}>
                          <Pencil className="h-4 w-4 mr-2" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeleteId(nota.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" /> Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar nota?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
