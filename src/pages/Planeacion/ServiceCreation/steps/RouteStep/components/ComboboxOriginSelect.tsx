import { useState, useRef, useEffect, useMemo } from 'react';
import { MapPin, TrendingUp, Loader2, Plus, Check, ChevronsUpDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useOrigenesConFrecuencia } from '@/hooks/useOrigenesConFrecuencia';

interface ComboboxOriginSelectProps {
  clienteNombre: string;
  selectedOrigen: string;
  onOrigenSelect: (origen: string, isNew: boolean) => void;
  disabled?: boolean;
}

export function ComboboxOriginSelect({
  clienteNombre,
  selectedOrigen,
  onOrigenSelect,
  disabled = false
}: ComboboxOriginSelectProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { data: origenesConFrecuencia = [], isLoading } = useOrigenesConFrecuencia(clienteNombre);

  // Sort by frequency
  const sortedOrigenes = useMemo(() => {
    return [...origenesConFrecuencia].sort((a, b) => b.frecuencia - a.frecuencia);
  }, [origenesConFrecuencia]);

  // Filter based on input
  const filteredOrigenes = useMemo(() => {
    if (!inputValue) return sortedOrigenes;
    const normalizedInput = inputValue.toLowerCase().trim();
    return sortedOrigenes.filter(item => 
      item.origen.toLowerCase().includes(normalizedInput)
    );
  }, [sortedOrigenes, inputValue]);

  // Check if exact match exists
  const exactMatch = useMemo(() => {
    const normalizedInput = inputValue.toLowerCase().trim();
    return sortedOrigenes.some(item => 
      item.origen.toLowerCase() === normalizedInput
    );
  }, [sortedOrigenes, inputValue]);

  // Check if selected origen is new (not in existing list)
  const isSelectedNew = useMemo(() => {
    if (!selectedOrigen) return false;
    return !sortedOrigenes.some(item => 
      item.origen.toLowerCase() === selectedOrigen.toLowerCase()
    );
  }, [sortedOrigenes, selectedOrigen]);

  const handleSelectExisting = (origen: string) => {
    onOrigenSelect(origen, false);
    setInputValue('');
    setOpen(false);
  };

  const handleSelectManual = () => {
    const trimmed = inputValue.trim().toUpperCase();
    if (trimmed) {
      onOrigenSelect(trimmed, true);
      setInputValue('');
      setOpen(false);
    }
  };

  const hasOrigenes = sortedOrigenes.length > 0;
  const showManualOption = inputValue.trim() && !exactMatch;

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground flex items-center gap-2">
        <MapPin className="h-4 w-4 text-primary" />
        Origen
        {isSelectedNew && selectedOrigen && (
          <Badge variant="outline" className="text-xs bg-amber-50 border-amber-200 text-amber-700">
            Nuevo
          </Badge>
        )}
      </label>
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled || isLoading}
            className="w-full justify-between font-normal"
          >
            {isLoading ? (
              <span className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Cargando orígenes...
              </span>
            ) : selectedOrigen ? (
              <span className="truncate">{selectedOrigen}</span>
            ) : (
              <span className="text-muted-foreground">
                {hasOrigenes ? "Buscar o escribir origen..." : "Escribir origen..."}
              </span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 z-[200]" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              ref={inputRef}
              placeholder="Buscar o escribir origen..."
              value={inputValue}
              onValueChange={setInputValue}
            />
            <CommandList>
              {/* Manual entry option - always at top when there's text */}
              {showManualOption && (
                <>
                  <CommandGroup heading="Usar texto escrito">
                    <CommandItem
                      onSelect={handleSelectManual}
                      className="cursor-pointer"
                    >
                      <Plus className="mr-2 h-4 w-4 text-primary" />
                      <span className="flex-1">Usar: "{inputValue.trim().toUpperCase()}"</span>
                      <Badge variant="secondary" className="ml-2 text-xs">
                        Nuevo
                      </Badge>
                    </CommandItem>
                  </CommandGroup>
                  {filteredOrigenes.length > 0 && <CommandSeparator />}
                </>
              )}
              
              {/* Existing options */}
              {filteredOrigenes.length > 0 && (
                <CommandGroup heading={inputValue ? "Sugerencias" : "Orígenes frecuentes"}>
                  {filteredOrigenes.map((item) => (
                    <CommandItem
                      key={item.origen}
                      value={item.origen}
                      onSelect={() => handleSelectExisting(item.origen)}
                      className="cursor-pointer"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedOrigen === item.origen ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span className="flex-1 truncate">{item.origen}</span>
                      {item.frecuencia > 1 && (
                        <Badge variant="secondary" className="ml-2 text-xs shrink-0">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          {item.frecuencia}
                        </Badge>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              
              {/* Empty state */}
              {!showManualOption && filteredOrigenes.length === 0 && !isLoading && (
                <CommandEmpty>
                  <div className="py-3 text-center">
                    <p className="text-sm text-muted-foreground mb-2">
                      No hay orígenes registrados
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Escribe el nombre del origen para crear uno nuevo
                    </p>
                  </div>
                </CommandEmpty>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      
      {selectedOrigen && !isSelectedNew && (
        <p className="text-xs text-muted-foreground">
          {sortedOrigenes.find(o => o.origen === selectedOrigen)?.frecuencia || 0} servicios desde este origen
        </p>
      )}
      
      {isSelectedNew && selectedOrigen && (
        <p className="text-xs text-amber-600">
          Este origen es nuevo y se creará al confirmar la ruta
        </p>
      )}
    </div>
  );
}
