import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  AlertTriangle, CheckCircle2, Play, RefreshCw, MapPin, Calculator,
  TrendingDown, DollarSign, Clock, Route
} from 'lucide-react';
import { 
  useAuditoriaKmEstadisticas, 
  useAuditoriaKmCorrecciones, 
  useServiciosSospechosos,
  useEjecutarAuditoria 
} from '@/hooks/useAuditoriaKm';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const METODO_LABELS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  origen_igual_destino: { 
    label: 'Mismo Punto', 
    color: 'bg-yellow-100 text-yellow-800',
    icon: <MapPin className="h-3 w-3" />
  },
  division_1000: { 
    label: 'Metros → KM', 
    color: 'bg-orange-100 text-orange-800',
    icon: <Calculator className="h-3 w-3" />
  },
  km_teorico: { 
    label: 'vs Teórico', 
    color: 'bg-blue-100 text-blue-800',
    icon: <Route className="h-3 w-3" />
  },
  mapbox_api: { 
    label: 'Mapbox', 
    color: 'bg-green-100 text-green-800',
    icon: <MapPin className="h-3 w-3" />
  },
  correccion_nan: { 
    label: 'Fix NaN', 
    color: 'bg-purple-100 text-purple-800',
    icon: <AlertTriangle className="h-3 w-3" />
  },
  manual: { 
    label: 'Manual', 
    color: 'bg-gray-100 text-gray-800',
    icon: <CheckCircle2 className="h-3 w-3" />
  },
};

function formatNumber(num: number): string {
  return new Intl.NumberFormat('es-MX').format(Math.round(num));
}

function formatCurrency(num: number): string {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(num);
}

export default function AuditoriaKmDashboard() {
  const [prioridad, setPrioridad] = useState<string>('todos');
  const [limite, setLimite] = useState<number>(50);
  const [aplicarCambios, setAplicarCambios] = useState(false);
  const [usarMapbox, setUsarMapbox] = useState(true);

  const { data: estadisticas, isLoading: loadingStats } = useAuditoriaKmEstadisticas();
  const { data: correcciones, isLoading: loadingCorrecciones } = useAuditoriaKmCorrecciones(20);
  const { data: sospechosos, isLoading: loadingSospechosos } = useServiciosSospechosos(10);
  const ejecutarAuditoria = useEjecutarAuditoria();

  const handleEjecutar = () => {
    ejecutarAuditoria.mutate({
      prioridad: prioridad as any,
      limite,
      aplicarCambios,
      usarMapbox,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header con stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Auditados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold text-green-600">
                {formatNumber(estadisticas?.total_auditados || 0)}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-600" />
              Pendientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold text-amber-600">
                  {formatNumber(estadisticas?.pendientes_auditoria || 0)}
                </div>
                {(estadisticas?.registros_nan || 0) > 0 && (
                  <p className="text-xs text-purple-600">
                    Incluye {estadisticas?.registros_nan} con NaN
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-blue-600" />
              KM Corregidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold text-blue-600">
                {formatNumber(estadisticas?.km_total_corregido || 0)} km
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-emerald-600" />
              Impacto Estimado
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold text-emerald-600">
                {formatCurrency(estadisticas?.impacto_financiero_estimado || 0)}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Basado en $5/km promedio</p>
          </CardContent>
        </Card>
      </div>

      {/* Correcciones por método */}
      {estadisticas && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Correcciones por Método</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {Object.entries(estadisticas.por_metodo).map(([metodo, count]) => {
                const config = METODO_LABELS[metodo] || { label: metodo, color: 'bg-gray-100 text-gray-800', icon: null };
                return (
                  <div key={metodo} className="flex items-center gap-2">
                    <Badge variant="outline" className={`${config.color} flex items-center gap-1`}>
                      {config.icon}
                      {config.label}
                    </Badge>
                    <span className="font-semibold">{count}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Panel de ejecución */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Ejecutar Auditoría
          </CardTitle>
          <CardDescription>
            Analiza y corrige km_recorridos en servicios_custodia
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="space-y-2">
              <Label>Prioridad</Label>
              <Select value={prioridad} onValueChange={setPrioridad}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los pendientes</SelectItem>
                  <SelectItem value="extremos">Extremos (&gt;100,000 km)</SelectItem>
                  <SelectItem value="metros">Probables metros (&gt;10,000)</SelectItem>
                  <SelectItem value="sospechosos">Sospechosos (&gt;2,000)</SelectItem>
                  <SelectItem value="mismo_punto">Mismo origen/destino</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Límite de registros</Label>
              <Select value={String(limite)} onValueChange={(v) => setLimite(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 registros</SelectItem>
                  <SelectItem value="25">25 registros</SelectItem>
                  <SelectItem value="50">50 registros</SelectItem>
                  <SelectItem value="100">100 registros</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2 pt-6">
              <Switch id="mapbox" checked={usarMapbox} onCheckedChange={setUsarMapbox} />
              <Label htmlFor="mapbox">Usar Mapbox API</Label>
            </div>

            <div className="flex items-center space-x-2 pt-6">
              <Switch id="aplicar" checked={aplicarCambios} onCheckedChange={setAplicarCambios} />
              <Label htmlFor="aplicar" className={aplicarCambios ? 'text-red-600 font-medium' : ''}>
                Aplicar cambios
              </Label>
            </div>
          </div>

          {aplicarCambios && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium">⚠️ Modo de escritura activo</p>
                <p>Los cambios se aplicarán directamente a <code>servicios_custodia</code>. Los valores originales se guardarán en <code>km_original_backup</code>.</p>
              </div>
            </div>
          )}

          <Button 
            onClick={handleEjecutar} 
            disabled={ejecutarAuditoria.isPending}
            className="w-full md:w-auto"
          >
            {ejecutarAuditoria.isPending ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                {aplicarCambios ? 'Ejecutar y Aplicar Cambios' : 'Ejecutar Análisis (Solo Lectura)'}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Servicios sospechosos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Servicios Sospechosos (KM &gt; 1,500)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingSospechosos ? (
            <Skeleton className="h-32 w-full" />
          ) : sospechosos && sospechosos.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID Servicio</TableHead>
                  <TableHead>Origen</TableHead>
                  <TableHead>Destino</TableHead>
                  <TableHead className="text-right">KM Recorridos</TableHead>
                  <TableHead className="text-right">KM Teórico</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sospechosos.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono text-sm">{s.id_servicio || s.id}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{s.origen}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{s.destino}</TableCell>
                    <TableCell className="text-right font-bold text-red-600">
                      {formatNumber(s.km_recorridos || 0)} km
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {s.km_teorico ? `${formatNumber(s.km_teorico)} km` : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              No hay servicios sospechosos pendientes
            </p>
          )}
        </CardContent>
      </Card>

      {/* Historial de correcciones */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Correcciones Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingCorrecciones ? (
            <Skeleton className="h-48 w-full" />
          ) : correcciones && correcciones.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>ID Servicio</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead className="text-right">Original</TableHead>
                  <TableHead className="text-right">Corregido</TableHead>
                  <TableHead>Razón</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {correcciones.map((c) => {
                  const config = METODO_LABELS[c.metodo_correccion] || METODO_LABELS.manual;
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(c.created_at), 'dd MMM HH:mm', { locale: es })}
                      </TableCell>
                      <TableCell className="font-mono text-sm">{c.id_servicio || c.servicio_id}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`${config.color} flex items-center gap-1 w-fit`}>
                          {config.icon}
                          {config.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right line-through text-muted-foreground">
                        {formatNumber(c.km_original)} km
                      </TableCell>
                      <TableCell className="text-right font-medium text-green-600">
                        {formatNumber(c.km_corregido)} km
                      </TableCell>
                      <TableCell className="max-w-[300px] truncate text-sm">
                        {c.razon}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              No hay correcciones registradas aún
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
