/**
 * Visor de fotos fullscreen con navegación swipe y zoom
 */
import { useState, useCallback, useEffect, useRef } from 'react';
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
  ZoomIn,
  ZoomOut,
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
  ok: { icon: Check, label: 'GPS Válido', clase: 'bg-success/20 text-success' },
  fuera_rango: { icon: AlertTriangle, label: 'Fuera de Rango', clase: 'bg-destructive/20 text-destructive' },
  sin_gps: { icon: HelpCircle, label: 'Sin GPS', clase: 'bg-warning/20 text-warning' },
  pendiente: { icon: MapPin, label: 'Pendiente', clase: 'bg-muted text-muted-foreground' },
};

export function PhotoLightbox({
  fotos,
  indexInicial,
  open,
  onOpenChange,
}: PhotoLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(indexInicial);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [zoomed, setZoomed] = useState(false);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  useEffect(() => {
    setCurrentIndex(indexInicial);
    setZoomed(false);
    setPan({ x: 0, y: 0 });
  }, [indexInicial]);

  const currentFoto = fotos[currentIndex];
  const config = currentFoto ? validacionConfig[currentFoto.validacion] : null;
  const Icon = config?.icon;

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % fotos.length);
    setZoomed(false);
    setPan({ x: 0, y: 0 });
  }, [fotos.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + fotos.length) % fotos.length);
    setZoomed(false);
    setPan({ x: 0, y: 0 });
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

  // Touch handlers (swipe only when not zoomed)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (zoomed) return;
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (zoomed || touchStart === null) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      diff > 0 ? goNext() : goPrev();
    }
    setTouchStart(null);
  };

  // Zoom toggle
  const toggleZoom = () => {
    setZoomed((prev) => !prev);
    setPan({ x: 0, y: 0 });
  };

  // Double click zoom
  const handleDoubleClick = () => toggleZoom();

  // Pan handlers (mouse drag when zoomed)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!zoomed) return;
    e.preventDefault();
    setIsDragging(true);
    dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!zoomed || !isDragging) return;
    setPan({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

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
        className="max-w-4xl h-[90vh] p-0 !flex !flex-col overflow-hidden bg-background/95 backdrop-blur [&>button:last-child]:hidden"
        style={{ zoom: 1 }}
      >
        <div
          className="relative h-full flex flex-col min-h-0"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-medium text-sm truncate">
                {ANGULO_LABELS[currentFoto.angle]}
              </span>
              {config && Icon && (
                <Badge variant="outline" className={cn('text-xs shrink-0', config.clase)}>
                  <Icon className="h-3 w-3 mr-1" />
                  {config.label}
                </Badge>
              )}
              {currentFoto.distancia_origen_m !== null && (
                <span className="text-xs text-muted-foreground shrink-0">
                  {formatearDistancia(currentFoto.distancia_origen_m)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={toggleZoom}
                title={zoomed ? 'Reducir' : 'Ampliar'}
              >
                {zoomed ? <ZoomOut className="h-4 w-4" /> : <ZoomIn className="h-4 w-4" />}
              </Button>
              {currentFoto.geotag_lat && currentFoto.geotag_lng && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={openInMaps}
                  title="Ver en mapa"
                >
                  <MapPin className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onOpenChange(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Image container */}
          <div
            className="flex-1 min-h-0 relative flex items-center justify-center overflow-hidden select-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* Navigation buttons */}
            {fotos.length > 1 && !zoomed && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 z-10 h-10 w-10 rounded-full bg-background/80"
                  onClick={goPrev}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 z-10 h-10 w-10 rounded-full bg-background/80"
                  onClick={goNext}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </>
            )}

            <img
              src={currentFoto.url || ''}
              alt={ANGULO_LABELS[currentFoto.angle]}
              className={cn(
                'max-h-full max-w-full object-contain rounded-lg transition-transform duration-200',
                zoomed ? 'cursor-grab active:cursor-grabbing' : 'cursor-zoom-in'
              )}
              style={
                zoomed
                  ? { transform: `scale(2) translate(${pan.x / 2}px, ${pan.y / 2}px)` }
                  : undefined
              }
              onDoubleClick={handleDoubleClick}
              draggable={false}
              loading="lazy"
            />
          </div>

          {/* Footer with thumbnails */}
          <div className="px-4 py-2 border-t shrink-0">
            <div className="flex items-center justify-center gap-1.5">
              {fotos.map((foto, index) => (
                <button
                  key={foto.angle}
                  className={cn(
                    'w-12 h-12 rounded overflow-hidden border-2 transition-all',
                    index === currentIndex
                      ? 'border-primary ring-2 ring-primary/50'
                      : 'border-border opacity-60 hover:opacity-100'
                  )}
                  onClick={() => {
                    setCurrentIndex(index);
                    setZoomed(false);
                    setPan({ x: 0, y: 0 });
                  }}
                >
                  <img
                    src={foto.url || ''}
                    alt={ANGULO_LABELS[foto.angle]}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
            <p className="text-center text-xs text-muted-foreground mt-1">
              {currentIndex + 1} de {fotos.length} · Doble clic para zoom
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
