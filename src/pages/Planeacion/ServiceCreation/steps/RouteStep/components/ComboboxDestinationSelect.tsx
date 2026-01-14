import { useState, useRef, useMemo } from 'react';
import { MapPin, Loader2, Plus, Check, ChevronsUpDown } from 'lucide-react';
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
import { useDestinosFromPricing } from '@/hooks/useClientesFromPricing';

interface ComboboxDestinationSelectProps {
  clienteNombre: string;
  origenTexto: string;
  isOrigenNew: boolean;
  selectedDestino: string;
  onDestinoSelect: (destino: string, isNew: boolean) => void;
  disabled?: boolean;
}

export function ComboboxDestinationSelect({
  clienteNombre,
  origenTexto,
  isOrigenNew,
  selectedDestino,
  onDestinoSelect,
  disabled = false
}: ComboboxDestinationSelectProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Don't fetch destinations if origen is new (won't find any)
  const { data: destinos = [], isLoading } = useDestinosFromPricing(
    clienteNombre, 
    isOrigenNew ? '' : origenTexto
  );

  // Sort alphabetically
  const sortedDestinos = useMemo(() => {
    return [...destinos].sort((a, b) => a.localeCompare(b));
  }, [destinos]);

  // Filter based on input
  const filteredDestinos = useMemo(() => {
    if (!inputValue) return sortedDestinos;
    const normalizedInput = inputValue.toLowerCase().trim();
    return sortedDestinos.filter(destino => 
      destino.toLowerCase().includes(normalizedInput)
    );
  }, [sortedDestinos, inputValue]);

  // Check if exact match exists
  const exactMatch = useMemo(() => {
    const normalizedInput = inputValue.toLowerCase().trim();
    return sortedDestinos.some(destino => 
      destino.toLowerCase() === normalizedInput
    );
  }, [sortedDestinos, inputValue]);

  // Check if selected destino is new (not in existing list)
  const isSelectedNew = useMemo(() => {
    if (!selectedDestino) return false;
    return !sortedDestinos.some(destino => 
      destino.toLowerCase() === selectedDestino.toLowerCase()
    );
  }, [sortedDestinos, selectedDestino]);

  const handleSelectExisting = (destino: string) => {
    onDestinoSelect(destino, false);
    setInputValue('');
    setOpen(false);
  };

  const handleSelectManual = () => {
    const trimmed = inputValue.trim().toUpperCase();
    if (trimmed) {
      onDestinoSelect(trimmed, true);
      setInputValue('');
      setOpen(false);
    }
  };

  const hasDestinos = sortedDestinos.length > 0;
  const showManualOption = inputValue.trim() && !exactMatch;
  const isDisabled = disabled || isLoading || !origenTexto;

  // Determine help message
  const getHelpMessage = () => {
    if (!origenTexto) return "Selecciona un origen primero";
    if (isOrigenNew) return "El origen es nuevo, escribe el destino manualmente";
    if (!hasDestinos && !isLoading) return "No hay destinos registrados, escribe uno nuevo";
    return null;
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground flex items-center gap-2">
        <MapPin className="h-4 w-4 text-destructive" />
        Destino
        {isSelectedNew && selectedDestino && (
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
            disabled={isDisabled && !isOrigenNew}
            className="w-full justify-between font-normal"
          >
            {isLoading && !isOrigenNew ? (
              <span className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Cargando destinos...
              </span>
            ) : !origenTexto ? (
              <span className="text-muted-foreground">Selecciona primero un origen</span>
            ) : selectedDestino ? (
              <span className="truncate">{selectedDestino}</span>
            ) : (
              <span className="text-muted-foreground">
                {hasDestinos ? "Buscar o escribir destino..." : "Escribir destino..."}
              </span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 z-[200]" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              ref={inputRef}
              placeholder="Buscar o escribir destino..."
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
                  {filteredDestinos.length > 0 && <CommandSeparator />}
                </>
              )}
              
              {/* Existing options */}
              {filteredDestinos.length > 0 && (
                <CommandGroup heading={inputValue ? "Sugerencias" : "Destinos disponibles"}>
                  {filteredDestinos.map((destino) => (
                    <CommandItem
                      key={destino}
                      value={destino}
                      onSelect={() => handleSelectExisting(destino)}
                      className="cursor-pointer"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedDestino === destino ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span className="truncate">{destino}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              
              {/* Empty state with context */}
              {!showManualOption && filteredDestinos.length === 0 && !isLoading && (
                <CommandEmpty>
                  <div className="py-3 text-center">
                    {isOrigenNew ? (
                      <>
                        <p className="text-sm text-amber-600 mb-2">
                          Origen nuevo seleccionado
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Escribe el destino para esta nueva ruta
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-muted-foreground mb-2">
                          No hay destinos para este origen
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Escribe el nombre del destino para crear uno nuevo
                        </p>
                      </>
                    )}
                  </div>
                </CommandEmpty>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      
      {getHelpMessage() && (
        <p className="text-xs text-muted-foreground">
          {getHelpMessage()}
        </p>
      )}
      
      {isSelectedNew && selectedDestino && (
        <p className="text-xs text-amber-600">
          Este destino es nuevo y se creará al confirmar la ruta
        </p>
      )}
    </div>
  );
}
