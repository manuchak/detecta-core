/**
 * GadgetSection - Gadget selection with quantity controls
 * Wraps GadgetQuantitySelector component
 */

import { Package } from 'lucide-react';
import { GadgetQuantitySelector } from '@/components/planeacion/GadgetQuantitySelector';

interface GadgetSectionProps {
  gadgets: Record<string, number>;
  onGadgetChange: (gadgetId: string, cantidad: number) => void;
  totalGadgets: number;
}

const GADGET_OPTIONS = [
  { 
    id: 'candado_satelital', 
    label: 'Candado Satelital', 
    description: 'Dispositivo de bloqueo con rastreo GPS', 
    allowMultiple: true, 
    maxQuantity: 5 
  },
  { 
    id: 'gps_portatil', 
    label: 'GPS Portátil', 
    description: 'Dispositivo de rastreo portátil', 
    allowMultiple: true, 
    maxQuantity: 10 
  },
  { 
    id: 'gps_portatil_caja_imantada', 
    label: 'GPS Portátil con Caja Imantada', 
    description: 'GPS portátil con instalación magnética', 
    allowMultiple: false, 
    maxQuantity: 1 
  },
];

export function GadgetSection({ gadgets, onGadgetChange, totalGadgets }: GadgetSectionProps) {
  return (
    <div className="space-y-4">
      <h4 className="font-medium text-sm flex items-center gap-2">
        <Package className="h-4 w-4" />
        Gadgets de Seguridad
      </h4>

      <div className="space-y-3">
        {GADGET_OPTIONS.map((gadget) => (
          <GadgetQuantitySelector
            key={gadget.id}
            gadget={gadget}
            cantidad={gadgets[gadget.id] || 0}
            onCantidadChange={(cantidad) => onGadgetChange(gadget.id, cantidad)}
          />
        ))}
      </div>

      {/* Total count */}
      <div className="text-sm text-muted-foreground border-t pt-2">
        {totalGadgets > 0 ? (
          <span className="font-medium text-foreground">
            {totalGadgets} dispositivo{totalGadgets !== 1 ? 's' : ''} seleccionado{totalGadgets !== 1 ? 's' : ''}
          </span>
        ) : (
          <span>Sin dispositivos seleccionados</span>
        )}
      </div>
    </div>
  );
}
