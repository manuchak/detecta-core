import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClipboardList, Clock, HandCoins, Milestone, Hotel } from 'lucide-react';
import { CortesPanel } from './CortesSemanales/CortesPanel';
import { EstadiasPanel } from './Estadias/EstadiasPanel';
import { ApoyosPanel } from './ApoyosExtraordinarios/ApoyosPanel';
import { CasetasPanel } from './Casetas/CasetasPanel';
import { HotelesPanel } from './Hoteles/HotelesPanel';

export function CxPOperativoTab() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">CxP OCA — Operaciones Custodios y Armados</h2>
        <p className="text-sm text-muted-foreground">
          Gestión de pagos a custodios y armados internos: cortes semanales, estadías, casetas, hoteles y apoyos extraordinarios.
        </p>
      </div>

      <Tabs defaultValue="cortes" className="w-full">
        <TabsList className="h-9">
          <TabsTrigger value="cortes" className="text-xs h-7 px-3 gap-1.5">
            <ClipboardList className="h-3.5 w-3.5" />
            Cortes Semanales
          </TabsTrigger>
          <TabsTrigger value="estadias" className="text-xs h-7 px-3 gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            Estadías
          </TabsTrigger>
          <TabsTrigger value="apoyos" className="text-xs h-7 px-3 gap-1.5">
            <HandCoins className="h-3.5 w-3.5" />
            Apoyos Extra
          </TabsTrigger>
          <TabsTrigger value="casetas" className="text-xs h-7 px-3 gap-1.5">
            <Milestone className="h-3.5 w-3.5" />
            Casetas
          </TabsTrigger>
          <TabsTrigger value="hoteles" className="text-xs h-7 px-3 gap-1.5">
            <Hotel className="h-3.5 w-3.5" />
            Hoteles
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cortes" className="mt-4">
          <CortesPanel />
        </TabsContent>
        <TabsContent value="estadias" className="mt-4">
          <EstadiasPanel />
        </TabsContent>
        <TabsContent value="apoyos" className="mt-4">
          <ApoyosPanel />
        </TabsContent>
        <TabsContent value="casetas" className="mt-4">
          <CasetasPanel />
        </TabsContent>
        <TabsContent value="hoteles" className="mt-4">
          <HotelesPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
