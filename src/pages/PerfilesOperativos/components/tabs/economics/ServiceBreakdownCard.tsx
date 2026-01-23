import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { MapPin } from 'lucide-react';
import { CustodioEconomics } from '../../../hooks/useProfileEconomics';

interface ServiceBreakdownCardProps {
  economics: CustodioEconomics;
}

export function ServiceBreakdownCard({ economics }: ServiceBreakdownCardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const totalServicios = economics.serviciosLocales + economics.serviciosForaneos;
  const porcentajeLocales = totalServicios > 0 
    ? Math.round((economics.serviciosLocales / totalServicios) * 100) 
    : 0;
  const porcentajeForaneos = 100 - porcentajeLocales;

  const promedioLocal = economics.serviciosLocales > 0 
    ? economics.ingresoLocales / economics.serviciosLocales 
    : 0;
  const promedioForaneo = economics.serviciosForaneos > 0 
    ? economics.ingresoForaneos / economics.serviciosForaneos 
    : 0;

  const data = [
    { 
      name: 'Locales (<100km)', 
      value: economics.serviciosLocales,
      ingresos: economics.ingresoLocales,
      promedio: promedioLocal,
      color: 'hsl(var(--primary))'
    },
    { 
      name: 'Foráneos (≥100km)', 
      value: economics.serviciosForaneos,
      ingresos: economics.ingresoForaneos,
      promedio: promedioForaneo,
      color: 'hsl(var(--secondary))'
    }
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-muted-foreground">{data.value} servicios</p>
          <p className="text-sm">{formatCurrency(data.ingresos)}</p>
          <p className="text-xs text-muted-foreground">Promedio: {formatCurrency(data.promedio)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <MapPin className="h-5 w-5 text-primary" />
          Desglose por Tipo de Servicio
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="text-center p-3 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-2xl font-bold text-primary">{porcentajeLocales}%</p>
            <p className="text-xs text-muted-foreground">Locales</p>
            <p className="text-sm font-medium mt-1">{formatCurrency(promedioLocal)}/srv</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-secondary/20 border border-secondary/30">
            <p className="text-2xl font-bold text-secondary-foreground">{porcentajeForaneos}%</p>
            <p className="text-xs text-muted-foreground">Foráneos</p>
            <p className="text-sm font-medium mt-1">{formatCurrency(promedioForaneo)}/srv</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
