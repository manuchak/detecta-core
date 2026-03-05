import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Receipt, Wallet, BarChart3 } from 'lucide-react';
import { FacturasTab } from './Facturas/FacturasTab';
import { CuentasPorCobrarTab } from './CuentasPorCobrar/CuentasPorCobrarTab';

interface Props {
  fechaInicio: string;
  fechaFin: string;
}

export function IngresosTab({ fechaInicio, fechaFin }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Ingresos — Facturación y CxC</h2>
        <p className="text-sm text-muted-foreground">
          Generación de facturas, seguimiento de cobranza y aging de cuentas por cobrar.
        </p>
      </div>

      <Tabs defaultValue="facturas" className="w-full">
        <TabsList className="h-9">
          <TabsTrigger value="facturas" className="text-xs h-7 px-3 gap-1.5">
            <Receipt className="h-3.5 w-3.5" />
            Facturas
          </TabsTrigger>
          <TabsTrigger value="cxc" className="text-xs h-7 px-3 gap-1.5">
            <Wallet className="h-3.5 w-3.5" />
            Cuentas por Cobrar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="facturas" className="mt-4">
          <FacturasTab fechaInicio={fechaInicio} fechaFin={fechaFin} />
        </TabsContent>
        <TabsContent value="cxc" className="mt-4">
          <CuentasPorCobrarTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
