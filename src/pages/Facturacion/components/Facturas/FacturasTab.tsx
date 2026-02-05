import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Receipt } from 'lucide-react';
import { ServiciosPorFacturarTab } from './ServiciosPorFacturarTab';
import { FacturasListTab } from './FacturasListTab';

interface FacturasTabProps {
  fechaInicio?: string;
  fechaFin?: string;
}

export function FacturasTab({ fechaInicio, fechaFin }: FacturasTabProps) {
  const [activeTab, setActiveTab] = useState('por-facturar');

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="h-9">
          <TabsTrigger value="por-facturar" className="text-xs h-7 px-3 gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            Por Facturar
          </TabsTrigger>
          <TabsTrigger value="emitidas" className="text-xs h-7 px-3 gap-1.5">
            <Receipt className="h-3.5 w-3.5" />
            Facturas Emitidas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="por-facturar" className="mt-4">
          <ServiciosPorFacturarTab fechaInicio={fechaInicio} fechaFin={fechaFin} />
        </TabsContent>

        <TabsContent value="emitidas" className="mt-4">
          <FacturasListTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
