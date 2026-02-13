import { useCSQueja, useUpdateCSQueja } from '@/hooks/useCSQuejas';
import { useCSTouchpoints, useCreateCSTouchpoint } from '@/hooks/useCSTouchpoints';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useState } from 'react';
import { Clock, MessageSquare, Send } from 'lucide-react';

interface Props {
  quejaId: string;
}

export function CSQuejaDetail({ quejaId }: Props) {
  const { data: queja, isLoading } = useCSQueja(quejaId);
  const { data: touchpoints } = useCSTouchpoints({ queja_id: quejaId });
  const updateQueja = useUpdateCSQueja();
  const createTouchpoint = useCreateCSTouchpoint();

  const [newNote, setNewNote] = useState('');
  const [noteTipo, setNoteTipo] = useState('nota_interna');

  if (isLoading || !queja) {
    return <div className="space-y-4"><Skeleton className="h-32" /><Skeleton className="h-48" /></div>;
  }

  const handleStatusChange = (estado: string) => {
    updateQueja.mutate({ id: quejaId, estado });
  };

  const handleAddTouchpoint = () => {
    if (!newNote.trim()) return;
    createTouchpoint.mutate({
      queja_id: quejaId,
      cliente_id: queja.cliente_id,
      tipo: noteTipo,
      direccion: 'saliente',
      resumen: newNote,
    });
    setNewNote('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="font-mono text-lg font-bold text-primary">{queja.numero_queja}</span>
          <p className="text-sm text-muted-foreground mt-1">
            {queja.cliente?.nombre || 'Cliente'} · {format(new Date(queja.created_at), "dd MMM yyyy HH:mm", { locale: es })}
          </p>
        </div>
        <Select value={queja.estado} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="abierta">Abierta</SelectItem>
            <SelectItem value="en_investigacion">En investigación</SelectItem>
            <SelectItem value="accion_correctiva">Acción correctiva</SelectItem>
            <SelectItem value="seguimiento">Seguimiento</SelectItem>
            <SelectItem value="cerrada">Cerrada</SelectItem>
            <SelectItem value="reabierta">Reabierta</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-xs text-muted-foreground">Tipo</Label>
          <p className="text-sm font-medium capitalize">{queja.tipo.replace(/_/g, ' ')}</p>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Severidad</Label>
          <Badge variant="outline" className="capitalize">{queja.severidad}</Badge>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Canal</Label>
          <p className="text-sm capitalize">{queja.canal_entrada.replace(/_/g, ' ')}</p>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">SLA Resolución</Label>
          <p className="text-sm">{queja.sla_resolucion_horas}h</p>
        </div>
      </div>

      <Separator />

      {/* Description */}
      <div>
        <Label className="text-xs text-muted-foreground">Descripción</Label>
        <p className="text-sm mt-1">{queja.descripcion}</p>
      </div>

      {/* Causa raiz & acciones */}
      {(queja.causa_raiz || queja.accion_correctiva || queja.accion_preventiva) && (
        <>
          <Separator />
          <div className="space-y-3">
            {queja.causa_raiz && (
              <div>
                <Label className="text-xs text-muted-foreground">Causa Raíz (ISO 10.2)</Label>
                <p className="text-sm mt-1">{queja.causa_raiz}</p>
              </div>
            )}
            {queja.accion_correctiva && (
              <div>
                <Label className="text-xs text-muted-foreground">Acción Correctiva</Label>
                <p className="text-sm mt-1">{queja.accion_correctiva}</p>
              </div>
            )}
            {queja.accion_preventiva && (
              <div>
                <Label className="text-xs text-muted-foreground">Acción Preventiva</Label>
                <p className="text-sm mt-1">{queja.accion_preventiva}</p>
              </div>
            )}
          </div>
        </>
      )}

      <Separator />

      {/* Timeline */}
      <div>
        <h3 className="font-medium mb-3 flex items-center gap-2">
          <Clock className="h-4 w-4" /> Timeline de interacciones
        </h3>

        {touchpoints && touchpoints.length > 0 ? (
          <div className="space-y-3">
            {touchpoints.map(tp => (
              <div key={tp.id} className="flex gap-3 p-3 rounded-lg bg-secondary/30">
                <MessageSquare className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium capitalize">{tp.tipo.replace(/_/g, ' ')}</span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(tp.created_at), "dd MMM HH:mm", { locale: es })}
                    </span>
                  </div>
                  <p className="text-sm">{tp.resumen}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Sin interacciones registradas.</p>
        )}

        {/* Add touchpoint */}
        <div className="mt-4 space-y-2">
          <div className="flex gap-2">
            <Select value={noteTipo} onValueChange={setNoteTipo}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="nota_interna">Nota interna</SelectItem>
                <SelectItem value="llamada_seguimiento">Llamada</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="reunion">Reunión</SelectItem>
                <SelectItem value="visita">Visita</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Textarea
              placeholder="Agregar nota o registro de interacción..."
              value={newNote}
              onChange={e => setNewNote(e.target.value)}
              className="min-h-[60px]"
            />
            <Button
              size="icon"
              onClick={handleAddTouchpoint}
              disabled={!newNote.trim() || createTouchpoint.isPending}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* CSAT at close */}
      {queja.estado === 'cerrada' && queja.calificacion_cierre && (
        <>
          <Separator />
          <div>
            <Label className="text-xs text-muted-foreground">CSAT al cierre</Label>
            <p className="text-2xl font-bold">{queja.calificacion_cierre}/5</p>
          </div>
        </>
      )}
    </div>
  );
}
