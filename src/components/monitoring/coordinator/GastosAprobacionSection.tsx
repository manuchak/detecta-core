import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  CheckCircle, XCircle, DollarSign, Loader2, AlertTriangle,
  User, Receipt, ExternalLink, Inbox,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { TIPOS_APOYO_CUSTODIO } from '@/hooks/useCustodianExpenses';

const QUERY_KEY = 'coord-gastos-pendientes';

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
  motivo_rechazo: string | null;
}

export const GastosAprobacionSection: React.FC = () => {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<Solicitud | null>(null);
  const [montoAprobado, setMontoAprobado] = useState('');
  const [motivoRechazo, setMotivoRechazo] = useState('');

  const { data: solicitudes, isLoading } = useQuery({
    queryKey: [QUERY_KEY],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('solicitudes_apoyo_extraordinario')
        .select('*')
        .eq('estado', 'pendiente')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []) as Solicitud[];
    },
    refetchInterval: 30_000,
  });

  const aprobar = useMutation({
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
      toast.success('Gasto aprobado');
      setSelected(null);
    },
    onError: () => toast.error('Error al aprobar'),
  });

  const rechazar = useMutation({
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
      toast.success('Gasto rechazado');
      setSelected(null);
    },
    onError: () => toast.error('Error al rechazar'),
  });

  const count = solicitudes?.length || 0;

  const handleOpen = (s: Solicitud) => {
    setSelected(s);
    setMontoAprobado(String(s.monto_solicitado));
    setMotivoRechazo('');
  };

  return (
    <Card className="border-border/60 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-3 px-5 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Receipt className="h-4 w-4 text-emerald-500" />
            </div>
            <CardTitle className="text-sm font-semibold">Gastos Extraordinarios</CardTitle>
          </div>
          {count > 0 ? (
            <Badge variant="destructive" className="text-[10px] tabular-nums">
              {count} pendientes
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[10px]">Al día</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-4">
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : count === 0 ? (
          <div className="flex flex-col items-center py-6 text-center">
            <Inbox className="h-8 w-8 text-muted-foreground/30 mb-2" />
            <p className="text-xs text-muted-foreground">
              Sin solicitudes pendientes de aprobación
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {solicitudes!.map(s => {
              const tipoLabel = TIPOS_APOYO_CUSTODIO.find(t => t.value === s.tipo_apoyo)?.label || s.tipo_apoyo;
              return (
                <button
                  key={s.id}
                  type="button"
                  className="w-full text-left flex items-center justify-between gap-3 p-3 rounded-xl border border-border/50 bg-background/50 hover:bg-accent/30 transition-colors"
                  onClick={() => handleOpen(s)}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-medium">{tipoLabel}</span>
                      {s.urgencia && s.urgencia !== 'normal' && (
                        <Badge
                          variant="destructive"
                          className="text-[9px] px-1.5 py-0"
                        >
                          <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
                          {s.urgencia}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {s.custodio_nombre || 'Sin nombre'}
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        ${s.monto_solicitado.toLocaleString('es-MX')}
                      </span>
                      {s.created_at && (
                        <span>{format(new Date(s.created_at), 'dd MMM HH:mm', { locale: es })}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {s.comprobante_url && (
                      <div className="w-9 h-9 rounded-lg bg-muted overflow-hidden">
                        <img src={s.comprobante_url} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <DollarSign className="h-4 w-4 text-muted-foreground/40" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </CardContent>

      {/* Detail + Actions Dialog */}
      <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="text-base">
                  {TIPOS_APOYO_CUSTODIO.find(t => t.value === selected.tipo_apoyo)?.label || selected.tipo_apoyo}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground text-xs">Custodio</span>
                    <p className="font-medium">{selected.custodio_nombre || '—'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Monto solicitado</span>
                    <p className="font-semibold">${selected.monto_solicitado.toLocaleString('es-MX')}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Urgencia</span>
                    <p>{selected.urgencia || 'normal'}</p>
                  </div>
                  {selected.created_at && (
                    <div>
                      <span className="text-muted-foreground text-xs">Fecha</span>
                      <p>{format(new Date(selected.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}</p>
                    </div>
                  )}
                </div>

                <div>
                  <span className="text-xs text-muted-foreground">Motivo</span>
                  <p className="text-sm mt-0.5">{selected.motivo}</p>
                </div>

                {selected.comprobante_url && (
                  <div>
                    <span className="text-xs text-muted-foreground">Comprobante</span>
                    <a href={selected.comprobante_url} target="_blank" rel="noopener noreferrer" className="block mt-1">
                      <img
                        src={selected.comprobante_url}
                        alt="Comprobante"
                        className="max-h-40 rounded-lg border border-border object-contain"
                      />
                      <span className="text-xs text-primary flex items-center gap-1 mt-1">
                        <ExternalLink className="w-3 h-3" /> Ver completo
                      </span>
                    </a>
                  </div>
                )}

                {/* Actions */}
                <div className="border-t border-border pt-4 space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium">Monto a aprobar (MXN)</label>
                    <Input
                      type="number"
                      value={montoAprobado}
                      onChange={(e) => setMontoAprobado(e.target.value)}
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                      disabled={!montoAprobado || parseFloat(montoAprobado) <= 0 || aprobar.isPending}
                      onClick={() => aprobar.mutate({ id: selected.id, monto: parseFloat(montoAprobado) })}
                    >
                      {aprobar.isPending ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CheckCircle className="w-3.5 h-3.5" />
                      )}
                      Aprobar
                    </Button>
                    <Button
                      variant="destructive"
                      className="gap-1.5"
                      disabled={rechazar.isPending}
                      onClick={() => {
                        if (!motivoRechazo.trim()) {
                          toast.error('Indica un motivo de rechazo');
                          return;
                        }
                        rechazar.mutate({ id: selected.id, motivo: motivoRechazo });
                      }}
                    >
                      {rechazar.isPending ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5" />
                      )}
                      Rechazar
                    </Button>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground">Motivo de rechazo (obligatorio para rechazar)</label>
                    <Textarea
                      placeholder="Indica por qué se rechaza..."
                      value={motivoRechazo}
                      onChange={(e) => setMotivoRechazo(e.target.value)}
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};
