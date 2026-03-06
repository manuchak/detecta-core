import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, AlertTriangle, DollarSign, Clock } from 'lucide-react';
import { ServiciosConsulta } from './ServiciosConsulta';
import { IncidenciasTab } from './Incidencias/IncidenciasTab';
import { GastosExtraTab } from './GastosExtraordinarios/GastosExtraTab';
import { TiemposOperativosPanel } from './TiemposOperativosPanel';
import type { ServicioFacturacion } from '../hooks/useServiciosFacturacion';

interface Props {
  servicios: ServicioFacturacion[];
  isLoading: boolean;
  clientes: string[];
}

export function OperacionesTab({ servicios, isLoading, clientes }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Operaciones</h2>
        <p className="text-sm text-muted-foreground">
          Histórico de servicios, tiempos operativos, incidencias y gastos extraordinarios.
        </p>
      </div>

      <Tabs defaultValue="historico" className="w-full">
        <TabsList className="h-9">
          <TabsTrigger value="historico" className="text-xs h-7 px-3 gap-1.5">
            <BarChart3 className="h-3.5 w-3.5" />
            Histórico Insights
          </TabsTrigger>
          <TabsTrigger value="tiempos" className="text-xs h-7 px-3 gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            Tiempos Ops
          </TabsTrigger>
          <TabsTrigger value="incidencias" className="text-xs h-7 px-3 gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" />
            Incidencias
          </TabsTrigger>
          <TabsTrigger value="gastos" className="text-xs h-7 px-3 gap-1.5">
            <DollarSign className="h-3.5 w-3.5" />
            Gastos Extra
          </TabsTrigger>
        </TabsList>

        <TabsContent value="historico" className="mt-4">
          <ServiciosConsulta servicios={servicios} isLoading={isLoading} clientes={clientes} />
        </TabsContent>
        <TabsContent value="tiempos" className="mt-4">
          <TiemposOperativosPanel />
        </TabsContent>
        <TabsContent value="incidencias" className="mt-4">
          <IncidenciasTab />
        </TabsContent>
        <TabsContent value="gastos" className="mt-4">
          <GastosExtraTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
