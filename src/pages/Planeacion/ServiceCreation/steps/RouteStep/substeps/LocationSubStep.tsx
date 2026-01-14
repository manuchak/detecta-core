import { useEffect } from 'react';
import { MapPin, ArrowDown, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SmartOriginSelect } from '../components/SmartOriginSelect';
import { SmartDestinationSelect } from '../components/SmartDestinationSelect';

interface LocationSubStepProps {
  clienteNombre: string;
  selectedOrigen: string;
  selectedDestino: string;
  onOrigenChange: (origen: string) => void;
  onDestinoChange: (destino: string) => void;
  onSearchPrice: () => void;
  isSearchingPrice: boolean;
  onContinue: () => void;
}

export function LocationSubStep({
  clienteNombre,
  selectedOrigen,
  selectedDestino,
  onOrigenChange,
  onDestinoChange,
  onSearchPrice,
  isSearchingPrice,
  onContinue
}: LocationSubStepProps) {
  
  // Auto-trigger price search when both fields are complete
  useEffect(() => {
    if (selectedOrigen && selectedDestino) {
      onSearchPrice();
    }
  }, [selectedOrigen, selectedDestino, onSearchPrice]);

  const isComplete = selectedOrigen && selectedDestino;

  return (
    <Card className="border-2 border-muted">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          Selecciona la ruta
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Cliente: <span className="font-medium text-foreground">{clienteNombre}</span>
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Origin/Destination Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SmartOriginSelect
            clienteNombre={clienteNombre}
            selectedOrigen={selectedOrigen}
            onOrigenSelect={onOrigenChange}
          />
          
          <SmartDestinationSelect
            clienteNombre={clienteNombre}
            origenTexto={selectedOrigen}
            selectedDestino={selectedDestino}
            onDestinoSelect={onDestinoChange}
          />
        </div>

        {/* Visual Route Preview */}
        {selectedOrigen && (
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="font-medium">{selectedOrigen}</span>
              </div>
              
              <ArrowDown className="h-5 w-5 text-muted-foreground" />
              
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-destructive" />
                <span className={selectedDestino ? "font-medium" : "text-muted-foreground"}>
                  {selectedDestino || "Selecciona destino..."}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Searching indicator */}
        {isSearchingPrice && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            Buscando pricing...
          </div>
        )}

        {/* Continue button */}
        {isComplete && !isSearchingPrice && (
          <div className="flex justify-end pt-2">
            <Button onClick={onContinue}>
              Continuar
            </Button>
          </div>
        )}

        {/* Help text */}
        <p className="text-xs text-muted-foreground text-center">
          Los orígenes y destinos se muestran según el histórico de rutas del cliente
        </p>
      </CardContent>
    </Card>
  );
}
