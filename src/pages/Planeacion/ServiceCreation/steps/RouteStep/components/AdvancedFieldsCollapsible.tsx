import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface AdvancedFieldsCollapsibleProps {
  costoOperativo: string;
  onCostoOperativoChange: (value: string) => void;
  pagoCustodioSinArma: string;
  onPagoCustodioSinArmaChange: (value: string) => void;
}

export function AdvancedFieldsCollapsible({
  costoOperativo,
  onCostoOperativoChange,
  pagoCustodioSinArma,
  onPagoCustodioSinArmaChange,
}: AdvancedFieldsCollapsibleProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-2 text-muted-foreground hover:text-foreground p-0 h-auto"
        >
          {isOpen ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
          {isOpen ? 'Ocultar' : 'Mostrar'} opciones avanzadas
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent className="pt-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="costo_operativo">Costo Operativo</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="costo_operativo"
                type="number"
                placeholder="0"
                value={costoOperativo}
                onChange={(e) => onCostoOperativoChange(e.target.value)}
                className="pl-7"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pago_sin_arma">Pago Custodio (sin arma)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="pago_sin_arma"
                type="number"
                placeholder="0"
                value={pagoCustodioSinArma}
                onChange={(e) => onPagoCustodioSinArmaChange(e.target.value)}
                className="pl-7"
              />
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
