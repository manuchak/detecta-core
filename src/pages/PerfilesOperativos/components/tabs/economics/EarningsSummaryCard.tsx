import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, TrendingDown, MapPin, Clock, Briefcase } from 'lucide-react';
import { CustodioEconomics } from '../../../hooks/useProfileEconomics';

interface EarningsSummaryCardProps {
  economics: CustodioEconomics;
}

export function EarningsSummaryCard({ economics }: EarningsSummaryCardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('es-MX').format(Math.round(value));
  };

  const variacionPositiva = economics.variacionIngresosMTD >= 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {/* Ingresos Totales */}
      <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-emerald-500" />
            Ingresos Totales
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-emerald-600">
            {formatCurrency(economics.ingresosTotales)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Histórico completo
          </p>
        </CardContent>
      </Card>

      {/* Ingresos MTD */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Mes Actual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(economics.ingresosMTD)}
          </div>
          <div className={`flex items-center gap-1 text-xs mt-1 ${variacionPositiva ? 'text-emerald-600' : 'text-red-500'}`}>
            {variacionPositiva ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {variacionPositiva ? '+' : ''}{economics.variacionIngresosMTD.toFixed(1)}% vs mes anterior
          </div>
        </CardContent>
      </Card>

      {/* Kilómetros */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Kilómetros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatNumber(economics.kmTotales)} km
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Este mes: {formatNumber(economics.kmMTD)} km
          </p>
        </CardContent>
      </Card>

      {/* Servicios */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Servicios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {economics.serviciosTotales}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Este mes: {economics.serviciosMTD}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
