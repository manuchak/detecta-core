import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Square, Plus, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  type TipoEventoRuta,
  type EventoRuta,
  EVENTO_ICONS,
  useEventosRuta,
} from '@/hooks/useEventosRuta';
import { toast } from 'sonner';

const EVENT_TYPES: TipoEventoRuta[] = [
  'inicio_servicio', 'combustible', 'baño', 'descanso',
  'pernocta', 'checkpoint', 'incidencia', 'foto_evidencia', 'otro', 'fin_servicio',
];

interface Props {
  servicioId: string | null;
}

export const EventTracker: React.FC<Props> = ({ servicioId }) => {
  const { activeEvent, startEvent, stopEvent, addPhoto } = useEventosRuta(servicioId);
  const [selectedType, setSelectedType] = useState<TipoEventoRuta>('checkpoint');
  const [descripcion, setDescripcion] = useState('');
  const [fotoUrl, setFotoUrl] = useState('');
  const [latStr, setLatStr] = useState('');
  const [lngStr, setLngStr] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  // Counter animation
  useEffect(() => {
    if (activeEvent) {
      const start = new Date(activeEvent.hora_inicio).getTime();
      const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000));
      tick();
      intervalRef.current = setInterval(tick, 1000);
      return () => clearInterval(intervalRef.current);
    } else {
      setElapsed(0);
    }
  }, [activeEvent]);

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const handleStart = async () => {
    if (!servicioId) { toast.error('Selecciona un servicio'); return; }
    try {
      await startEvent.mutateAsync({
        tipo: selectedType,
        descripcion: descripcion || undefined,
        lat: latStr ? parseFloat(latStr) : undefined,
        lng: lngStr ? parseFloat(lngStr) : undefined,
      });
      setDescripcion('');
      toast.success(`Evento ${EVENTO_ICONS[selectedType].label} iniciado`);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleStop = async () => {
    if (!activeEvent) return;
    try {
      await stopEvent.mutateAsync(activeEvent.id);
      toast.success('Evento cerrado');
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleAddPhoto = async () => {
    if (!activeEvent || !fotoUrl.trim()) return;
    try {
      await addPhoto.mutateAsync({ eventoId: activeEvent.id, url: fotoUrl.trim() });
      setFotoUrl('');
      toast.success('Foto agregada');
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  if (!servicioId) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-6 text-center text-muted-foreground text-sm">
          Selecciona un servicio para registrar eventos
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <span className="text-lg">🎯</span> Registrar Evento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Type selector grid */}
        {!activeEvent && (
          <div className="grid grid-cols-5 gap-1.5">
            {EVENT_TYPES.map(type => {
              const info = EVENTO_ICONS[type];
              const isSelected = selectedType === type;
              return (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={cn(
                    'flex flex-col items-center gap-0.5 p-2 rounded-md text-center transition-all border',
                    isSelected
                      ? 'border-primary bg-primary/10 shadow-sm'
                      : 'border-transparent hover:bg-muted/50'
                  )}
                >
                  <span className="text-lg">{info.icon}</span>
                  <span className="text-[10px] leading-tight text-muted-foreground">{info.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Description + coords (before start) */}
        {!activeEvent && (
          <>
            <Textarea
              placeholder="Descripción (opcional)"
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              className="text-xs min-h-[60px] resize-none"
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Latitud"
                value={latStr}
                onChange={e => setLatStr(e.target.value)}
                className="text-xs"
                type="number"
                step="any"
              />
              <Input
                placeholder="Longitud"
                value={lngStr}
                onChange={e => setLngStr(e.target.value)}
                className="text-xs"
                type="number"
                step="any"
              />
            </div>
          </>
        )}

        {/* Main action button */}
        {activeEvent ? (
          <div className="space-y-3">
            {/* Active event display */}
            <div className="text-center space-y-2 py-3 rounded-lg bg-primary/5 border border-primary/20">
              <Badge variant="outline" className="text-xs">
                {EVENTO_ICONS[activeEvent.tipo_evento as TipoEventoRuta]?.icon}{' '}
                {EVENTO_ICONS[activeEvent.tipo_evento as TipoEventoRuta]?.label}
              </Badge>
              <div className="text-3xl font-mono font-bold tracking-wider text-primary">
                {formatTime(elapsed)}
              </div>
              {activeEvent.descripcion && (
                <p className="text-xs text-muted-foreground">{activeEvent.descripcion}</p>
              )}
            </div>

            {/* Add photo while active */}
            <div className="flex gap-2">
              <Input
                placeholder="Pegar URL de foto..."
                value={fotoUrl}
                onChange={e => setFotoUrl(e.target.value)}
                className="text-xs"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={handleAddPhoto}
                disabled={!fotoUrl.trim() || addPhoto.isPending}
              >
                <ImageIcon className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Stop button */}
            <Button
              onClick={handleStop}
              disabled={stopEvent.isPending}
              className="w-full gap-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              size="lg"
            >
              <Square className="h-4 w-4 fill-current" />
              Detener Evento
            </Button>
          </div>
        ) : (
          <Button
            onClick={handleStart}
            disabled={startEvent.isPending}
            className="w-full gap-2"
            size="lg"
          >
            <Plus className="h-4 w-4" />
            Iniciar {EVENTO_ICONS[selectedType].icon} {EVENTO_ICONS[selectedType].label}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
