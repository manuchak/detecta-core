import React from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Coffee, Bath, Eye, Sunrise, Loader2 } from 'lucide-react';
import { getPauseLabel, getPauseDurationMinutes } from '@/hooks/useMonitoristaPause';
import type { TipoPausa, PausaActiva } from '@/hooks/useMonitoristaPause';

const PAUSE_ICONS: Record<TipoPausa, React.ReactNode> = {
  desayuno: <Sunrise className="h-16 w-16" />,
  comida: <Coffee className="h-16 w-16" />,
  bano: <Bath className="h-16 w-16" />,
  descanso: <Eye className="h-16 w-16" />,
};

interface PauseOverlayProps {
  pausaActiva: PausaActiva;
  segundosRestantes: number | null;
  excedido: boolean;
  onRetomar: () => void;
  isRetomando: boolean;
}

export const PauseOverlay: React.FC<PauseOverlayProps> = ({
  pausaActiva,
  segundosRestantes,
  excedido,
  onRetomar,
  isRetomando,
}) => {
  const tipo = pausaActiva.tipo_pausa as TipoPausa;
  const totalSeconds = getPauseDurationMinutes(tipo) * 60;

  // Format countdown
  const absSeconds = Math.abs(segundosRestantes ?? 0);
  const minutes = Math.floor(absSeconds / 60);
  const seconds = absSeconds % 60;
  const timeDisplay = `${excedido ? '+' : ''}${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // Progress: 100% when just started → 0% when time is up
  const progressValue = segundosRestantes !== null
    ? Math.max(0, Math.min(100, (segundosRestantes / totalSeconds) * 100))
    : 0;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-background/80 rounded-lg">
      <div className="flex flex-col items-center gap-6 max-w-sm text-center px-6">
        {/* Icon */}
        <div className={`p-6 rounded-full ${excedido ? 'bg-destructive/10 text-destructive animate-pulse' : 'bg-primary/10 text-primary'}`}>
          {PAUSE_ICONS[tipo]}
        </div>

        {/* Title */}
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-foreground">
            Pausa de {getPauseLabel(tipo).toLowerCase()}
          </h2>
          <p className="text-sm text-muted-foreground">
            {excedido
              ? 'Tu tiempo de pausa ha sido excedido'
              : 'Tus servicios están siendo atendidos por el equipo en turno'}
          </p>
        </div>

        {/* Countdown */}
        <div className={`font-mono text-5xl font-bold tracking-wider tabular-nums ${excedido ? 'text-destructive' : 'text-foreground'}`}>
          {timeDisplay}
        </div>

        {/* Progress bar */}
        <div className="w-full max-w-xs">
          <Progress
            value={excedido ? 100 : progressValue}
            className={`h-2 ${excedido ? '[&>div]:bg-destructive' : ''}`}
          />
          <p className="text-[10px] text-muted-foreground mt-1.5">
            {excedido
              ? 'Por favor retoma tu turno lo antes posible'
              : `${getPauseDurationMinutes(tipo)} min autorizados`}
          </p>
        </div>

        {/* Resume button */}
        <Button
          size="lg"
          onClick={onRetomar}
          disabled={isRetomando}
          className={excedido ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground' : ''}
        >
          {isRetomando ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Retomando…
            </>
          ) : (
            'Retomar mis servicios'
          )}
        </Button>
      </div>
    </div>
  );
};
