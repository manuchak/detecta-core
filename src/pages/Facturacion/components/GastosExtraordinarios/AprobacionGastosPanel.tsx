import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle, XCircle, Clock, ExternalLink, Loader2, DollarSign, AlertTriangle, User } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { TIPOS_APOYO_CUSTODIO, parseComprobantes } from '@/hooks/useCustodianExpenses';

const QUERY_KEY = 'aprobacion-gastos';

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

const AprobacionGastosPanel = () => {
  const [filtroEstado, setFiltroEstado] = useState('pendiente');
  const [selectedSolicitud, setSelectedSolicitud] = useState<Solicitud | null>(null);
  const [montoAprobado, setMontoAprobado] = useState('');
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const queryClient = useQueryClient();

  const { data: solicitudes, isLoading } = useQuery({
    queryKey: [QUERY_KEY, filtroEstado],
    queryFn: async () => {
      let query = supabase
        .from('solicitudes_apoyo_extraordinario')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (filtroEstado !== 'todos') {
        query = query.eq('estado', filtroEstado);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as Solicitud[];
    },
  });

  const aprobarMutation = useMutation({
    mutationFn: async ({ id, monto }: { id: string; monto: number }) => {
      const { data: user } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('solicitudes_apoyo_extraordinario')
        .update({
          estado: 'aprobado',
          monto_aprobado: monto,
          aprobado_por: user.user?.id,
          fecha_aprobacion: new Date().toISOString(),
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Solicitud aprobada');
      setSelectedSolicitud(null);
    },
    onError: () => toast.error('Error al aprobar'),
  });

  const rechazarMutation = useMutation({
    mutationFn: async ({ id, motivo }: { id: string; motivo: string }) => {
      const { data: user } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('solicitudes_apoyo_extraordinario')
        .update({
          estado: 'rechazado',
          motivo_rechazo: motivo,
          aprobado_por: user.user?.id,
          fecha_aprobacion: new Date().toISOString(),
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Solicitud rechazada');
      setSelectedSolicitud(null);
    },
    onError: () => toast.error('Error al rechazar'),
  });

  const pendingCount = solicitudes?.filter(s => s.estado === 'pendiente').length || 0;

  const handleOpenDetail = (s: Solicitud) => {
    setSelectedSolicitud(s);
    setMontoAprobado(String(s.monto_solicitado));
    setMotivoRechazo('');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Aprobación de Gastos Extraordinarios</h3>
          {pendingCount > 0 && (
            <Badge variant="destructive">{pendingCount} pendientes</Badge>
          )}
        </div>
        <Select value={filtroEstado} onValueChange={setFiltroEstado}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pendiente">Pendientes</SelectItem>
            <SelectItem value="aprobado">Aprobados</SelectItem>
            <SelectItem value="rechazado">Rechazados</SelectItem>
            <SelectItem value="pagado">Pagados</SelectItem>
            <SelectItem value="todos">Todos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : !solicitudes?.length ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No hay solicitudes {filtroEstado !== 'todos' ? `en estado "${filtroEstado}"` : ''}
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
                        <Badge variant={s.estado === 'pendiente' ? 'secondary' : s.estado === 'aprobado' ? 'default' : 'destructive'}>
                          {s.estado}
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
                  <div><span className="text-muted-foreground">Estado:</span> <br/>{selectedSolicitud.estado}</div>
                  {selectedSolicitud.id_servicio && (
                    <div><span className="text-muted-foreground">ID Servicio:</span> <br/>{selectedSolicitud.id_servicio}</div>
                  )}
                  {selectedSolicitud.created_at && (
                    <div><span className="text-muted-foreground">Fecha:</span> <br/>{format(new Date(selectedSolicitud.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}</div>
                  )}
                </div>

                <div>
                  <span className="text-sm text-muted-foreground">Motivo:</span>
                  <p className="text-sm mt-1">{selectedSolicitud.motivo}</p>
                </div>

                {selectedSolicitud.notas && (
                  <div>
                    <span className="text-sm text-muted-foreground">Notas:</span>
                    <p className="text-sm mt-1">{selectedSolicitud.notas}</p>
                  </div>
                )}

                {selectedSolicitud.comprobante_url && (
                  <div>
                    <span className="text-sm text-muted-foreground">Comprobante:</span>
                    <a href={selectedSolicitud.comprobante_url} target="_blank" rel="noopener noreferrer" className="block mt-1">
                      <img src={selectedSolicitud.comprobante_url} alt="Comprobante" className="max-h-48 rounded-lg border border-border object-contain" />
                      <span className="text-xs text-primary flex items-center gap-1 mt-1">
                        <ExternalLink className="w-3 h-3" /> Ver tamaño completo
                      </span>
                    </a>
                  </div>
                )}

                {selectedSolicitud.motivo_rechazo && (
                  <div className="bg-destructive/10 p-3 rounded-lg">
                    <span className="text-sm font-medium text-destructive">Motivo de rechazo:</span>
                    <p className="text-sm mt-1">{selectedSolicitud.motivo_rechazo}</p>
                  </div>
                )}

                {selectedSolicitud.estado === 'pendiente' && (
                  <div className="border-t border-border pt-4 space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Monto a aprobar (MXN)</label>
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
                        Aprobar
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
                        Rechazar
                      </Button>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm text-muted-foreground">Motivo de rechazo (requerido si rechazas)</label>
                      <Textarea
                        placeholder="Indica por qué se rechaza..."
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
