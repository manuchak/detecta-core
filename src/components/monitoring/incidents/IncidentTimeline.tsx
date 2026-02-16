import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Eye, Bell, Zap, ArrowUp, Camera, CheckCircle, MessageSquare, Plus, Trash2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { EntradaCronologia, TipoEntradaCronologia } from '@/hooks/useIncidentesOperativos';
import { TIPOS_ENTRADA_CRONOLOGIA } from '@/hooks/useIncidentesOperativos';

const ICON_MAP: Record<TipoEntradaCronologia, React.ReactNode> = {
  deteccion: <Eye className="h-4 w-4" />,
  notificacion: <Bell className="h-4 w-4" />,
  accion: <Zap className="h-4 w-4" />,
  escalacion: <ArrowUp className="h-4 w-4" />,
  evidencia: <Camera className="h-4 w-4" />,
  resolucion: <CheckCircle className="h-4 w-4" />,
  nota: <MessageSquare className="h-4 w-4" />,
};

const COLOR_MAP: Record<TipoEntradaCronologia, string> = {
  deteccion: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  notificacion: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
  accion: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
  escalacion: 'bg-red-500/10 text-red-600 border-red-500/30',
  evidencia: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/30',
  resolucion: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
  nota: 'bg-gray-500/10 text-gray-600 border-gray-500/30',
};

export interface LocalTimelineEntry {
  localId: string;
  timestamp: string;
  tipo_entrada: TipoEntradaCronologia;
  descripcion: string;
}

interface IncidentTimelineProps {
  entries: EntradaCronologia[];
  localEntries?: LocalTimelineEntry[];
  onAddEntry: (entry: { timestamp: string; tipo_entrada: TipoEntradaCronologia; descripcion: string }) => void;
  onDeleteEntry?: (id: string) => void;
  onDeleteLocalEntry?: (localId: string) => void;
  isAdding?: boolean;
  readOnly?: boolean;
}

export const IncidentTimeline: React.FC<IncidentTimelineProps> = ({
  entries,
  localEntries = [],
  onAddEntry,
  onDeleteEntry,
  onDeleteLocalEntry,
  isAdding = false,
  readOnly = false,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [newEntry, setNewEntry] = useState({
    timestamp: new Date().toISOString().slice(0, 16),
    tipo_entrada: '' as TipoEntradaCronologia | '',
    descripcion: '',
  });

  const handleSubmit = () => {
    if (!newEntry.tipo_entrada || !newEntry.descripcion.trim()) return;
    onAddEntry({
      timestamp: new Date(newEntry.timestamp).toISOString(),
      tipo_entrada: newEntry.tipo_entrada as TipoEntradaCronologia,
      descripcion: newEntry.descripcion.trim(),
    });
    setNewEntry({ timestamp: new Date().toISOString().slice(0, 16), tipo_entrada: '', descripcion: '' });
    setShowForm(false);
  };

  // Merge DB entries and local entries for display, sorted by timestamp
  const allEntries: Array<(EntradaCronologia & { isLocal?: false }) | (LocalTimelineEntry & { isLocal: true })> = [
    ...entries.map(e => ({ ...e, isLocal: false as const })),
    ...localEntries.map(e => ({ ...e, isLocal: true as const })),
  ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Cronología del Evento</h3>
        {!readOnly && (
          <Button size="sm" variant="outline" onClick={() => setShowForm(!showForm)} className="gap-1 h-7 text-xs">
            <Plus className="h-3 w-3" />
            Agregar entrada
          </Button>
        )}
      </div>

      {/* Add entry form */}
      {showForm && !readOnly && (
        <div className="border rounded-lg p-3 space-y-3 bg-muted/30">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium">Fecha/Hora</label>
              <Input
                type="datetime-local"
                value={newEntry.timestamp}
                onChange={e => setNewEntry(p => ({ ...p, timestamp: e.target.value }))}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Tipo</label>
              <Select value={newEntry.tipo_entrada} onValueChange={v => setNewEntry(p => ({ ...p, tipo_entrada: v as TipoEntradaCronologia }))}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                <SelectContent>
                  {TIPOS_ENTRADA_CRONOLOGIA.map(t => (
                    <SelectItem key={t.value} value={t.value} className="text-xs">
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">Descripción</label>
            <Textarea
              value={newEntry.descripcion}
              onChange={e => setNewEntry(p => ({ ...p, descripcion: e.target.value }))}
              placeholder="Detalla lo ocurrido en este momento..."
              rows={2}
              className="text-xs"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="ghost" onClick={() => setShowForm(false)} className="h-7 text-xs">Cancelar</Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!newEntry.tipo_entrada || !newEntry.descripcion.trim() || isAdding}
              className="h-7 text-xs gap-1"
            >
              {isAdding && <Loader2 className="h-3 w-3 animate-spin" />}
              Agregar
            </Button>
          </div>
        </div>
      )}

      {/* Timeline */}
      {allEntries.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground">
          <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p className="text-xs">Sin entradas en la cronología</p>
          {!readOnly && <p className="text-[10px] mt-1">Agrega la primera entrada para documentar el evento</p>}
        </div>
      ) : (
        <div className="relative pl-6 space-y-0">
          {/* Vertical line */}
          <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border" />

          {allEntries.map((entry) => {
            const tipo = entry.tipo_entrada as TipoEntradaCronologia;
            const colorClass = COLOR_MAP[tipo] || COLOR_MAP.nota;
            const entryKey = entry.isLocal ? entry.localId : (entry as EntradaCronologia).id;
            return (
              <div key={entryKey} className="relative pb-4 last:pb-0">
                {/* Dot */}
                <div className={`absolute -left-6 top-1 h-[22px] w-[22px] rounded-full border-2 flex items-center justify-center ${colorClass}`}>
                  {ICON_MAP[tipo] || <MessageSquare className="h-3 w-3" />}
                </div>
                {/* Content */}
                <div className="ml-2 group">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] text-muted-foreground tabular-nums">
                      {format(new Date(entry.timestamp), "dd/MM HH:mm", { locale: es })}
                    </span>
                    <Badge variant="outline" className={`text-[9px] h-4 px-1.5 ${colorClass}`}>
                      {TIPOS_ENTRADA_CRONOLOGIA.find(t => t.value === tipo)?.label || tipo}
                    </Badge>
                    {entry.isLocal && (
                      <Badge variant="secondary" className="text-[9px] h-4 px-1.5">Pendiente</Badge>
                    )}
                    {!readOnly && !entry.isLocal && onDeleteEntry && (
                      <button
                        onClick={() => onDeleteEntry((entry as EntradaCronologia).id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </button>
                    )}
                    {!readOnly && entry.isLocal && onDeleteLocalEntry && (
                      <button
                        onClick={() => onDeleteLocalEntry(entry.localId)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-foreground">{entry.descripcion}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
