import { useCSQuejaStats, useCSQuejas } from '@/hooks/useCSQuejas';
import { useCSCapas } from '@/hooks/useCSCapa';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, TrendingUp } from 'lucide-react';

const TIPO_LABELS: Record<string, string> = {
  calidad_servicio: 'Calidad',
  facturacion: 'Facturación',
  cobertura: 'Cobertura',
  seguridad: 'Seguridad',
  consignas: 'Consignas',
  otro: 'Otro',
};

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--muted-foreground))',
];

export function CSMejoraContinua() {
  const { data: stats } = useCSQuejaStats();
  const { data: capas } = useCSCapas();

  // Pareto data
  const paretoData = Object.entries(stats?.porTipo || {})
    .map(([key, value]) => ({ name: TIPO_LABELS[key] || key, value }))
    .sort((a, b) => b.value - a.value);

  // CAPA stats
  const totalCapas = capas?.length || 0;
  const verificadas = capas?.filter(c => c.eficacia_verificada).length || 0;
  const eficacia = totalCapas ? ((verificadas / totalCapas) * 100) : 0;
  const capasPendientes = capas?.filter(c => c.estado !== 'cerrado' && c.estado !== 'verificado').length || 0;

  return (
    <div className="space-y-6 mt-4">
      {/* ISO KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">% Quejas en SLA</p>
                <p className="text-2xl font-bold">
                  {stats?.slaCompliance ? `${stats.slaCompliance.toFixed(0)}%` : '—'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Meta ISO: ≥90%</p>
              </div>
              {(stats?.slaCompliance || 0) >= 90 ? (
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              ) : (
                <XCircle className="h-8 w-8 text-destructive" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Eficacia de CAPAs</p>
                <p className="text-2xl font-bold">{eficacia.toFixed(0)}%</p>
                <p className="text-xs text-muted-foreground mt-1">{verificadas}/{totalCapas} verificadas</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">CAPAs Pendientes</p>
                <p className="text-2xl font-bold">{capasPendientes}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {capasPendientes === 0 ? 'Todo al día ✓' : 'Requieren atención'}
                </p>
              </div>
              <Badge variant={capasPendientes > 0 ? 'destructive' : 'secondary'}>{capasPendientes}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pareto */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pareto de Causas — Top quejas por tipo</CardTitle>
        </CardHeader>
        <CardContent>
          {paretoData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={paretoData} layout="vertical" margin={{ left: 80 }}>
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {paretoData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-muted-foreground">
              Sin datos para análisis Pareto
            </div>
          )}
        </CardContent>
      </Card>

      {/* ISO Compliance Checklist */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Cumplimiento ISO 9001:2015</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <p className="text-sm font-medium">Cláusula 8.2.1 — Comunicación con el cliente</p>
                <p className="text-xs text-muted-foreground">Registro de touchpoints por canal y dirección</p>
              </div>
              <Badge className="bg-green-100 text-green-800">Implementado</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <p className="text-sm font-medium">Cláusula 9.1.2 — Satisfacción del cliente</p>
                <p className="text-xs text-muted-foreground">CSAT por queja + health score por cuenta</p>
              </div>
              <Badge className="bg-green-100 text-green-800">Implementado</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <p className="text-sm font-medium">Cláusula 10.2 — No conformidad y acción correctiva</p>
                <p className="text-xs text-muted-foreground">Sistema CAPA con causa raíz y verificación de eficacia</p>
              </div>
              <Badge className="bg-green-100 text-green-800">Implementado</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <p className="text-sm font-medium">Cláusula 10.3 — Mejora continua</p>
                <p className="text-xs text-muted-foreground">Pareto de causas, tendencias, tasa de recurrencia</p>
              </div>
              <Badge className="bg-green-100 text-green-800">Implementado</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
