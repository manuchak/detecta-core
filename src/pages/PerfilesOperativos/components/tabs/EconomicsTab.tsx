import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, DollarSign, TrendingUp, Calendar, Percent, Clock, PiggyBank } from 'lucide-react';
import { useCustodioROI } from '../../hooks/useOperativeProfile';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface EconomicsTabProps {
  custodioId: string;
  tipo: 'custodio' | 'armado';
}

export function EconomicsTab({ custodioId, tipo }: EconomicsTabProps) {
  const { data: roi, isLoading, isError } = useCustodioROI(custodioId);

  if (tipo === 'armado') {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Las métricas económicas para armados están en desarrollo</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Error al cargar datos económicos
      </div>
    );
  }

  if (!roi) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <PiggyBank className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No hay datos de ROI disponibles para este custodio</p>
        <p className="text-sm mt-2">Los datos se calculan automáticamente al completar servicios</p>
      </div>
    );
  }

  const roiColor = (roi.roi_percentage || 0) >= 100 
    ? 'text-green-500' 
    : (roi.roi_percentage || 0) >= 50 
      ? 'text-amber-500' 
      : 'text-red-500';

  const MetricCard = ({ 
    icon: Icon, 
    label, 
    value, 
    subValue,
    color 
  }: { 
    icon: any; 
    label: string; 
    value: string | number; 
    subValue?: string;
    color: string;
  }) => (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className={`p-2 rounded-lg ${color}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{value}</p>
            {subValue && <p className="text-xs text-muted-foreground">{subValue}</p>}
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-3">{label}</p>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Periodo del reporte */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Métricas Económicas (ROI)</h3>
        <Badge variant="outline" className="text-xs">
          {roi.periodo_inicio && roi.periodo_fin && (
            <>
              {format(new Date(roi.periodo_inicio), "MMM yyyy", { locale: es })} - {format(new Date(roi.periodo_fin), "MMM yyyy", { locale: es })}
            </>
          )}
        </Badge>
      </div>

      {/* ROI Principal */}
      <Card className="bg-gradient-to-br from-emerald-500/5 to-emerald-500/10 border-emerald-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="h-5 w-5 text-emerald-500" />
            Return on Investment (ROI)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-5xl font-bold ${roiColor}`}>
                {(roi.roi_percentage || 0).toFixed(1)}%
              </p>
              <p className="text-muted-foreground mt-2">
                Retorno sobre inversión total
              </p>
            </div>
            <div className="text-right space-y-1">
              <p className="text-sm">
                <span className="text-muted-foreground">Inversión:</span>{' '}
                <span className="font-medium">${(roi.inversion_total || 0).toLocaleString()}</span>
              </p>
              <p className="text-sm">
                <span className="text-muted-foreground">Ingresos:</span>{' '}
                <span className="font-medium text-green-600">${(roi.ingresos_generados || 0).toLocaleString()}</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Métricas principales */}
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard
          icon={DollarSign}
          label="Inversión Total"
          value={`$${(roi.inversion_total || 0).toLocaleString()}`}
          subValue="Costo de adquisición + operación"
          color="bg-red-500/10 text-red-500"
        />
        <MetricCard
          icon={TrendingUp}
          label="Ingresos Generados"
          value={`$${(roi.ingresos_generados || 0).toLocaleString()}`}
          subValue="Por servicios completados"
          color="bg-green-500/10 text-green-500"
        />
        <MetricCard
          icon={PiggyBank}
          label="LTV Estimado"
          value={`$${(roi.ltv_estimado || 0).toLocaleString()}`}
          subValue="Lifetime Value proyectado"
          color="bg-purple-500/10 text-purple-500"
        />
        <MetricCard
          icon={Clock}
          label="Payback"
          value={`${roi.payback_dias || 0} días`}
          subValue="Tiempo de recuperación"
          color="bg-amber-500/10 text-amber-500"
        />
      </div>

      {/* Detalles adicionales */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{roi.dias_activo || 0}</p>
                <p className="text-sm text-muted-foreground">Días activo</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{roi.servicios_completados || 0}</p>
                <p className="text-sm text-muted-foreground">Servicios completados</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">${(roi.costo_adquisicion || 0).toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Costo de adquisición</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Estado del custodio */}
      {roi.estado_custodio && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Estado según ROI:</span>
              <Badge variant={roi.estado_custodio === 'rentable' ? 'default' : 'secondary'}>
                {roi.estado_custodio}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
