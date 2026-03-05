import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, AlertTriangle, DollarSign } from 'lucide-react';
import { ServiciosConsulta } from './ServiciosConsulta';
import { IncidenciasTab } from './Incidencias/IncidenciasTab';
import { GastosExtraTab } from './GastosExtraordinarios/GastosExtraTab';
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
          Consulta de servicios, incidencias y gastos extraordinarios.
        </p>
      </div>

      <Tabs defaultValue="servicios" className="w-full">
        <TabsList className="h-9">
          <TabsTrigger value="servicios" className="text-xs h-7 px-3 gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            Servicios
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

        <TabsContent value="servicios" className="mt-4">
          <ServiciosConsulta servicios={servicios} isLoading={isLoading} clientes={clientes} />
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
