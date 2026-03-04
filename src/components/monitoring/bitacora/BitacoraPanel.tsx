import React, { useState } from 'react';
import { BitacoraServiceSelector } from './BitacoraServiceSelector';
import { EventTracker } from './EventTracker';
import { EventTimeline } from './EventTimeline';
import { BitacoraMap } from './BitacoraMap';
import { BitacoraGeneratorButton } from './BitacoraGenerator';
import { useEventosRuta } from '@/hooks/useEventosRuta';
import { Button } from '@/components/ui/button';
import { Map, FileDown } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';

export const BitacoraPanel: React.FC = () => {
  const [servicioId, setServicioId] = useState<string>('');
  const [mapOpen, setMapOpen] = useState(false);
  const { eventos } = useEventosRuta(servicioId || null);

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* 1. Service Carousel */}
      <BitacoraServiceSelector
        selectedServiceId={servicioId || null}
        onSelect={setServicioId}
      />

      {servicioId ? (
        <>
          {/* 2. Event Tracker — full width, the protagonist */}
          <EventTracker servicioId={servicioId} />

          {/* 3. Mini-timeline + action buttons */}
          <div className="rounded-lg border bg-card p-3">
            <EventTimeline servicioId={servicioId} compact maxVisible={3} />

            {/* Secondary actions */}
            <div className="flex items-center gap-2 mt-3 pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => setMapOpen(true)}
                disabled={eventos.filter(e => e.lat && e.lng).length === 0}
              >
                <Map className="h-3 w-3" />
                Ver mapa
              </Button>
              <BitacoraGeneratorButton
                servicioId={servicioId}
                eventos={eventos}
              />
            </div>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
          Selecciona un servicio en sitio para comenzar
        </div>
      )}

      {/* Map Sheet/Drawer */}
      <Sheet open={mapOpen} onOpenChange={setMapOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl p-0">
          <SheetHeader className="p-4 pb-2">
            <SheetTitle className="text-sm">Traza de Ruta</SheetTitle>
            <SheetDescription className="text-xs">
              Mapa con puntos GPS registrados en la bitácora
            </SheetDescription>
          </SheetHeader>
          <div className="h-[calc(100vh-80px)]">
            <BitacoraMap servicioId={servicioId} eventos={eventos} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};
