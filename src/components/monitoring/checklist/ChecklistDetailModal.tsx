/**
 * Modal de detalle completo del checklist de un servicio
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
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
        <DialogContent className="max-w-3xl max-h-[90vh] p-0">
          <DialogHeader className="p-6 pb-0">
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle className="text-xl">
                  {servicio.nombreCliente}
                </DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Folio: {servicio.idServicio}
                </p>
              </div>
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
                  ? 'Checklist Completo'
                  : servicio.checklistEstado === 'sin_checklist'
                  ? 'Sin Checklist'
                  : 'Checklist Pendiente'}
              </Badge>
            </div>
          </DialogHeader>

          <ScrollArea className="max-h-[calc(90vh-100px)]">
            <div className="p-6 pt-4 space-y-6">
              {/* Info del servicio */}
              <Card>
                <CardContent className="p-4 grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Cita</p>
                      <p className="text-sm font-medium">
                        {format(
                          new Date(servicio.fechaHoraCita),
                          "d MMM yyyy 'a las' HH:mm",
                          { locale: es }
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Car className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Custodio</p>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">
                          {servicio.custodioAsignado}
                        </p>
                        {servicio.custodioTelefono && (
                          <a
                            href={`tel:${servicio.custodioTelefono}`}
                            className="text-primary"
                          >
                            <Phone className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                  {servicio.origen && (
                    <div className="flex items-center gap-2 col-span-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Ruta</p>
                        <p className="text-sm">
                          {servicio.origen} → {servicio.destino || 'N/A'}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Alertas activas */}
              {servicio.alertas.length > 0 && (
                <Card className="border-orange-500/30 bg-orange-500/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2 text-orange-600 dark:text-orange-400">
                      <AlertTriangle className="h-4 w-4" />
                      Alertas Detectadas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ul className="space-y-1">
                      {servicio.alertas.map((alerta, i) => (
                        <li
                          key={i}
                          className="text-sm flex items-start gap-2"
                        >
                          <span
                            className={cn(
                              'w-2 h-2 rounded-full mt-1.5',
                              alerta.severidad === 'critica'
                                ? 'bg-destructive'
                                : alerta.severidad === 'alta'
                                ? 'bg-orange-500'
                                : 'bg-warning'
                            )}
                          />
                          <span>{alerta.descripcion}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {!tieneChecklist ? (
                <Card className="border-dashed">
                  <CardContent className="p-8 text-center">
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
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Galería de fotos */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Camera className="h-4 w-4" />
                        Evidencia Fotográfica ({servicio.fotosCount}/4)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
                          <div className="col-span-4 text-center py-8 text-muted-foreground">
                            No hay fotos registradas
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Inspección vehicular */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Car className="h-4 w-4" />
                        Inspección Vehicular
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
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

                      {/* Nivel de combustible */}
                      <div className="mt-4 p-3 rounded-md border bg-muted/30">
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
                    </CardContent>
                  </Card>

                  {/* Equipamiento */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Wrench className="h-4 w-4" />
                        Equipamiento de Emergencia
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
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
                    </CardContent>
                  </Card>

                  {/* Observaciones y firma */}
                  {(servicio.observaciones || servicio.firmaBase64) && (
                    <Card>
                      <CardContent className="p-4 space-y-4">
                        {servicio.observaciones && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">
                              Observaciones
                            </p>
                            <p className="text-sm">{servicio.observaciones}</p>
                          </div>
                        )}
                        {servicio.firmaBase64 && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                              <PenLine className="h-3 w-3" />
                              Firma del Custodio
                            </p>
                            <img
                              src={servicio.firmaBase64}
                              alt="Firma"
                              className="h-16 border rounded bg-white"
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Metadata */}
                  {servicio.fechaChecklist && (
                    <Separator />
                  )}
                  {servicio.fechaChecklist && (
                    <p className="text-xs text-muted-foreground text-center">
                      Checklist completado el{' '}
                      {format(
                        new Date(servicio.fechaChecklist),
                        "d 'de' MMMM 'a las' HH:mm",
                        { locale: es }
                      )}
                    </p>
                  )}
                </>
              )}
            </div>
          </ScrollArea>
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