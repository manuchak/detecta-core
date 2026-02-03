import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  AlertTriangle, 
  Calendar, 
  MapPin, 
  User, 
  FileText,
  Clock,
  ArrowRight,
  Loader2,
  RefreshCw,
  Shield,
} from 'lucide-react';
import { useBajaDetails, type SancionAplicada, type EstatusHistorial } from '../hooks/useBajaDetails';
import { useCambioEstatusOperativo } from '@/hooks/useCambioEstatusOperativo';
import type { BajaProfile } from '../hooks/useOperativeProfiles';

interface BajaDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  custodio: BajaProfile | null;
  onReactivated?: () => void;
}

const CATEGORIA_COLORS: Record<string, string> = {
  'leve': 'bg-yellow-100 text-yellow-800',
  'moderada': 'bg-orange-100 text-orange-800',
  'grave': 'bg-red-100 text-red-800',
  'muy_grave': 'bg-red-200 text-red-900',
};

function SancionCard({ sancion }: { sancion: SancionAplicada }) {
  const categoriaClass = sancion.catalogo_sancion?.categoria 
    ? CATEGORIA_COLORS[sancion.catalogo_sancion.categoria] || 'bg-muted text-muted-foreground'
    : 'bg-muted text-muted-foreground';

  return (
    <div className="border rounded-lg p-4 space-y-3 bg-card">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <span className="font-medium">
            {sancion.catalogo_sancion?.nombre || 'Sanción aplicada'}
          </span>
        </div>
        {sancion.catalogo_sancion?.categoria && (
          <Badge className={categoriaClass}>
            {sancion.catalogo_sancion.categoria}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          <span>Inicio:</span>
          <span className="text-foreground">
            {format(new Date(sancion.fecha_inicio), 'd MMM yyyy', { locale: es })}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span>Días:</span>
          <span className="text-foreground font-medium">{sancion.dias_suspension}</span>
        </div>
      </div>

      {sancion.notas && (
        <div className="text-sm text-muted-foreground bg-muted/50 rounded p-2">
          <FileText className="h-3.5 w-3.5 inline mr-1" />
          {sancion.notas}
        </div>
      )}

      {sancion.servicio_relacionado && (
        <div className="border-t pt-3 space-y-2">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Servicio Incumplido
          </div>
          <div className="bg-destructive/5 rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-medium">
                {sancion.servicio_relacionado.nombre_cliente || 'Cliente no especificado'}
              </span>
              {sancion.servicio_relacionado.id_servicio && (
                <Badge variant="outline" className="text-xs">
                  #{sancion.servicio_relacionado.id_servicio}
                </Badge>
              )}
            </div>
            
            {sancion.servicio_relacionado.fecha_hora_cita && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                {format(new Date(sancion.servicio_relacionado.fecha_hora_cita), "d MMM yyyy 'a las' HH:mm", { locale: es })}
              </div>
            )}
            
            {(sancion.servicio_relacionado.origen || sancion.servicio_relacionado.destino) && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                <span className="truncate">{sancion.servicio_relacionado.origen || '?'}</span>
                <ArrowRight className="h-3 w-3" />
                <span className="truncate">{sancion.servicio_relacionado.destino || '?'}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function HistorialItem({ item }: { item: EstatusHistorial }) {
  return (
    <div className="flex items-start gap-3 text-sm">
      <div className="w-2 h-2 rounded-full bg-muted-foreground mt-1.5 shrink-0" />
      <div className="space-y-1 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-xs">
            {item.estatus_anterior}
          </Badge>
          <ArrowRight className="h-3 w-3 text-muted-foreground" />
          <Badge variant="secondary" className="text-xs">
            {item.estatus_nuevo}
          </Badge>
        </div>
        <p className="text-muted-foreground">{item.motivo}</p>
        {item.notas && (
          <p className="text-xs text-muted-foreground/70 italic">{item.notas}</p>
        )}
        {item.created_at && (
          <p className="text-xs text-muted-foreground">
            {format(new Date(item.created_at), "d MMM yyyy HH:mm", { locale: es })}
          </p>
        )}
      </div>
    </div>
  );
}

export function BajaDetailsDialog({ open, onOpenChange, custodio, onReactivated }: BajaDetailsDialogProps) {
  const { data, isLoading } = useBajaDetails(custodio?.id || null);
  const { cambiarEstatus, isLoading: isReactivating } = useCambioEstatusOperativo();
  const [showReactivar, setShowReactivar] = useState(false);
  const [motivoReactivacion, setMotivoReactivacion] = useState('');

  const handleReactivar = async () => {
    if (!custodio || !motivoReactivacion.trim()) return;

    const success = await cambiarEstatus({
      operativoId: custodio.id,
      operativoTipo: custodio.tipo_personal,
      operativoNombre: custodio.nombre,
      estatusAnterior: 'inactivo',
      estatusNuevo: 'activo',
      tipoCambio: 'reactivacion',
      motivo: motivoReactivacion.trim(),
    });

    if (success) {
      setShowReactivar(false);
      setMotivoReactivacion('');
      onOpenChange(false);
      onReactivated?.();
    }
  };

  const TipoIcon = custodio?.tipo_personal === 'armado' ? Shield : User;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TipoIcon className="h-5 w-5" />
            Detalle de Baja: {custodio?.nombre}
            {custodio?.tipo_personal === 'armado' && (
              <Badge variant="secondary" className="ml-2">Armado</Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(85vh-180px)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-6 pr-4">
              {/* Basic Info */}
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Zona:</span>{' '}
                    <span>{custodio?.zona_base || '-'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Servicios:</span>{' '}
                    <span className="font-medium">{custodio?.numero_servicios || 0}</span>
                  </div>
                  {custodio?.fecha_inactivacion && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Fecha baja:</span>{' '}
                      <span>{format(new Date(custodio.fecha_inactivacion), 'd MMM yyyy', { locale: es })}</span>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Sanciones Section */}
              <div className="space-y-3">
                <h3 className="font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  Sanciones Aplicadas
                  {data?.sanciones.length ? (
                    <Badge variant="destructive" className="text-xs">
                      {data.sanciones.length}
                    </Badge>
                  ) : null}
                </h3>
                
                {data?.sanciones.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">
                    No hay sanciones registradas
                  </p>
                ) : (
                  <div className="space-y-3">
                    {data?.sanciones.map((sancion) => (
                      <SancionCard key={sancion.id} sancion={sancion} />
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              {/* Historial Section */}
              <div className="space-y-3">
                <h3 className="font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Historial de Estatus
                </h3>
                
                {data?.historial.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">
                    No hay cambios de estatus registrados
                  </p>
                ) : (
                  <div className="space-y-4">
                    {data?.historial.map((item) => (
                      <HistorialItem key={item.id} item={item} />
                    ))}
                  </div>
                )}
              </div>

              {/* Reactivation Form */}
              {showReactivar && (
                <>
                  <Separator />
                  <div className="space-y-3 bg-muted/50 rounded-lg p-4">
                    <h3 className="font-medium flex items-center gap-2">
                      <RefreshCw className="h-4 w-4" />
                      Reactivar Operativo
                    </h3>
                    <div className="space-y-2">
                      <Label htmlFor="motivo-reactivacion">Motivo de reactivación *</Label>
                      <Textarea
                        id="motivo-reactivacion"
                        value={motivoReactivacion}
                        onChange={(e) => setMotivoReactivacion(e.target.value)}
                        placeholder="Ej: Reactivación por error en baja masiva"
                        rows={2}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowReactivar(false);
                          setMotivoReactivacion('');
                        }}
                      >
                        Cancelar
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleReactivar}
                        disabled={isReactivating || !motivoReactivacion.trim()}
                      >
                        {isReactivating ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <RefreshCw className="h-4 w-4 mr-2" />
                        )}
                        Confirmar
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </ScrollArea>

        <DialogFooter>
          {!showReactivar && (
            <Button
              variant="outline"
              onClick={() => setShowReactivar(true)}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Reactivar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
