import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useCSStaffMetrics } from '@/hooks/useCSStaffMetrics';
import { Users, Phone, AlertTriangle, Clock, TrendingUp } from 'lucide-react';

function ScoreBadge({ score }: { score: number }) {
  if (score >= 80) return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">{score}</Badge>;
  if (score >= 50) return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">{score}</Badge>;
  return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">{score}</Badge>;
}

export function CSStaffPerformance() {
  const { data: metrics, isLoading } = useCSStaffMetrics();

  if (isLoading) {
    return <div className="space-y-4 mt-4"><Skeleton className="h-12" /><Skeleton className="h-64" /></div>;
  }

  if (!metrics || metrics.length === 0) {
    return (
      <Card className="mt-4">
        <CardContent className="py-12 text-center text-muted-foreground">
          <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>No hay CSMs con clientes asignados</p>
          <p className="text-xs mt-1">Asigna CSMs desde la pestaña Cartera para ver métricas de desempeño</p>
        </CardContent>
      </Card>
    );
  }

  // Summary KPIs
  const totalClientes = metrics.reduce((s, m) => s + m.clientesAsignados, 0);
  const totalTp30d = metrics.reduce((s, m) => s + m.touchpoints30d, 0);
  const totalVencidos = metrics.reduce((s, m) => s + m.followupsVencidos, 0);
  const avgScore = Math.round(metrics.reduce((s, m) => s + m.activityScore, 0) / metrics.length);

  return (
    <div className="space-y-4 mt-4">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Users className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold">{metrics.length}</p>
              <p className="text-xs text-muted-foreground">CSMs activos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Phone className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold">{totalTp30d}</p>
              <p className="text-xs text-muted-foreground">Touchpoints 30d</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <div>
              <p className="text-2xl font-bold">{totalVencidos}</p>
              <p className="text-xs text-muted-foreground">Seguimientos vencidos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold">{avgScore}</p>
              <p className="text-xs text-muted-foreground">Score promedio</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ranking Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ranking de Desempeño CSM</CardTitle>
          <CardDescription>Ordenado por score de actividad (más alto = mejor gestión)</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>CSM</TableHead>
                <TableHead className="text-center">Clientes</TableHead>
                <TableHead className="text-center">Touchpoints 30d</TableHead>
                <TableHead className="text-center">Touchpoints Mes</TableHead>
                <TableHead className="text-center">Avg Días s/c</TableHead>
                <TableHead className="text-center">En Rojo</TableHead>
                <TableHead className="text-center">Seg. Vencidos</TableHead>
                <TableHead className="text-center">Quejas Abiertas</TableHead>
                <TableHead className="text-center">Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {metrics.map((m, i) => (
                <TableRow key={m.csmId}>
                  <TableCell className="font-medium text-muted-foreground">{i + 1}</TableCell>
                  <TableCell className="font-medium">{m.csmName}</TableCell>
                  <TableCell className="text-center">{m.clientesAsignados}</TableCell>
                  <TableCell className="text-center font-medium">{m.touchpoints30d}</TableCell>
                  <TableCell className="text-center">{m.touchpointsMes}</TableCell>
                  <TableCell className="text-center">
                    <span className={m.avgDiasSinContacto > 30 ? 'text-destructive font-medium' : ''}>
                      {m.avgDiasSinContacto < 999 ? `${m.avgDiasSinContacto}d` : '—'}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    {m.clientesRojo > 0 ? (
                      <span className="text-destructive font-medium">{m.clientesRojo}</span>
                    ) : '0'}
                  </TableCell>
                  <TableCell className="text-center">
                    {m.followupsVencidos > 0 ? (
                      <span className="text-destructive font-medium">{m.followupsVencidos}</span>
                    ) : '0'}
                  </TableCell>
                  <TableCell className="text-center">
                    {m.quejasAbiertas > 0 ? (
                      <span className="text-amber-600 font-medium">{m.quejasAbiertas}</span>
                    ) : '0'}
                  </TableCell>
                  <TableCell className="text-center"><ScoreBadge score={m.activityScore} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
