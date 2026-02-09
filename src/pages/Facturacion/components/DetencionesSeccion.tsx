import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  useDetenciones,
  useCrearDetencion,
  useEliminarDetencion,
  TIPOS_DETENCION,
  TipoDetencion,
} from '../hooks/useDetenciones';
import {
  PauseCircle,
  Plus,
  Trash2,
  Clock,
  X,
  Loader2,
} from 'lucide-react';

interface DetencionesSeccionProps {
  servicioId: number;
}

export function DetencionesSeccion({ servicioId }: DetencionesSeccionProps) {
  const { data: detenciones = [], isLoading } = useDetenciones(servicioId);
  const crearMutation = useCrearDetencion();
  const eliminarMutation = useEliminarDetencion();
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [tipo, setTipo] = useState<TipoDetencion>('espera_cliente');
  const [horaInicio, setHoraInicio] = useState('');
  const [horaFin, setHoraFin] = useState('');
  const [motivo, setMotivo] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [cobrableCliente, setCobrableCliente] = useState(false);
  const [pagableCustodio, setPagableCustodio] = useState(false);
  const [montoCliente, setMontoCliente] = useState('');
  const [montoCustodio, setMontoCustodio] = useState('');

  const resetForm = () => {
    setTipo('espera_cliente');
    setHoraInicio('');
    setHoraFin('');
    setMotivo('');
    setUbicacion('');
    setCobrableCliente(false);
    setPagableCustodio(false);
    setMontoCliente('');
    setMontoCustodio('');
    setShowForm(false);
  };

  const handleSubmit = () => {
    if (!horaInicio) return;

    crearMutation.mutate(
      {
        servicio_id: servicioId,
        tipo_detencion: tipo,
        hora_inicio: new Date(horaInicio).toISOString(),
        hora_fin: horaFin ? new Date(horaFin).toISOString() : null,
        motivo,
        ubicacion,
        cobrable_cliente: cobrableCliente,
        pagable_custodio: pagableCustodio,
        monto_cobro_cliente: parseFloat(montoCliente) || 0,
        monto_pago_custodio: parseFloat(montoCustodio) || 0,
      },
      { onSuccess: resetForm }
    );
  };

  const formatDuracion = (min: number | null) => {
    if (min == null) return 'En curso';
    const h = Math.floor(min / 60);
    const m = Math.round(min % 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const totalMinutos = detenciones.reduce((acc, d) => acc + (d.duracion_minutos || 0), 0);
  const totalCobro = detenciones.reduce((acc, d) => acc + (d.cobrable_cliente ? d.monto_cobro_cliente : 0), 0);

  return (
    <Card className="border-border/50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <PauseCircle className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm text-foreground">Detenciones / Estadías</h3>
            {detenciones.length > 0 && (
              <Badge variant="secondary" className="text-[10px]">
                {detenciones.length} • {formatDuracion(totalMinutos)}
              </Badge>
            )}
          </div>
          {!showForm && (
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setShowForm(true)}>
              <Plus className="h-3 w-3 mr-1" />
              Agregar
            </Button>
          )}
        </div>

        {/* Lista de detenciones existentes */}
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : detenciones.length === 0 && !showForm ? (
          <p className="text-xs text-muted-foreground text-center py-3">
            Sin detenciones registradas para este servicio
          </p>
        ) : (
          <div className="space-y-2">
            {detenciones.map((det) => (
              <div
                key={det.id}
                className="flex items-center justify-between gap-3 p-2 rounded-lg bg-muted/30 text-xs"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Badge variant="outline" className="text-[10px] shrink-0">
                    {TIPOS_DETENCION[det.tipo_detencion as TipoDetencion] || det.tipo_detencion}
                  </Badge>
                  <span className="text-muted-foreground shrink-0 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDuracion(det.duracion_minutos)}
                  </span>
                  {det.motivo && (
                    <span className="truncate text-muted-foreground">{det.motivo}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {det.cobrable_cliente && (
                    <Badge className="text-[9px] bg-primary/10 text-primary border-primary/20">
                      {`Cobro: $${Number(det.monto_cobro_cliente).toLocaleString()}`}
                    </Badge>
                  )}
                  {det.pagable_custodio && (
                    <Badge variant="secondary" className="text-[9px]">
                      {`Pago: $${Number(det.monto_pago_custodio).toLocaleString()}`}
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => eliminarMutation.mutate({ id: det.id, servicioId })}
                    disabled={eliminarMutation.isPending}
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Resumen financiero */}
        {detenciones.length > 0 && totalCobro > 0 && (
          <>
            <Separator className="my-2" />
            <div className="flex justify-end text-xs text-muted-foreground gap-4">
              <span>Total cobrable: <strong className="text-foreground">{`$${totalCobro.toLocaleString()}`}</strong></span>
            </div>
          </>
        )}

        {/* Formulario de nueva detención */}
        {showForm && (
          <>
            <Separator className="my-3" />
            <div className="space-y-3 bg-muted/20 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium">Nueva Detención</p>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={resetForm}>
                  <X className="h-3 w-3" />
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-[10px]">Tipo</Label>
                  <Select value={tipo} onValueChange={(v) => setTipo(v as TipoDetencion)}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(TIPOS_DETENCION).map(([key, label]) => (
                        <SelectItem key={key} value={key} className="text-xs">
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">Hora Inicio</Label>
                  <Input
                    type="datetime-local"
                    value={horaInicio}
                    onChange={(e) => setHoraInicio(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">Hora Fin</Label>
                  <Input
                    type="datetime-local"
                    value={horaFin}
                    onChange={(e) => setHoraFin(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[10px]">Motivo</Label>
                  <Textarea
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    placeholder="Motivo de la detención..."
                    className="min-h-[60px] text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">Ubicación</Label>
                  <Input
                    value={ubicacion}
                    onChange={(e) => setUbicacion(e.target.value)}
                    placeholder="Lugar de la detención"
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-2 rounded bg-muted/30">
                  <Switch checked={cobrableCliente} onCheckedChange={setCobrableCliente} />
                  <div className="space-y-1 flex-1">
                    <Label className="text-[10px]">Cobrar a cliente</Label>
                    {cobrableCliente && (
                      <Input
                        type="number"
                        value={montoCliente}
                        onChange={(e) => setMontoCliente(e.target.value)}
                        placeholder="$0.00"
                        className="h-7 text-xs"
                      />
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 p-2 rounded bg-muted/30">
                  <Switch checked={pagableCustodio} onCheckedChange={setPagableCustodio} />
                  <div className="space-y-1 flex-1">
                    <Label className="text-[10px]">Pagar a custodio</Label>
                    {pagableCustodio && (
                      <Input
                        type="number"
                        value={montoCustodio}
                        onChange={(e) => setMontoCustodio(e.target.value)}
                        placeholder="$0.00"
                        className="h-7 text-xs"
                      />
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  size="sm"
                  className="h-7 text-xs"
                  onClick={handleSubmit}
                  disabled={!horaInicio || crearMutation.isPending}
                >
                  {crearMutation.isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : (
                    <Plus className="h-3 w-3 mr-1" />
                  )}
                  Registrar Detención
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
