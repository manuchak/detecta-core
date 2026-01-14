import { useMemo } from 'react';
import { MapPin, TrendingUp, Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useOrigenesConFrecuencia } from '@/hooks/useOrigenesConFrecuencia';

interface SmartOriginSelectProps {
  clienteNombre: string;
  selectedOrigen: string;
  onOrigenSelect: (origen: string) => void;
  disabled?: boolean;
}

export function SmartOriginSelect({
  clienteNombre,
  selectedOrigen,
  onOrigenSelect,
  disabled = false
}: SmartOriginSelectProps) {
  const { data: origenesConFrecuencia = [], isLoading } = useOrigenesConFrecuencia(clienteNombre);

  // Ordenar por frecuencia (ya viene ordenado del hook, pero aseguramos)
  const sortedOrigenes = useMemo(() => {
    return [...origenesConFrecuencia].sort((a, b) => b.frecuencia - a.frecuencia);
  }, [origenesConFrecuencia]);

  const hasOrigenes = sortedOrigenes.length > 0;

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground flex items-center gap-2">
        <MapPin className="h-4 w-4 text-primary" />
        Origen
      </label>
      
      <Select
        value={selectedOrigen}
        onValueChange={onOrigenSelect}
        disabled={disabled || isLoading}
      >
        <SelectTrigger className="w-full">
          {isLoading ? (
            <span className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando orígenes...
            </span>
          ) : (
            <SelectValue placeholder={hasOrigenes ? "Selecciona origen" : "No hay orígenes registrados"} />
          )}
        </SelectTrigger>
        
        <SelectContent className="z-[200] max-h-[300px]">
          {sortedOrigenes.map((item) => (
            <SelectItem 
              key={item.origen} 
              value={item.origen}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2 w-full justify-between">
                <span className="truncate max-w-[200px]">{item.origen}</span>
                {item.frecuencia > 1 && (
                  <Badge variant="secondary" className="ml-2 text-xs shrink-0">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {item.frecuencia}
                  </Badge>
                )}
              </div>
            </SelectItem>
          ))}
          
          {!isLoading && !hasOrigenes && (
            <div className="p-3 text-sm text-muted-foreground text-center">
              No hay orígenes registrados para este cliente
            </div>
          )}
        </SelectContent>
      </Select>
      
      {selectedOrigen && (
        <p className="text-xs text-muted-foreground">
          {sortedOrigenes.find(o => o.origen === selectedOrigen)?.frecuencia || 0} servicios desde este origen
        </p>
      )}
    </div>
  );
}
