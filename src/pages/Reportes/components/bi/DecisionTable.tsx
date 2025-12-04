import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowUp, ArrowDown, Minus, Lightbulb, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProviderMetrics {
  proveedor: string;
  servicios: number;
  horasTotales: number;
  horasContratadas: number;
  aprovechamiento: number;
  costoEstimado: number;
  revenueLoss: number;
  clientesUnicos: number;
  horasPromedio: number;
}

interface DecisionTableProps {
  providers: ProviderMetrics[];
  previousProviders?: ProviderMetrics[];
}

interface Decision {
  proveedor: string;
  accion: 'incrementar' | 'mantener' | 'reducir' | 'revisar';
  motivo: string;
  prioridad: 'alta' | 'media' | 'baja';
  metricas: {
    aprovechamiento: number;
    delta?: number;
    horasPromedio: number;
    revenueLoss: number;
  };
}

export function DecisionTable({ providers, previousProviders }: DecisionTableProps) {
  const generateDecisions = (): Decision[] => {
    return providers.map(p => {
      const prev = previousProviders?.find(pp => pp.proveedor === p.proveedor);
      const delta = prev ? p.aprovechamiento - prev.aprovechamiento : undefined;
      
      let accion: Decision['accion'] = 'mantener';
      let motivo = '';
      let prioridad: Decision['prioridad'] = 'media';

      // Decision logic based on metrics
      if (p.aprovechamiento < 15) {
        accion = 'reducir';
        motivo = 'Aprovechamiento crítico, considerar reducción de contrato o renegociación de tarifas';
        prioridad = 'alta';
      } else if (p.aprovechamiento < 25 && p.servicios > 10) {
        accion = 'revisar';
        motivo = 'Oportunidad de consolidación de servicios para mejorar eficiencia';
        prioridad = 'alta';
      } else if (p.aprovechamiento >= 40) {
        accion = 'incrementar';
        motivo = 'Buen aprovechamiento, evaluar capacidad para absorber más servicios';
        prioridad = 'media';
      } else if (delta && delta > 5) {
        accion = 'mantener';
        motivo = `Tendencia positiva (+${delta.toFixed(1)} pts), monitorear continuidad`;
        prioridad = 'baja';
      } else if (delta && delta < -5) {
        accion = 'revisar';
        motivo = `Tendencia negativa (${delta.toFixed(1)} pts), investigar causas`;
        prioridad = 'alta';
      } else {
        motivo = 'Desempeño estable, mantener condiciones actuales';
        prioridad = 'baja';
      }

      return {
        proveedor: p.proveedor,
        accion,
        motivo,
        prioridad,
        metricas: {
          aprovechamiento: p.aprovechamiento,
          delta,
          horasPromedio: p.horasPromedio,
          revenueLoss: p.revenueLoss
        }
      };
    });
  };

  const decisions = generateDecisions();

  const getActionBadge = (accion: Decision['accion']) => {
    const config = {
      incrementar: { color: 'bg-emerald-100 text-emerald-700 border-emerald-300', icon: ArrowUp },
      mantener: { color: 'bg-blue-100 text-blue-700 border-blue-300', icon: Minus },
      reducir: { color: 'bg-red-100 text-red-700 border-red-300', icon: ArrowDown },
      revisar: { color: 'bg-amber-100 text-amber-700 border-amber-300', icon: AlertTriangle }
    };
    const { color, icon: Icon } = config[accion];
    return (
      <Badge variant="outline" className={cn("capitalize", color)}>
        <Icon className="h-3 w-3 mr-1" />
        {accion}
      </Badge>
    );
  };

  const getPriorityBadge = (prioridad: Decision['prioridad']) => {
    const colors = {
      alta: 'bg-red-500',
      media: 'bg-amber-500',
      baja: 'bg-emerald-500'
    };
    return (
      <div className="flex items-center gap-2">
        <span className={cn("h-2 w-2 rounded-full", colors[prioridad])} />
        <span className="text-xs capitalize">{prioridad}</span>
      </div>
    );
  };

  return (
    <Card className="bg-background/80 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-corporate-blue" />
          <CardTitle className="text-lg">Recomendaciones Tácticas</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">
          Acciones sugeridas basadas en el análisis de datos
        </p>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Proveedor</TableHead>
              <TableHead>Acción</TableHead>
              <TableHead>Prioridad</TableHead>
              <TableHead>Aprovech.</TableHead>
              <TableHead>Tendencia</TableHead>
              <TableHead className="hidden md:table-cell">Revenue Loss</TableHead>
              <TableHead className="hidden lg:table-cell max-w-[300px]">Motivo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {decisions.map((d) => (
              <TableRow key={d.proveedor}>
                <TableCell className="font-medium">{d.proveedor}</TableCell>
                <TableCell>{getActionBadge(d.accion)}</TableCell>
                <TableCell>{getPriorityBadge(d.prioridad)}</TableCell>
                <TableCell>
                  <span className={cn(
                    "font-medium",
                    d.metricas.aprovechamiento < 20 ? "text-red-600" : 
                    d.metricas.aprovechamiento < 40 ? "text-amber-600" : "text-emerald-600"
                  )}>
                    {d.metricas.aprovechamiento.toFixed(1)}%
                  </span>
                </TableCell>
                <TableCell>
                  {d.metricas.delta !== undefined ? (
                    <div className={cn(
                      "flex items-center gap-1 text-sm",
                      d.metricas.delta > 0 ? "text-emerald-600" : d.metricas.delta < 0 ? "text-red-600" : "text-muted-foreground"
                    )}>
                      {d.metricas.delta > 0 ? <TrendingUp className="h-3 w-3" /> : 
                       d.metricas.delta < 0 ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                      {d.metricas.delta > 0 ? '+' : ''}{d.metricas.delta.toFixed(1)}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">N/A</span>
                  )}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <span className="text-red-600 font-medium">
                    ${(d.metricas.revenueLoss / 1000).toFixed(0)}K
                  </span>
                </TableCell>
                <TableCell className="hidden lg:table-cell text-sm text-muted-foreground max-w-[300px]">
                  {d.motivo}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Action items summary */}
        <div className="mt-4 p-3 rounded-lg border border-dashed border-corporate-blue/30 bg-corporate-blue/5">
          <p className="text-sm font-medium text-corporate-blue mb-2">📋 Próximos pasos sugeridos:</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            {decisions.filter(d => d.prioridad === 'alta').map((d, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-red-500">•</span>
                <span><strong>{d.proveedor}:</strong> {d.motivo}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
