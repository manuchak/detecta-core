import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCSClienteProfile } from '@/hooks/useCSClienteProfile';
import { useCSLoyaltyFunnel } from '@/hooks/useCSLoyaltyFunnel';
import { useCSHealthScoreHistory } from '@/hooks/useCSHealthScores';
import { useCompleteTouchpoint, useRescheduleTouchpoint } from '@/hooks/useCSTouchpoints';
import { useAssignCSM, useCSMOptions } from '@/hooks/useAssignCSM';
import { CSLoyaltyBadge } from './CSLoyaltyBadge';
import { format, isBefore, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, LineChart, Line } from 'recharts';
import { Package, DollarSign, Calendar, MessageSquare, FileWarning, Shield, Activity, Check, CalendarClock, UserCog } from 'lucide-react';

interface Props {
  clienteId: string | null;
  onClose: () => void;
  defaultTab?: string;
}

export function CSClienteProfileModal({ clienteId, onClose, defaultTab }: Props) {
  const { data: profile, isLoading, isError } = useCSClienteProfile(clienteId);
  const { data: loyalty } = useCSLoyaltyFunnel();
  const { data: healthHistory } = useCSHealthScoreHistory(clienteId);
  const completeTp = useCompleteTouchpoint();
  const rescheduleTp = useRescheduleTouchpoint();
  const assignCSM = useAssignCSM();
  const { data: csmOptions } = useCSMOptions();
  const clientLoyalty = loyalty?.clients.find(c => c.id === clienteId);

  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');

  const today = startOfDay(new Date());

  const handleReschedule = () => {
    if (!rescheduleId || !rescheduleDate) return;
    rescheduleTp.mutate({ id: rescheduleId, fecha: rescheduleDate }, {
      onSuccess: () => { setRescheduleId(null); setRescheduleDate(''); },
    });
  };

  return (
    <Dialog open={!!clienteId} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        {isError ? (
          <div className="py-8 text-center space-y-2">
            <DialogHeader>
              <DialogTitle>Error al cargar perfil</DialogTitle>
              <DialogDescription>No se pudieron obtener los datos del cliente. Intenta de nuevo más tarde.</DialogDescription>
            </DialogHeader>
          </div>
        ) : isLoading || !profile ? (
          <div className="space-y-4">
            <DialogHeader><DialogTitle>Cargando perfil...</DialogTitle><DialogDescription>Obteniendo datos del cliente</DialogDescription></DialogHeader>
            <Skeleton className="h-20" />
            <Skeleton className="h-40" />
          </div>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {clientLoyalty && <CSLoyaltyBadge stage={clientLoyalty.stage} size="md" />}
                  <div>
                    <DialogTitle className="text-xl">{profile.nombre}</DialogTitle>
                    <DialogDescription>{profile.razon_social}</DialogDescription>
                  </div>
                </div>
                {/* Inline CSM assignment */}
                <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                  <UserCog className="h-4 w-4 text-muted-foreground" />
                  <Select
                    value={(profile as any).csm_asignado || '__none'}
                    onValueChange={val => clienteId && assignCSM.mutate({ clienteId, csmId: val === '__none' ? null : val })}
                  >
                    <SelectTrigger className="h-8 text-xs w-[160px]">
                      <SelectValue placeholder="Asignar CSM" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none">Sin asignar</SelectItem>
                      {csmOptions?.map(o => (
                        <SelectItem key={o.id} value={o.id}>{o.display_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </DialogHeader>

            {/* Hero Stats */}
            <div className="grid grid-cols-3 gap-3">
              <Card>
                <CardContent className="p-3 flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-lg font-bold">{profile.lifetime_servicios.toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground">Servicios lifetime</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-lg font-bold">
                      ${(profile.gmv_total / 1000000).toFixed(1)}M
                    </p>
                    <p className="text-[10px] text-muted-foreground">GMV total</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-lg font-bold">
                      {profile.primer_servicio
                        ? format(new Date(profile.primer_servicio), 'MMM yyyy', { locale: es })
                        : '—'}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Desde</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* GMV Trend */}
            {profile.tendencia_gmv.length > 0 && (
              <Card>
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground mb-2">Tendencia GMV (12m)</p>
                  <ResponsiveContainer width="100%" height={120}>
                    <AreaChart data={profile.tendencia_gmv}>
                      <XAxis dataKey="mes" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" tickFormatter={v => `$${(v/1000).toFixed(0)}K`} />
                      <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
                      <Area type="monotone" dataKey="gmv" stroke="hsl(var(--chart-1))" fill="hsl(var(--chart-1))" fillOpacity={0.1} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Health Score Trend */}
            {healthHistory && healthHistory.length > 0 && (
              <Card>
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                    <Activity className="h-3 w-3" /> Tendencia Health Score
                  </p>
                  <ResponsiveContainer width="100%" height={100}>
                    <LineChart data={healthHistory.map(h => ({
                      mes: format(new Date(h.periodo), 'MMM yy', { locale: es }),
                      score: h.score,
                    }))}>
                      <XAxis dataKey="mes" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip formatter={(v: number) => `${v}/100`} />
                      <Line type="monotone" dataKey="score" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Tabs */}
            <Tabs defaultValue={defaultTab || 'quejas'} className="w-full">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="quejas" className="gap-1">
                  <FileWarning className="h-3 w-3" /> Quejas ({profile.quejas.length})
                </TabsTrigger>
                <TabsTrigger value="touchpoints" className="gap-1">
                  <MessageSquare className="h-3 w-3" /> Touchpoints ({profile.touchpoints.length})
                </TabsTrigger>
                <TabsTrigger value="capa" className="gap-1">
                  <Shield className="h-3 w-3" /> CAPA ({profile.capas.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="quejas">
                {profile.quejas.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">Sin quejas registradas</p>
                ) : (
                  <div className="space-y-2 mt-2">
                    {profile.quejas.map(q => (
                      <div key={q.id} className="flex items-center justify-between p-2 rounded-lg border text-sm">
                        <div>
                          <span className="font-mono text-xs text-primary">{q.numero_queja}</span>
                          <span className="text-muted-foreground ml-2 capitalize">{q.tipo.replace(/_/g, ' ')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(q.created_at), 'dd MMM yy', { locale: es })}
                          </span>
                          <Badge variant="outline" className="text-[10px] capitalize">{q.estado.replace(/_/g, ' ')}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="touchpoints">
                {profile.touchpoints.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">Sin touchpoints registrados</p>
                ) : (
                  <div className="space-y-2 mt-2">
                    {profile.touchpoints.map(tp => {
                      const isPending = (tp as any).estado === 'pendiente';
                      const isOverdue = isPending && (tp as any).fecha_siguiente_accion && isBefore(new Date((tp as any).fecha_siguiente_accion), today);

                      return (
                        <div
                          key={tp.id}
                          className={`p-3 rounded-lg border text-sm ${isOverdue ? 'border-destructive/50 bg-destructive/5' : isPending ? 'border-amber-300/50 bg-amber-50/30 dark:bg-amber-950/10 dark:border-amber-800/50' : ''}`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium capitalize">{tp.tipo.replace(/_/g, ' ')}</span>
                              {isPending && (
                                <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800">
                                  {isOverdue ? 'Vencido' : 'Pendiente'}
                                </Badge>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(tp.created_at), 'dd MMM yy HH:mm', { locale: es })}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">{tp.resumen}</p>
                          {(tp as any).siguiente_accion && (
                            <p className="text-xs mt-1">
                              <span className="font-medium">Siguiente:</span> {(tp as any).siguiente_accion}
                              {(tp as any).fecha_siguiente_accion && (
                                <span className={`ml-1 ${isOverdue ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                                  ({format(new Date((tp as any).fecha_siguiente_accion), 'dd/MM/yy')})
                                </span>
                              )}
                            </p>
                          )}
                          {isPending && (
                            <div className="flex items-center gap-1 mt-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs gap-1 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950/30"
                                onClick={() => completeTp.mutate(tp.id)}
                                disabled={completeTp.isPending}
                              >
                                <Check className="h-3 w-3" /> Completar
                              </Button>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-6 px-2 text-xs gap-1">
                                    <CalendarClock className="h-3 w-3" /> Reprogramar
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-3" align="end">
                                  <div className="space-y-2">
                                    <Label className="text-xs">Nueva fecha</Label>
                                    <Input
                                      type="date"
                                      value={rescheduleId === tp.id ? rescheduleDate : ''}
                                      onChange={e => { setRescheduleId(tp.id); setRescheduleDate(e.target.value); }}
                                      className="h-8 text-sm"
                                    />
                                    <Button
                                      size="sm"
                                      className="w-full h-7 text-xs"
                                      onClick={handleReschedule}
                                      disabled={rescheduleId !== tp.id || !rescheduleDate || rescheduleTp.isPending}
                                    >
                                      Confirmar
                                    </Button>
                                  </div>
                                </PopoverContent>
                              </Popover>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="capa">
                {profile.capas.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">Sin CAPAs registrados</p>
                ) : (
                  <div className="space-y-2 mt-2">
                    {profile.capas.map(ca => (
                      <div key={ca.id} className="flex items-center justify-between p-2 rounded-lg border text-sm">
                        <span className="font-mono text-xs text-primary">{ca.numero_capa}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] capitalize">{ca.tipo}</Badge>
                          <Badge variant="outline" className="text-[10px] capitalize">{ca.estado.replace(/_/g, ' ')}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {/* Notas de fidelidad */}
            {profile.notas_fidelidad && (
              <div className="mt-2 p-3 rounded-lg bg-secondary/30">
                <p className="text-xs text-muted-foreground mb-1">Notas de fidelidad</p>
                <p className="text-sm">{profile.notas_fidelidad}</p>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
