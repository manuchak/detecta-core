import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle, XCircle, ExternalLink, Loader2, DollarSign, AlertTriangle, User, Clock, History } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { TIPOS_APOYO_CUSTODIO, parseComprobantes } from '@/hooks/useCustodianExpenses';
import { cn } from '@/lib/utils';

export const QUERY_KEY_APROBACION = 'aprobacion-gastos';

interface Solicitud {
  id: string;
  custodio_nombre: string | null;
  cliente_nombre: string | null;
  tipo_apoyo: string;
  motivo: string;
  monto_solicitado: number;
  monto_aprobado: number | null;
  estado: string | null;
  urgencia: string | null;
  comprobante_url: string | null;
  notas: string | null;
  created_at: string | null;
  id_servicio: string | null;
  servicio_custodia_id: number | null;
  motivo_rechazo: string | null;
}

const urgenciaColors: Record<string, string> = {
  critica: 'bg-destructive text-destructive-foreground',
  alta: 'bg-orange-500 text-white',
  normal: 'bg-secondary text-secondary-foreground',
  baja: 'bg-muted text-muted-foreground',
};

type SubTab = 'pendientes' | 'historico';

interface ModeConfig {
  pendingEstado: string;
  approveTarget: string;
  rejectTarget: string;
  approveLabel: string;
  rejectLabel: string;
  historicoOptions: { value: string; label: string }[];
  defaultHistorico: string;
  countQueryKey: string;
  emptyPendingMsg: string;
}

const MODE_CONFIG: Record<'ops' | 'finanzas', ModeConfig> = {
  ops: {
    pendingEstado: 'pendiente',
    approveTarget: 'aprobado',
    rejectTarget: 'rechazado',
    approveLabel: 'Aprobar',
    rejectLabel: 'Rechazar',
    historicoOptions: [
      { value: 'aprobado', label: 'Aprobados' },
      { value: 'rechazado', label: 'Rechazados' },
      { value: 'todos', label: 'Todos' },
    ],
    defaultHistorico: 'aprobado',
    countQueryKey: 'gastos-pendientes-count',
    emptyPendingMsg: 'No hay solicitudes pendientes — ¡todo al día!',
  },
  finanzas: {
    pendingEstado: 'aprobado',
    approveTarget: 'autorizado',
    rejectTarget: 'rechazado_finanzas',
    approveLabel: 'Autorizar Pago',
    rejectLabel: 'Rechazar',
    historicoOptions: [
      { value: 'autorizado', label: 'Autorizados' },
      { value: 'rechazado_finanzas', label: 'Rechazados Finanzas' },
      { value: 'pagado', label: 'Pagados' },
      { value: 'todos', label: 'Todos' },
    ],
    defaultHistorico: 'autorizado',
    countQueryKey: 'gastos-pendientes-finanzas-count',
    emptyPendingMsg: 'No hay solicitudes aprobadas por Ops pendientes de autorización.',
  },
};

const estadoBadgeVariant = (estado: string | null): 'default' | 'secondary' | 'destructive' | 'outline' | 'success' => {
  switch (estado) {
    case 'pendiente': return 'secondary';
    case 'aprobado': return 'default';
    case 'autorizado': return 'success';
    case 'pagado': return 'success';
    case 'rechazado':
    case 'rechazado_finanzas': return 'destructive';
    default: return 'outline';
  }
};

const estadoLabel = (estado: string | null): string => {
  switch (estado) {
    case 'rechazado_finanzas': return 'Rechazado Finanzas';
    case 'autorizado': return 'Autorizado';
    default: return estado || '-';
  }
};

interface Props {
  mode?: 'ops' | 'finanzas';
}

const AprobacionGastosPanel = ({ mode = 'ops' }: Props) => {
  const config = MODE_CONFIG[mode];
  const [subTab, setSubTab] = useState<SubTab>('pendientes');
  const [filtroHistorico, setFiltroHistorico] = useState(config.defaultHistorico);
  const [selectedSolicitud, setSelectedSolicitud] = useState<Solicitud | null>(null);
  const [montoAprobado, setMontoAprobado] = useState('');
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const queryClient = useQueryClient();

  const estadoFiltro = subTab === 'pendientes' ? config.pendingEstado : filtroHistorico;

  const { data: solicitudes, isLoading } = useQuery({
    queryKey: [QUERY_KEY_APROBACION, mode, estadoFiltro],
    queryFn: async () => {
      let query = supabase
        .from('solicitudes_apoyo_extraordinario')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (estadoFiltro !== 'todos') {
        query = query.eq('estado', estadoFiltro);
      } else {
        // For histórico "todos", filter only relevant states for this mode
        const relevantStates = config.historicoOptions
          .map(o => o.value)
          .filter(v => v !== 'todos');
        query = query.in('estado', relevantStates);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as Solicitud[];
    },
  });

  const aprobarMutation = useMutation({
    mutationFn: async ({ id, monto }: { id: string; monto: number }) => {
      const { data: user } = await supabase.auth.getUser();
      const updateData: Record<string, unknown> = {
        estado: config.approveTarget,
        monto_aprobado: monto,
      };
      if (mode === 'ops') {
        updateData.aprobado_por = user.user?.id;
        updateData.fecha_aprobacion = new Date().toISOString();
      }
      const { error } = await supabase
        .from('solicitudes_apoyo_extraordinario')
        .update(updateData)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY_APROBACION] });
      queryClient.invalidateQueries({ queryKey: [config.countQueryKey] });
      queryClient.invalidateQueries({ queryKey: ['gastos-pendientes-count'] });
      queryClient.invalidateQueries({ queryKey: ['gastos-pendientes-finanzas-count'] });
      toast.success(mode === 'finanzas' ? 'Pago autorizado' : 'Solicitud aprobada');
      setSelectedSolicitud(null);
    },
    onError: () => toast.error('Error al procesar'),
  });

  const rechazarMutation = useMutation({
    mutationFn: async ({ id, motivo }: { id: string; motivo: string }) => {
      const { data: user } = await supabase.auth.getUser();
      const updateData: Record<string, unknown> = {
        estado: config.rejectTarget,
        motivo_rechazo: motivo,
      };
      if (mode === 'ops') {
        updateData.aprobado_por = user.user?.id;
        updateData.fecha_aprobacion = new Date().toISOString();
      }
      const { error } = await supabase
        .from('solicitudes_apoyo_extraordinario')
        .update(updateData)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY_APROBACION] });
      queryClient.invalidateQueries({ queryKey: [config.countQueryKey] });
      queryClient.invalidateQueries({ queryKey: ['gastos-pendientes-count'] });
      queryClient.invalidateQueries({ queryKey: ['gastos-pendientes-finanzas-count'] });
      toast.success('Solicitud rechazada');
      setSelectedSolicitud(null);
    },
    onError: () => toast.error('Error al rechazar'),
  });

  const handleOpenDetail = (s: Solicitud) => {
    setSelectedSolicitud(s);
    setMontoAprobado(String(s.monto_aprobado ?? s.monto_solicitado));
    setMotivoRechazo('');
  };

  const isPendingState = (s: Solicitud) => s.estado === config.pendingEstado;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        {/* Sub-tab toggle */}
        <div className="inline-flex rounded-lg border border-border/50 bg-muted/30 p-0.5">
          <button
            onClick={() => setSubTab('pendientes')}
            className={cn(
              'px-3 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-1.5',
              subTab === 'pendientes'
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Clock className="w-3.5 h-3.5" />
            Pendientes
            {solicitudes && subTab === 'pendientes' && solicitudes.length > 0 && (
              <Badge variant="destructive" className="ml-1 text-[10px] px-1.5 py-0">{solicitudes.length}</Badge>
            )}
          </button>
          <button
            onClick={() => setSubTab('historico')}
            className={cn(
              'px-3 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-1.5',
              subTab === 'historico'
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <History className="w-3.5 h-3.5" />
            Histórico
          </button>
        </div>

        {/* Filter only for histórico */}
        {subTab === 'historico' && (
          <Select value={filtroHistorico} onValueChange={setFiltroHistorico}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {config.historicoOptions.map(o => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : !solicitudes?.length ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {subTab === 'pendientes'
              ? config.emptyPendingMsg
              : `No hay solicitudes ${filtroHistorico !== 'todos' ? `en estado "${filtroHistorico}"` : ''}`}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {solicitudes.map((s) => {
            const tipoLabel = TIPOS_APOYO_CUSTODIO.find(t => t.value === s.tipo_apoyo)?.label || s.tipo_apoyo;
            return (
              <Card key={s.id} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => handleOpenDetail(s)}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-semibold text-sm">{tipoLabel}</span>
                        {s.urgencia && s.urgencia !== 'normal' && (
                          <Badge className={urgenciaColors[s.urgencia] || ''} variant="secondary">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            {s.urgencia}
                          </Badge>
                        )}
                        <Badge variant={estadoBadgeVariant(s.estado)}>
                          {estadoLabel(s.estado)}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1 mb-1">{s.motivo}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {s.custodio_nombre || 'Sin nombre'}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          ${s.monto_solicitado.toLocaleString('es-MX')}
                        </span>
                        {s.monto_aprobado != null && s.estado !== 'pendiente' && (
                          <span className="text-xs font-medium text-foreground">
                            Aprobado: ${s.monto_aprobado.toLocaleString('es-MX')}
                          </span>
                        )}
                        {s.created_at && (
                          <span>{format(new Date(s.created_at), 'dd MMM HH:mm', { locale: es })}</span>
                        )}
                      </div>
                    </div>
                    {parseComprobantes(s.comprobante_url).length > 0 && (
                      <div className="flex -space-x-1.5 shrink-0">
                        {parseComprobantes(s.comprobante_url).slice(0, 3).map((url, i) => (
                          <div key={i} className="w-10 h-10 rounded bg-muted overflow-hidden border-2 border-background">
                            <img src={url} alt="" className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Detail dialog */}
      <Dialog open={!!selectedSolicitud} onOpenChange={(v) => !v && setSelectedSolicitud(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {selectedSolicitud && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {TIPOS_APOYO_CUSTODIO.find(t => t.value === selectedSolicitud.tipo_apoyo)?.label || selectedSolicitud.tipo_apoyo}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-muted-foreground">Custodio:</span> <br/>{selectedSolicitud.custodio_nombre || '-'}</div>
                  <div><span className="text-muted-foreground">Monto solicitado:</span> <br/><strong>${selectedSolicitud.monto_solicitado.toLocaleString('es-MX')}</strong></div>
                  <div><span className="text-muted-foreground">Urgencia:</span> <br/>{selectedSolicitud.urgencia || 'normal'}</div>
                  <div><span className="text-muted-foreground">Estado:</span> <br/>
                    <Badge variant={estadoBadgeVariant(selectedSolicitud.estado)}>
                      {estadoLabel(selectedSolicitud.estado)}
                    </Badge>
                  </div>
                  {selectedSolicitud.id_servicio && (
                    <div><span className="text-muted-foreground">ID Servicio:</span> <br/>{selectedSolicitud.id_servicio}</div>
                  )}
                  {selectedSolicitud.created_at && (
                    <div><span className="text-muted-foreground">Fecha:</span> <br/>{format(new Date(selectedSolicitud.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}</div>
                  )}
                  {selectedSolicitud.monto_aprobado != null && mode === 'finanzas' && (
                    <div><span className="text-muted-foreground">Monto aprobado (Ops):</span> <br/><strong>${selectedSolicitud.monto_aprobado.toLocaleString('es-MX')}</strong></div>
                  )}
                </div>

                <div>
                  <span className="text-sm text-muted-foreground">Motivo:</span>
                  <p className="text-sm mt-1">{selectedSolicitud.motivo}</p>
                </div>

                {selectedSolicitud.notas && (
                  <div>
                    <span className="text-sm text-muted-foreground">Folio:</span>
                    <p className="text-sm mt-1 font-mono">{selectedSolicitud.notas}</p>
                  </div>
                )}

                {parseComprobantes(selectedSolicitud.comprobante_url).length > 0 && (
                  <div>
                    <span className="text-sm text-muted-foreground">
                      Comprobantes ({parseComprobantes(selectedSolicitud.comprobante_url).length})
                    </span>
                    <div className="flex gap-2 mt-1 overflow-x-auto">
                      {parseComprobantes(selectedSolicitud.comprobante_url).map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="shrink-0">
                          <img src={url} alt={`Comprobante ${i + 1}`} className="max-h-48 rounded-lg border border-border object-contain" />
                          <span className="text-xs text-primary flex items-center gap-1 mt-1">
                            <ExternalLink className="w-3 h-3" /> Ver completo
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {selectedSolicitud.motivo_rechazo && (
                  <div className="bg-destructive/10 p-3 rounded-lg">
                    <span className="text-sm font-medium text-destructive">
                      {selectedSolicitud.estado === 'rechazado_finanzas' ? 'Motivo de rechazo (Finanzas):' : 'Motivo de rechazo:'}
                    </span>
                    <p className="text-sm mt-1">{selectedSolicitud.motivo_rechazo}</p>
                  </div>
                )}

                {isPendingState(selectedSolicitud) && (
                  <div className="border-t border-border pt-4 space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">
                        {mode === 'finanzas' ? 'Monto a autorizar (MXN)' : 'Monto a aprobar (MXN)'}
                      </label>
                      <Input
                        type="number"
                        value={montoAprobado}
                        onChange={(e) => setMontoAprobado(e.target.value)}
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        className="flex-1"
                        disabled={!montoAprobado || parseFloat(montoAprobado) <= 0 || aprobarMutation.isPending}
                        onClick={() => aprobarMutation.mutate({ id: selectedSolicitud.id, monto: parseFloat(montoAprobado) })}
                      >
                        {aprobarMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <CheckCircle className="w-4 h-4 mr-1" />}
                        {config.approveLabel}
                      </Button>
                      <Button
                        variant="destructive"
                        className="flex-1"
                        disabled={rechazarMutation.isPending}
                        onClick={() => {
                          if (!motivoRechazo.trim()) {
                            toast.error('Indica un motivo de rechazo');
                            return;
                          }
                          rechazarMutation.mutate({ id: selectedSolicitud.id, motivo: motivoRechazo });
                        }}
                      >
                        {rechazarMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <XCircle className="w-4 h-4 mr-1" />}
                        {config.rejectLabel}
                      </Button>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm text-muted-foreground">Motivo de rechazo (requerido si rechazas)</label>
                      <Textarea
                        placeholder={mode === 'finanzas' ? 'Indica por qué Finanzas rechaza (ej: falta comprobante, monto incorrecto)...' : 'Indica por qué se rechaza...'}
                        value={motivoRechazo}
                        onChange={(e) => setMotivoRechazo(e.target.value)}
                        rows={2}
                      />
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AprobacionGastosPanel;
