import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { TrendingUp, TrendingDown, Target, Package, Loader2 } from 'lucide-react';
import { useGadgetsPnL } from '../../hooks/useInventarioGadgets';

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(v);

export function GadgetsPnLPanel() {
  const [mes, setMes] = useState(new Date().toISOString().slice(0, 7));
  const { data: pnl, isLoading } = useGadgetsPnL(mes);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const margenPositivo = (pnl?.margen || 0) >= 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">P&L Gadgets</h3>
          <p className="text-xs text-muted-foreground">Ingresos por gadgets vs costo de renta mensual</p>
        </div>
        <Input
          type="month"
          value={mes}
          onChange={e => setMes(e.target.value)}
          className="w-[160px] h-8 text-xs"
        />
      </div>

      {/* Main P&L Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 border-l-4 border-l-emerald-500">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            <span className="text-xs font-medium text-muted-foreground">INGRESOS</span>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(pnl?.ingresos || 0)}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {pnl?.serviciosFacturados || 0} servicios facturados de {pnl?.serviciosConGadget || 0} con gadget
          </p>
        </Card>

        <Card className="p-4 border-l-4 border-l-red-500">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="h-4 w-4 text-red-500" />
            <span className="text-xs font-medium text-muted-foreground">EGRESOS</span>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(pnl?.egresos || 0)}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {pnl?.totalUnidadesRentadas || 0} unidades rentadas
          </p>
        </Card>

        <Card className={`p-4 border-l-4 ${margenPositivo ? 'border-l-primary' : 'border-l-destructive'}`}>
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-muted-foreground">MARGEN</span>
          </div>
          <p className={`text-2xl font-bold ${margenPositivo ? 'text-emerald-600' : 'text-destructive'}`}>
            {formatCurrency(pnl?.margen || 0)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {(pnl?.margenPct || 0).toFixed(1)}% margen
          </p>
        </Card>
      </div>

      {/* Inventario Summary */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Package className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-semibold">Inventario Activo</span>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-lg font-bold">{pnl?.totalActivos || 0}</p>
            <p className="text-[10px] text-muted-foreground">Total Activos</p>
          </div>
          <div>
            <p className="text-lg font-bold text-primary">{pnl?.totalPropios || 0}</p>
            <p className="text-[10px] text-muted-foreground">Propios (GPS)</p>
          </div>
          <div>
            <p className="text-lg font-bold text-warning">{pnl?.totalRentados || 0}</p>
            <p className="text-[10px] text-muted-foreground">Rentados</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
