/**
 * Visor de fotos fullscreen con navegación swipe
 */
import { useState, useCallback, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ChevronLeft,
  ChevronRight,
  X,
  MapPin,
  ExternalLink,
  Check,
  AlertTriangle,
  HelpCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FotoValidada } from '@/types/checklist';
import { ANGULO_LABELS } from '@/types/checklist';
import { formatearDistancia } from '@/lib/geoUtils';

interface PhotoLightboxProps {
  fotos: FotoValidada[];
  indexInicial: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const validacionConfig = {
  ok: {
    icon: Check,
    label: 'GPS Válido',
    clase: 'bg-success/20 text-success',
  },
  fuera_rango: {
    icon: AlertTriangle,
    label: 'Fuera de Rango',
    clase: 'bg-destructive/20 text-destructive',
  },
  sin_gps: {
    icon: HelpCircle,
    label: 'Sin GPS',
    clase: 'bg-warning/20 text-warning',
  },
  pendiente: {
    icon: MapPin,
    label: 'Pendiente',
    clase: 'bg-muted text-muted-foreground',
  },
};

export function PhotoLightbox({
  fotos,
  indexInicial,
  open,
  onOpenChange,
}: PhotoLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(indexInicial);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  useEffect(() => {
    setCurrentIndex(indexInicial);
  }, [indexInicial]);

  const currentFoto = fotos[currentIndex];
  const config = currentFoto ? validacionConfig[currentFoto.validacion] : null;
  const Icon = config?.icon;

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % fotos.length);
  }, [fotos.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + fotos.length) % fotos.length);
  }, [fotos.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'Escape') onOpenChange(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, goNext, goPrev, onOpenChange]);

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      diff > 0 ? goNext() : goPrev();
    }
    setTouchStart(null);
  };

  const openInMaps = () => {
    if (currentFoto?.geotag_lat && currentFoto?.geotag_lng) {
      window.open(
        `https://www.google.com/maps?q=${currentFoto.geotag_lat},${currentFoto.geotag_lng}`,
        '_blank'
      );
    }
  };

  if (!currentFoto) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-4xl h-[90vh] p-0 bg-background/95 backdrop-blur [&>button:last-child]:hidden"
        style={{ zoom: 1 }}
      >
        <div
          className="relative h-full flex flex-col"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b shrink-0">
            <div className="flex items-center gap-3">
              <span className="font-medium">
                {ANGULO_LABELS[currentFoto.angle]}
              </span>
              {config && Icon && (
                <Badge variant="outline" className={cn('text-xs', config.clase)}>
                  <Icon className="h-3 w-3 mr-1" />
                  {config.label}
                </Badge>
              )}
              {currentFoto.distancia_origen_m !== null && (
                <span className="text-sm text-muted-foreground">
                  {formatearDistancia(currentFoto.distancia_origen_m)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {currentFoto.geotag_lat && currentFoto.geotag_lng && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openInMaps}
                  className="gap-1"
                >
                  <MapPin className="h-4 w-4" />
                  Ver en mapa
                  <ExternalLink className="h-3 w-3" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Image container - min-h-0 constrains flex child */}
          <div className="flex-1 min-h-0 relative flex items-center justify-center p-4 overflow-hidden">
            {/* Navigation buttons */}
            {fotos.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 z-10 h-12 w-12 rounded-full bg-background/80"
                  onClick={goPrev}
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 z-10 h-12 w-12 rounded-full bg-background/80"
                  onClick={goNext}
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
              </>
            )}

            {/* Image */}
            <img
              src={currentFoto.url || ''}
              alt={ANGULO_LABELS[currentFoto.angle]}
              className="max-h-full max-w-full object-contain rounded-lg"
              loading="lazy"
            />
          </div>

          {/* Footer with thumbnails */}
          <div className="p-4 border-t shrink-0">
            <div className="flex items-center justify-center gap-2">
              {fotos.map((foto, index) => (
                <button
                  key={foto.angle}
                  className={cn(
                    'w-16 h-16 rounded-md overflow-hidden border-2 transition-all',
                    index === currentIndex
                      ? 'border-primary ring-2 ring-primary/50'
                      : 'border-border opacity-60 hover:opacity-100'
                  )}
                  onClick={() => setCurrentIndex(index)}
                >
                  <img
                    src={foto.url || ''}
                    alt={ANGULO_LABELS[foto.angle]}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
            <p className="text-center text-sm text-muted-foreground mt-2">
              {currentIndex + 1} de {fotos.length}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
