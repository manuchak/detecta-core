/**
 * Modal de detalle completo del checklist - Layout 3 columnas "Dashboard Compacto"
 * Todo visible sin scroll ni cambio de pestaña
 */
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Car,
  Wrench,
  FileText,
  Clock,
  MapPin,
  Phone,
  Check,
  X,
  AlertTriangle,
  Fuel,
  PenLine,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { ServicioConChecklist, NivelCombustible } from '@/types/checklist';
import {
  INSPECCION_ITEMS,
  EQUIPAMIENTO_ITEMS,
  ANGULO_LABELS,
} from '@/types/checklist';
import { GeoValidationBadge } from '@/components/custodian/checklist/GeoValidationBadge';
import { PhotoLightbox } from './PhotoLightbox';

interface ChecklistDetailModalProps {
  servicio: ServicioConChecklist | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const combustibleNiveles: Record<NivelCombustible, number> = {
  lleno: 100,
  '3/4': 75,
  '1/2': 50,
  '1/4': 25,
  vacio: 0,
};

function InspeccionItemCompact({
  label,
  icon,
  value,
}: {
  label: string;
  icon: string;
  value: boolean | null;
}) {
  return (
    <div className="flex items-center gap-1.5 py-0.5">
      {value === true ? (
        <Check className="h-3.5 w-3.5 text-success shrink-0" />
      ) : value === false ? (
        <X className="h-3.5 w-3.5 text-destructive shrink-0" />
      ) : (
        <span className="h-3.5 w-3.5 shrink-0 text-center text-muted-foreground text-xs">—</span>
      )}
      <span className="text-xs">{icon}</span>
      <span className="text-xs truncate">{label}</span>
    </div>
  );
}

export function ChecklistDetailModal({
  servicio,
  open,
  onOpenChange,
}: ChecklistDetailModalProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (!servicio) return null;

  const tieneChecklist = servicio.checklistId !== null;
  const combustibleNivel = servicio.itemsInspeccion?.vehiculo?.nivel_combustible;
  const combustiblePct = combustibleNivel
    ? combustibleNiveles[combustibleNivel]
    : 0;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="max-w-5xl h-[85vh] p-0 !flex !flex-col overflow-hidden [&>button:last-child]:hidden"
          style={{ zoom: 1 }}
        >
          {/* Header compacto */}
          <div className="p-4 pb-3 border-b shrink-0">
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <DialogTitle className="text-base font-semibold truncate">
                  {servicio.nombreCliente}
                </DialogTitle>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
                  <span>Folio: {servicio.idServicio}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {format(new Date(servicio.fechaHoraCita), "d MMM HH:mm", { locale: es })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Car className="h-3 w-3" />
                    {servicio.custodioAsignado}
                    {servicio.custodioTelefono && (
                      <a href={`tel:${servicio.custodioTelefono}`} className="text-primary">
                        <Phone className="h-3 w-3" />
                      </a>
                    )}
                  </span>
                  {servicio.origen && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {servicio.origen} → {servicio.destino || 'N/A'}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {servicio.custodioTelefono && (
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1" asChild>
                    <a
                      href={`https://wa.me/52${servicio.custodioTelefono}?text=Checklist servicio ${servicio.idServicio}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Phone className="h-3 w-3" />
                      WhatsApp
                    </a>
                  </Button>
                )}
                <Badge
                  variant="outline"
                  className={cn(
                    'text-xs shrink-0',
                    servicio.checklistEstado === 'completo'
                      ? 'bg-success/10 text-success'
                      : servicio.checklistEstado === 'sin_checklist'
                      ? 'bg-destructive/10 text-destructive'
                      : 'bg-warning/10 text-warning'
                  )}
                >
                  {servicio.checklistEstado === 'completo'
                    ? 'Completo'
                    : servicio.checklistEstado === 'sin_checklist'
                    ? 'Sin Checklist'
                    : 'Pendiente'}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onOpenChange(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Alertas inline */}
            {servicio.alertas.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {servicio.alertas.map((alerta, i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className={cn(
                      'text-[10px] py-0',
                      alerta.severidad === 'critica'
                        ? 'bg-destructive/10 text-destructive border-destructive/30'
                        : alerta.severidad === 'alta'
                        ? 'bg-orange-500/10 text-orange-600 border-orange-500/30'
                        : 'bg-warning/10 text-warning border-warning/30'
                    )}
                  >
                    <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
                    {alerta.descripcion}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Body */}
          {!tieneChecklist ? (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">
                  El custodio aún no ha completado el checklist pre-servicio
                </p>
                {servicio.custodioTelefono && (
                  <Button variant="outline" className="mt-4" asChild>
                    <a
                      href={`https://wa.me/52${servicio.custodioTelefono}?text=Hola, te recordamos completar el checklist pre-servicio para el servicio ${servicio.idServicio}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      Notificar por WhatsApp
                    </a>
                  </Button>
                )}
              </div>
            </div>
          ) : (
            /* 3 columnas: Fotos | Inspección | Observaciones */
            <div className="flex-1 min-h-0 grid grid-cols-3 gap-0 overflow-hidden">
              {/* Col 1: Fotos */}
              <div className="p-3 border-r overflow-auto">
                <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Fotos
                </h4>
                {servicio.fotosValidadas.length > 0 ? (
                  <div className="grid grid-cols-2 gap-1.5">
                    {servicio.fotosValidadas.map((foto, index) => (
                      <button
                        key={foto.angle}
                        className="relative aspect-[4/3] rounded-md overflow-hidden border hover:ring-2 hover:ring-primary transition-all"
                        onClick={() => setLightboxIndex(index)}
                      >
                        <img
                          src={foto.url || ''}
                          alt={ANGULO_LABELS[foto.angle]}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-1.5 py-1">
                          <p className="text-white text-[10px] font-medium leading-tight">
                            {ANGULO_LABELS[foto.angle]}
                          </p>
                          <GeoValidationBadge
                            validacion={foto.validacion}
                            distancia={foto.distancia_origen_m}
                            className="mt-0.5 scale-75 origin-left"
                          />
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-xs">
                    No hay fotos
                  </div>
                )}
              </div>

              {/* Col 2: Inspección Vehicular + Equipamiento + Combustible */}
              <div className="p-3 border-r overflow-auto">
                <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Inspección Vehicular
                </h4>
                <div className="space-y-0.5">
                  {INSPECCION_ITEMS.map((item) => (
                    <InspeccionItemCompact
                      key={item.key}
                      label={item.label}
                      icon={item.icon}
                      value={
                        servicio.itemsInspeccion?.vehiculo?.[
                          item.key as keyof typeof servicio.itemsInspeccion.vehiculo
                        ] as boolean | null
                      }
                    />
                  ))}
                </div>

                <div className="my-2 border-t" />

                <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Equipamiento
                </h4>
                <div className="space-y-0.5">
                  {EQUIPAMIENTO_ITEMS.map((item) => (
                    <InspeccionItemCompact
                      key={item.key}
                      label={item.label}
                      icon={item.icon}
                      value={
                        servicio.itemsInspeccion?.equipamiento?.[
                          item.key as keyof typeof servicio.itemsInspeccion.equipamiento
                        ] as boolean | null
                      }
                    />
                  ))}
                </div>

                <div className="my-2 border-t" />

                {/* Combustible */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="flex items-center gap-1 text-xs">
                      <Fuel className="h-3 w-3" />
                      Combustible
                    </span>
                    <span className="text-xs font-medium">
                      {combustibleNivel || 'N/A'}
                    </span>
                  </div>
                  <Progress value={combustiblePct} className="h-1.5" />
                </div>
              </div>

              {/* Col 3: Observaciones + Firma */}
              <div className="p-3 overflow-auto">
                <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Observaciones
                </h4>
                {servicio.observaciones ? (
                  <p className="text-xs leading-relaxed">{servicio.observaciones}</p>
                ) : (
                  <p className="text-xs text-muted-foreground italic">
                    Sin observaciones registradas
                  </p>
                )}

                {servicio.firmaBase64 && (
                  <div className="mt-3">
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1 mb-1">
                      <PenLine className="h-2.5 w-2.5" />
                      Firma del Custodio
                    </p>
                    <img
                      src={servicio.firmaBase64}
                      alt="Firma"
                      className="h-14 border rounded bg-white"
                    />
                  </div>
                )}

                {servicio.fechaChecklist && (
                  <p className="text-[10px] text-muted-foreground mt-3">
                    Completado el{' '}
                    {format(
                      new Date(servicio.fechaChecklist),
                      "d 'de' MMMM 'a las' HH:mm",
                      { locale: es }
                    )}
                  </p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Lightbox */}
      <PhotoLightbox
        fotos={servicio.fotosValidadas}
        indexInicial={lightboxIndex ?? 0}
        open={lightboxIndex !== null}
        onOpenChange={(open) => !open && setLightboxIndex(null)}
      />
    </>
  );
}
