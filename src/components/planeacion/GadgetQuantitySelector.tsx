import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GadgetOption {
  id: string;
  label: string;
  description: string;
}

interface GadgetQuantitySelectorProps {
  gadget: GadgetOption;
  cantidad: number; // 0 = no seleccionado
  onCantidadChange: (cantidad: number) => void;
  maxQuantity?: number;
}

export function GadgetQuantitySelector({ 
  gadget, 
  cantidad, 
  onCantidadChange,
  maxQuantity = 10 
}: GadgetQuantitySelectorProps) {
  const isSelected = cantidad > 0;

  const handleToggle = (checked: boolean) => {
    onCantidadChange(checked ? 1 : 0);
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (cantidad > 1) {
      onCantidadChange(cantidad - 1);
    } else if (cantidad === 1) {
      onCantidadChange(0); // Deselect when going below 1
    }
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (cantidad < maxQuantity) {
      onCantidadChange(cantidad + 1);
    }
  };

  return (
    <div 
      className={cn(
        "flex items-center justify-between p-3 rounded-lg border transition-colors",
        isSelected 
          ? "bg-primary/5 border-primary/30" 
          : "bg-background/50 border-border"
      )}
    >
      <div className="flex items-start space-x-3 flex-1">
        <Checkbox
          id={gadget.id}
          checked={isSelected}
          onCheckedChange={handleToggle}
          className="mt-0.5"
        />
        <div className="space-y-1 flex-1">
          <Label 
            htmlFor={gadget.id} 
            className={cn(
              "text-sm font-medium cursor-pointer",
              isSelected && "text-primary"
            )}
          >
            {gadget.label}
          </Label>
          <div className="text-xs text-muted-foreground">
            {gadget.description}
          </div>
        </div>
      </div>

      {/* Quantity Stepper - Only show when selected */}
      {isSelected && (
        <div className="flex items-center gap-1 ml-4">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={handleDecrement}
            disabled={cantidad <= 1}
          >
            <Minus className="h-3 w-3" />
          </Button>
          
          <div className="w-8 text-center font-medium text-sm tabular-nums">
            {cantidad}
          </div>
          
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={handleIncrement}
            disabled={cantidad >= maxQuantity}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}
