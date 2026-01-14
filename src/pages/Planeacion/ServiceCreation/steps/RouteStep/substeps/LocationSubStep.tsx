import { useEffect } from 'react';
import { MapPin, ArrowDown, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ComboboxOriginSelect } from '../components/ComboboxOriginSelect';
import { ComboboxDestinationSelect } from '../components/ComboboxDestinationSelect';

interface LocationSubStepProps {
  clienteNombre: string;
  selectedOrigen: string;
  selectedDestino: string;
  isNewOrigen: boolean;
  isNewDestino: boolean;
  onOrigenChange: (origen: string, isNew: boolean) => void;
  onDestinoChange: (destino: string, isNew: boolean) => void;
  onSearchPrice: () => void;
  isSearchingPrice: boolean;
}

export function LocationSubStep({
  clienteNombre,
  selectedOrigen,
  selectedDestino,
  isNewOrigen,
  isNewDestino,
  onOrigenChange,
  onDestinoChange,
  onSearchPrice,
  isSearchingPrice
}: LocationSubStepProps) {
  
  // Auto-trigger price search when both fields are complete AND neither is new
  useEffect(() => {
    if (selectedOrigen && selectedDestino && !isNewOrigen && !isNewDestino) {
      onSearchPrice();
    }
  }, [selectedOrigen, selectedDestino, isNewOrigen, isNewDestino, onSearchPrice]);

  const isComplete = selectedOrigen && selectedDestino;
  const isNewRoute = isNewOrigen || isNewDestino;

  return (
    <Card className="border-2 border-muted">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          Selecciona la ruta
          {isNewRoute && (
            <Badge variant="outline" className="bg-amber-50 border-amber-200 text-amber-700">
              Nueva ruta
            </Badge>
          )}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Cliente: <span className="font-medium text-foreground">{clienteNombre}</span>
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Origin/Destination Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ComboboxOriginSelect
            clienteNombre={clienteNombre}
            selectedOrigen={selectedOrigen}
            onOrigenSelect={onOrigenChange}
          />
          
          <ComboboxDestinationSelect
            clienteNombre={clienteNombre}
            origenTexto={selectedOrigen}
            isOrigenNew={isNewOrigen}
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
                {isNewOrigen && (
                  <Badge variant="outline" className="text-xs bg-amber-50 border-amber-200 text-amber-700">
                    Nuevo
                  </Badge>
                )}
              </div>
              
              <ArrowDown className="h-5 w-5 text-muted-foreground" />
              
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-destructive" />
                <span className={selectedDestino ? "font-medium" : "text-muted-foreground"}>
                  {selectedDestino || "Selecciona destino..."}
                </span>
                {isNewDestino && selectedDestino && (
                  <Badge variant="outline" className="text-xs bg-amber-50 border-amber-200 text-amber-700">
                    Nuevo
                  </Badge>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Searching indicator - only when not a new route */}
        {isSearchingPrice && !isNewRoute && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            Buscando pricing...
          </div>
        )}

        {/* New route indicator */}
        {isComplete && isNewRoute && (
          <div className="flex items-center justify-center gap-2 text-sm text-amber-600 py-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
            <AlertTriangle className="h-4 w-4" />
            <span>Esta es una ruta nueva — necesitarás configurar los precios</span>
          </div>
        )}

        {/* Ready indicator - navigation handled by footer */}
        {isComplete && !isSearchingPrice && !isNewRoute && (
          <div className="flex items-center justify-center gap-2 text-sm text-green-600 dark:text-green-400 py-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
            <CheckCircle className="h-4 w-4" />
            <span>Ruta seleccionada — usa "Continuar" abajo</span>
          </div>
        )}

        {/* Help text */}
        <p className="text-xs text-muted-foreground text-center">
          {isNewRoute 
            ? "Puedes escribir nuevos orígenes o destinos que no estén registrados"
            : "Los orígenes y destinos se muestran según el histórico de rutas del cliente"
          }
        </p>
      </CardContent>
    </Card>
  );
}
