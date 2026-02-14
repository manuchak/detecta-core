import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useNPSSends,
  useGenerateNPSCampaign,
  useUpdateNPSSend,
  useNPSCampaignStats,
  DEFAULT_NPS_RULES,
} from '@/hooks/useCSNPSCampaign';
import { useCSConfig, type NPSRulesConfig } from '@/hooks/useCSConfig';
import { Rocket, Send, CheckCircle2, Clock, Users, BarChart3 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

function getPeriodoOptions(): string[] {
  const now = new Date();
  const options: string[] = [];
  for (let i = 0; i < 4; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i * 3, 1);
    const q = Math.ceil((d.getMonth() + 1) / 3);
    options.push(`${d.getFullYear()}-Q${q}`);
  }
  return options;
}

function EstadoBadge({ estado }: { estado: string }) {
  switch (estado) {
    case 'pendiente':
      return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" />Pendiente</Badge>;
    case 'enviado':
      return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 gap-1"><Send className="h-3 w-3" />Enviado</Badge>;
    case 'respondido':
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 gap-1"><CheckCircle2 className="h-3 w-3" />Respondido</Badge>;
    default:
      return <Badge variant="secondary">{estado}</Badge>;
  }
}

export function CSNPSCampaign() {
  const periodoOptions = useMemo(() => getPeriodoOptions(), []);
  const [selectedPeriodo, setSelectedPeriodo] = useState(periodoOptions[0]);

  const { config: rules } = useCSConfig<NPSRulesConfig>('nps_rules');
  const { data: sends, isLoading } = useNPSSends(selectedPeriodo);
  const generateCampaign = useGenerateNPSCampaign();
  const updateSend = useUpdateNPSSend();
  const stats = useNPSCampaignStats(selectedPeriodo);

  const handleGenerate = () => {
    generateCampaign.mutate({ periodo: selectedPeriodo, rules: rules || DEFAULT_NPS_RULES });
  };

  const handleMarkSent = (id: string) => {
    updateSend.mutate({ id, updates: { estado: 'enviado', enviado_at: new Date().toISOString() } });
  };

  const handleMarkResponded = (id: string) => {
    updateSend.mutate({ id, updates: { estado: 'respondido', respondido_at: new Date().toISOString() } });
  };

  if (isLoading) {
    return <div className="space-y-4 mt-4"><Skeleton className="h-12" /><Skeleton className="h-64" /></div>;
  }

  return (
    <div className="space-y-4 mt-4">
      {/* Period selector + generate */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={selectedPeriodo} onValueChange={setSelectedPeriodo}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            {periodoOptions.map(p => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={handleGenerate} disabled={generateCampaign.isPending} className="gap-2">
          <Rocket className="h-4 w-4" />
          {generateCampaign.isPending ? 'Generando...' : 'Generar Campaña'}
        </Button>
        <p className="text-xs text-muted-foreground">
          Aplica las reglas de configuración NPS para seleccionar clientes elegibles
        </p>
      </div>

      {/* Stats */}
      {stats.total > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total campaña</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Clock className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-2xl font-bold">{stats.pendientes}</p>
                <p className="text-xs text-muted-foreground">Pendientes</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Send className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.enviados}</p>
                <p className="text-xs text-muted-foreground">Enviados</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.tasaRespuesta}%</p>
                <p className="text-xs text-muted-foreground">Tasa respuesta</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Sends table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Envíos Campaña {selectedPeriodo}</CardTitle>
          <CardDescription>Tracking de envíos NPS por cliente</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {(!sends || sends.length === 0) ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              <Rocket className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>No hay envíos para este periodo</p>
              <p className="text-xs mt-1">Usa "Generar Campaña" para seleccionar clientes elegibles</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="text-center">Canal</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                  <TableHead className="text-center">Enviado</TableHead>
                  <TableHead className="text-center">Respondido</TableHead>
                  <TableHead className="text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sends.map(send => (
                  <TableRow key={send.id}>
                    <TableCell className="font-medium">{send.cliente?.nombre || '—'}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="text-[10px] capitalize">{send.canal_envio}</Badge>
                    </TableCell>
                    <TableCell className="text-center"><EstadoBadge estado={send.estado} /></TableCell>
                    <TableCell className="text-center text-xs text-muted-foreground">
                      {send.enviado_at ? format(new Date(send.enviado_at), 'dd MMM HH:mm', { locale: es }) : '—'}
                    </TableCell>
                    <TableCell className="text-center text-xs text-muted-foreground">
                      {send.respondido_at ? format(new Date(send.respondido_at), 'dd MMM HH:mm', { locale: es }) : '—'}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-1">
                        {send.estado === 'pendiente' && (
                          <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => handleMarkSent(send.id)}>
                            <Send className="h-3 w-3" /> Enviado
                          </Button>
                        )}
                        {send.estado === 'enviado' && (
                          <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => handleMarkResponded(send.id)}>
                            <CheckCircle2 className="h-3 w-3" /> Respondido
                          </Button>
                        )}
                        {send.estado === 'respondido' && (
                          <span className="text-xs text-muted-foreground">✓</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
