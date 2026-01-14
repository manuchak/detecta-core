import { useMemo } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDestinosFromPricing } from '@/hooks/useClientesFromPricing';

interface SmartDestinationSelectProps {
  clienteNombre: string;
  origenTexto: string;
  selectedDestino: string;
  onDestinoSelect: (destino: string) => void;
  disabled?: boolean;
}

export function SmartDestinationSelect({
  clienteNombre,
  origenTexto,
  selectedDestino,
  onDestinoSelect,
  disabled = false
}: SmartDestinationSelectProps) {
  const { data: destinos = [], isLoading } = useDestinosFromPricing(clienteNombre, origenTexto);

  // Ordenar alfabéticamente
  const sortedDestinos = useMemo(() => {
    return [...destinos].sort((a, b) => a.localeCompare(b));
  }, [destinos]);

  const hasDestinos = sortedDestinos.length > 0;
  const isDisabled = disabled || isLoading || !origenTexto;

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground flex items-center gap-2">
        <MapPin className="h-4 w-4 text-destructive" />
        Destino
      </label>
      
      <Select
        value={selectedDestino}
        onValueChange={onDestinoSelect}
        disabled={isDisabled}
      >
        <SelectTrigger className="w-full">
          {isLoading ? (
            <span className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando destinos...
            </span>
          ) : !origenTexto ? (
            <span className="text-muted-foreground">Selecciona primero un origen</span>
          ) : (
            <SelectValue placeholder={hasDestinos ? "Selecciona destino" : "No hay destinos registrados"} />
          )}
        </SelectTrigger>
        
        <SelectContent className="z-[200] max-h-[300px]">
          {sortedDestinos.map((destino) => (
            <SelectItem 
              key={destino} 
              value={destino}
            >
              <span className="truncate">{destino}</span>
            </SelectItem>
          ))}
          
          {!isLoading && origenTexto && !hasDestinos && (
            <div className="p-3 text-sm text-muted-foreground text-center">
              No hay destinos registrados para este origen
            </div>
          )}
        </SelectContent>
      </Select>
      
      {!origenTexto && (
        <p className="text-xs text-muted-foreground">
          Selecciona un origen para ver destinos disponibles
        </p>
      )}
    </div>
  );
}
