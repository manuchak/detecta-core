/**
 * Modal de detalle completo del checklist de un servicio
 * Layout con Tabs para eliminar scroll excesivo
 */
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Camera,
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
  MessageSquare,
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

function InspeccionItem({
  label,
  icon,
  value,
}: {
  label: string;
  icon: string;
  value: boolean | null;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 p-2 rounded-md border',
        value === true
          ? 'bg-success/5 border-success/20'
          : value === false
          ? 'bg-destructive/5 border-destructive/20'
          : 'bg-muted/50 border-border'
      )}
    >
      <span className="text-lg">{icon}</span>
      <span className="flex-1 text-sm">{label}</span>
      {value === true && <Check className="h-4 w-4 text-success" />}
      {value === false && <X className="h-4 w-4 text-destructive" />}
      {value === null && (
        <span className="text-xs text-muted-foreground">N/A</span>
      )}
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
        <DialogContent className="max-w-3xl h-[85vh] p-0 flex flex-col [&>button:last-child]:hidden" style={{ zoom: 1 }}>
          {/* Fixed header */}
          <div className="p-6 pb-4 border-b shrink-0">
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle className="text-xl">
                  {servicio.nombreCliente}
                </DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Folio: {servicio.idServicio}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={cn(
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
                  className="h-8 w-8"
                  onClick={() => onOpenChange(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Service info row */}
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {format(new Date(servicio.fechaHoraCita), "d MMM HH:mm", { locale: es })}
              </span>
              <span className="flex items-center gap-1">
                <Car className="h-3.5 w-3.5" />
                {servicio.custodioAsignado}
                {servicio.custodioTelefono && (
                  <a href={`tel:${servicio.custodioTelefono}`} className="text-primary ml-1">
                    <Phone className="h-3 w-3" />
                  </a>
                )}
              </span>
              {servicio.origen && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {servicio.origen} → {servicio.destino || 'N/A'}
                </span>
              )}
            </div>

            {/* Alerts inline */}
            {servicio.alertas.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {servicio.alertas.map((alerta, i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className={cn(
                      'text-xs',
                      alerta.severidad === 'critica'
                        ? 'bg-destructive/10 text-destructive border-destructive/30'
                        : alerta.severidad === 'alta'
                        ? 'bg-orange-500/10 text-orange-600 border-orange-500/30'
                        : 'bg-warning/10 text-warning border-warning/30'
                    )}
                  >
                    <AlertTriangle className="h-3 w-3 mr-1" />
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
            <Tabs defaultValue="fotos" className="flex-1 min-h-0 flex flex-col">
              <TabsList className="mx-6 mt-4 shrink-0 self-start">
                <TabsTrigger value="fotos" className="gap-1.5">
                  <Camera className="h-3.5 w-3.5" />
                  Fotos
                </TabsTrigger>
                <TabsTrigger value="inspeccion" className="gap-1.5">
                  <Car className="h-3.5 w-3.5" />
                  Inspección
                </TabsTrigger>
                <TabsTrigger value="observaciones" className="gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5" />
                  Observaciones
                </TabsTrigger>
              </TabsList>

              {/* Tab: Fotos */}
              <TabsContent value="fotos" className="flex-1 min-h-0 overflow-auto p-6 pt-4 mt-0">
                <div className="grid grid-cols-2 gap-3">
                  {servicio.fotosValidadas.length > 0 ? (
                    servicio.fotosValidadas.map((foto, index) => (
                      <button
                        key={foto.angle}
                        className="relative aspect-square rounded-lg overflow-hidden border hover:ring-2 hover:ring-primary transition-all"
                        onClick={() => setLightboxIndex(index)}
                      >
                        <img
                          src={foto.url || ''}
                          alt={ANGULO_LABELS[foto.angle]}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                          <p className="text-white text-xs font-medium">
                            {ANGULO_LABELS[foto.angle]}
                          </p>
                          <GeoValidationBadge
                            validacion={foto.validacion}
                            distancia={foto.distancia_origen_m}
                            className="mt-1"
                          />
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="col-span-2 text-center py-12 text-muted-foreground">
                      No hay fotos registradas
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Tab: Inspección (vehicular + combustible + equipamiento) */}
              <TabsContent value="inspeccion" className="flex-1 min-h-0 overflow-auto p-6 pt-4 mt-0 space-y-5">
                {/* Inspección vehicular */}
                <div>
                  <h4 className="text-sm font-medium flex items-center gap-2 mb-3">
                    <Car className="h-4 w-4 text-muted-foreground" />
                    Inspección Vehicular
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {INSPECCION_ITEMS.map((item) => (
                      <InspeccionItem
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
                </div>

                {/* Combustible */}
                <div className="p-3 rounded-md border bg-muted/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="flex items-center gap-2 text-sm">
                      <Fuel className="h-4 w-4" />
                      Nivel de Combustible
                    </span>
                    <span className="text-sm font-medium">
                      {combustibleNivel || 'N/A'}
                    </span>
                  </div>
                  <Progress value={combustiblePct} className="h-2" />
                </div>

                {/* Equipamiento */}
                <div>
                  <h4 className="text-sm font-medium flex items-center gap-2 mb-3">
                    <Wrench className="h-4 w-4 text-muted-foreground" />
                    Equipamiento de Emergencia
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {EQUIPAMIENTO_ITEMS.map((item) => (
                      <InspeccionItem
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
                </div>
              </TabsContent>

              {/* Tab: Observaciones */}
              <TabsContent value="observaciones" className="flex-1 min-h-0 overflow-auto p-6 pt-4 mt-0 space-y-4">
                {servicio.observaciones ? (
                  <div className="p-4 rounded-lg border bg-muted/30">
                    <p className="text-xs text-muted-foreground mb-2">Observaciones</p>
                    <p className="text-sm">{servicio.observaciones}</p>
                  </div>
                ) : (
                  <div className="p-4 rounded-lg border border-dashed text-center text-muted-foreground text-sm">
                    Sin observaciones registradas
                  </div>
                )}

                {servicio.firmaBase64 && (
                  <div className="p-4 rounded-lg border bg-muted/30">
                    <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                      <PenLine className="h-3 w-3" />
                      Firma del Custodio
                    </p>
                    <img
                      src={servicio.firmaBase64}
                      alt="Firma"
                      className="h-20 border rounded bg-white"
                    />
                  </div>
                )}

                {servicio.fechaChecklist && (
                  <p className="text-xs text-muted-foreground text-center pt-2">
                    Checklist completado el{' '}
                    {format(
                      new Date(servicio.fechaChecklist),
                      "d 'de' MMMM 'a las' HH:mm",
                      { locale: es }
                    )}
                  </p>
                )}
              </TabsContent>
            </Tabs>
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
