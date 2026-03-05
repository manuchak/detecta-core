import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Square, Plus, Image as ImageIcon, RotateCcw, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  type TipoEventoRuta,
  EVENTO_ICONS,
  useEventosRuta,
} from '@/hooks/useEventosRuta';
import { toast } from 'sonner';

// Transition events are triggered by Board state changes, not manually
const TRANSITION_TYPES: TipoEventoRuta[] = ['inicio_servicio', 'fin_servicio', 'llegada_destino', 'liberacion_custodio'];

const EVENT_TYPES: TipoEventoRuta[] = [
  'combustible', 'baño', 'descanso',
  'pernocta', 'checkpoint', 'incidencia', 'foto_evidencia', 'otro',
];

const DRAFT_KEY = 'bitacora-draft';

/** Parse "19.4326, -99.1332" or Google Maps link into {lat, lng} */
function parseCoordinates(input: string): { lat: string; lng: string } | null {
  if (!input.trim()) return null;
  // Google Maps @lat,lng format
  const gmaps = input.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (gmaps) return { lat: gmaps[1], lng: gmaps[2] };
  // Plain "lat, lng"
  const plain = input.match(/^\s*(-?\d+\.?\d*)\s*[,\s]\s*(-?\d+\.?\d*)\s*$/);
  if (plain) return { lat: plain[1], lng: plain[2] };
  return null;
}

interface Props {
  servicioId: string | null;
}

export const EventTracker: React.FC<Props> = ({ servicioId }) => {
  const { activeEvent, eventos, startEvent, stopEvent, addPhoto } = useEventosRuta(servicioId);
  const [selectedType, setSelectedType] = useState<TipoEventoRuta>('checkpoint');
  const [descripcion, setDescripcion] = useState('');
  const [fotoUrl, setFotoUrl] = useState('');
  const [coordsInput, setCoordsInput] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [showTimestampOverride, setShowTimestampOverride] = useState(false);
  const [timestampOverride, setTimestampOverride] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  // Load draft from localStorage
  useEffect(() => {
    if (!servicioId) return;
    try {
      const draft = localStorage.getItem(`${DRAFT_KEY}-${servicioId}`);
      if (draft) {
        const d = JSON.parse(draft);
        if (d.selectedType) setSelectedType(d.selectedType);
        if (d.descripcion) setDescripcion(d.descripcion);
        if (d.coordsInput) setCoordsInput(d.coordsInput);
      }
    } catch {}
  }, [servicioId]);

  // Auto-save draft
  useEffect(() => {
    if (!servicioId || activeEvent) return;
    const timeout = setTimeout(() => {
      localStorage.setItem(`${DRAFT_KEY}-${servicioId}`, JSON.stringify({
        selectedType, descripcion, coordsInput,
      }));
    }, 500);
    return () => clearTimeout(timeout);
  }, [servicioId, selectedType, descripcion, coordsInput, activeEvent]);

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
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const handleStart = async () => {
    if (!servicioId) { toast.error('Selecciona un servicio'); return; }
    const parsed = parseCoordinates(coordsInput);
    try {
      await startEvent.mutateAsync({
        tipo: selectedType,
        descripcion: descripcion || undefined,
        lat: parsed ? parseFloat(parsed.lat) : undefined,
        lng: parsed ? parseFloat(parsed.lng) : undefined,
      });
      setDescripcion('');
      setCoordsInput('');
      setShowTimestampOverride(false);
      setTimestampOverride('');
      localStorage.removeItem(`${DRAFT_KEY}-${servicioId}`);
      toast.success(`${EVENTO_ICONS[selectedType].icon} ${EVENTO_ICONS[selectedType].label} iniciado`);
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

  // Repeat last event
  const handleRepeatLast = useCallback(() => {
    if (eventos.length === 0) return;
    const last = [...eventos].reverse()[0];
    setSelectedType(last.tipo_evento as TipoEventoRuta);
    if (last.lat && last.lng) {
      setCoordsInput(`${last.lat}, ${last.lng}`);
    }
    if (last.descripcion) setDescripcion(last.descripcion);
  }, [eventos]);

  // Keyboard shortcuts: 1-9,0 for type, Enter to start, Esc to cancel
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable
      ) return;
      if (activeEvent) return;

      const hasDialog = document.body.dataset.dialogOpen === '1' ||
        !!document.querySelector('[role="dialog"][data-state="open"]');
      if (hasDialog) return;

      // 1-9, 0 for event types
      const num = parseInt(e.key);
      if (!isNaN(num) && num >= 0 && num <= 9) {
        const idx = num === 0 ? 9 : num - 1;
        if (idx < EVENT_TYPES.length) {
          e.preventDefault();
          setSelectedType(EVENT_TYPES[idx]);
        }
      }
      if (e.key === 'Enter') { e.preventDefault(); handleStart(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activeEvent, handleStart]);

  if (!servicioId) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center text-muted-foreground text-sm">
        Selecciona un servicio para registrar eventos
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Active event: counter + stop */}
      {activeEvent ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3 rounded-lg bg-primary/5 border border-primary/20 p-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">
                {EVENTO_ICONS[activeEvent.tipo_evento as TipoEventoRuta]?.icon}
              </span>
              <div>
                <span className="text-sm font-semibold">
                  {EVENTO_ICONS[activeEvent.tipo_evento as TipoEventoRuta]?.label}
                </span>
                {activeEvent.descripcion && (
                  <p className="text-[11px] text-muted-foreground">{activeEvent.descripcion}</p>
                )}
              </div>
            </div>
            <span className="text-2xl font-mono font-bold tracking-wider text-primary tabular-nums">
              {formatTime(elapsed)}
            </span>
          </div>

          {/* Add photo while active */}
          <div className="flex gap-2">
            <Input
              placeholder="Pegar URL de foto..."
              value={fotoUrl}
              onChange={e => setFotoUrl(e.target.value)}
              className="text-xs h-8"
              onKeyDown={e => e.key === 'Enter' && handleAddPhoto()}
            />
            <Button
              size="sm"
              variant="outline"
              className="h-8 px-2"
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
            Detener
          </Button>
        </div>
      ) : (
        <>
          {/* Type selector — single horizontal row */}
          <div className="flex gap-1 overflow-x-auto pb-1">
            {EVENT_TYPES.map((type, idx) => {
              const info = EVENTO_ICONS[type];
              const isSelected = selectedType === type;
              return (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  title={`${info.label} [${idx === 9 ? 0 : idx + 1}]`}
                  className={cn(
                    'flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-md transition-all border shrink-0',
                    isSelected
                      ? 'border-primary bg-primary/10 shadow-sm'
                      : 'border-transparent hover:bg-muted/50'
                  )}
                >
                  <span className="text-base leading-none">{info.icon}</span>
                  <span className="text-[9px] leading-tight text-muted-foreground whitespace-nowrap">{info.label}</span>
                </button>
              );
            })}
          </div>

          {/* Inline inputs row */}
          <div className="flex gap-2">
            <Input
              placeholder="Descripción..."
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              className="text-xs h-8 flex-1"
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleStart()}
            />
            <Input
              placeholder="19.43, -99.13 o link"
              value={coordsInput}
              onChange={e => setCoordsInput(e.target.value)}
              className="text-xs h-8 w-[160px]"
              onKeyDown={e => e.key === 'Enter' && handleStart()}
            />
            <Input
              placeholder="URL foto"
              value={fotoUrl}
              onChange={e => setFotoUrl(e.target.value)}
              className="text-xs h-8 w-[120px]"
              onKeyDown={e => e.key === 'Enter' && handleStart()}
            />
          </div>

          {/* Timestamp override toggle */}
          {showTimestampOverride ? (
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <Input
                type="time"
                step="1"
                value={timestampOverride}
                onChange={e => setTimestampOverride(e.target.value)}
                className="text-xs h-7 w-[120px]"
                placeholder="HH:MM"
              />
              <button
                onClick={() => { setShowTimestampOverride(false); setTimestampOverride(''); }}
                className="text-[10px] text-muted-foreground hover:text-foreground"
              >
                cancelar
              </button>
            </div>
          ) : null}

          {/* Action row */}
          <div className="flex gap-2">
            <Button
              onClick={handleStart}
              disabled={startEvent.isPending}
              className="flex-1 gap-2"
              size="lg"
            >
              <Plus className="h-4 w-4" />
              {EVENTO_ICONS[selectedType].icon} {EVENTO_ICONS[selectedType].label}
            </Button>
            
            <div className="flex gap-1">
              {eventos.length > 0 && (
                <Button
                  variant="outline"
                  size="lg"
                  className="px-3 gap-1"
                  onClick={handleRepeatLast}
                  title="Repetir último evento"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="lg"
                className="px-2"
                onClick={() => setShowTimestampOverride(!showTimestampOverride)}
                title="Hora real del evento"
              >
                <Clock className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
