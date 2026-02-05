import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Search, Plus, Building2, MapPin, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useClienteSearch, useCreateCliente, ClienteEnRutas } from '@/hooks/useClientesEnRutas';
import { useDebounce } from '@/hooks/useDebounce';

interface ClienteSelectorForRoutesProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function ClienteSelectorForRoutes({
  value,
  onChange,
  placeholder = 'Buscar cliente...',
  disabled = false,
  className
}: ClienteSelectorForRoutesProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const debouncedSearch = useDebounce(inputValue, 300);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: searchResults = [], isLoading } = useClienteSearch(debouncedSearch);
  const createCliente = useCreateCliente();

  // Sincronizar con valor externo
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setOpen(true);
  }, []);

  const handleSelect = useCallback((cliente: ClienteEnRutas) => {
    setInputValue(cliente.nombre);
    onChange(cliente.nombre);
    setOpen(false);
  }, [onChange]);

  const handleCreateNew = useCallback(async () => {
    if (!inputValue.trim()) return;
    
    try {
      await createCliente.mutateAsync({ nombre: inputValue.trim() });
      onChange(inputValue.trim());
      setOpen(false);
    } catch (error) {
      // Error ya manejado en el hook
    }
  }, [inputValue, createCliente, onChange]);

  const handleBlur = useCallback(() => {
    // Si el usuario escribió algo y sale del campo, usar ese valor
    if (inputValue.trim() && inputValue !== value) {
      onChange(inputValue.trim());
    }
    // Cerrar el popover después de un pequeño delay para permitir clicks
    setTimeout(() => setOpen(false), 200);
  }, [inputValue, value, onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (searchResults.length > 0) {
        handleSelect(searchResults[0]);
      } else if (inputValue.trim()) {
        onChange(inputValue.trim());
        setOpen(false);
      }
    }
    if (e.key === 'Escape') {
      setOpen(false);
    }
  }, [searchResults, inputValue, onChange, handleSelect]);

  const showResults = open && inputValue.length >= 2;
  const noExactMatch = searchResults.length === 0 || 
    !searchResults.some(r => r.nombre.toUpperCase() === inputValue.toUpperCase());

  return (
    <Popover open={showResults} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className={cn('relative', className)}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={handleInputChange}
            onFocus={() => inputValue.length >= 2 && setOpen(true)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className="pl-10"
          />
          {isLoading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[var(--radix-popover-trigger-width)] p-0" 
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command>
          <CommandList>
            {searchResults.length === 0 && !isLoading && (
              <CommandEmpty className="py-3 px-4 text-sm text-muted-foreground">
                No se encontraron clientes
              </CommandEmpty>
            )}
            {searchResults.length > 0 && (
              <CommandGroup heading="Clientes encontrados">
                {searchResults.map((cliente) => (
                  <CommandItem
                    key={cliente.id || cliente.nombre}
                    value={cliente.nombre}
                    onSelect={() => handleSelect(cliente)}
                    className="flex items-center justify-between py-3"
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <span className="font-medium">{cliente.nombre}</span>
                        {cliente.razon_social && (
                          <span className="text-xs text-muted-foreground ml-2">
                            ({cliente.razon_social})
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {cliente.rutas_count > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          <MapPin className="h-3 w-3 mr-1" />
                          {cliente.rutas_count} rutas
                        </Badge>
                      )}
                      {cliente.es_cliente_maestro ? (
                        <Badge variant="outline" className="text-xs text-success border-success/30">
                          <Check className="h-3 w-3 mr-1" />
                          Registrado
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-warning border-warning/30">
                          Solo rutas
                        </Badge>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {noExactMatch && inputValue.trim().length >= 2 && (
              <CommandGroup heading="Crear nuevo">
                <CommandItem
                  onSelect={handleCreateNew}
                  className="flex items-center gap-2 py-3 text-primary"
                >
                  <Plus className="h-4 w-4" />
                  <span>Crear cliente "{inputValue.trim()}"</span>
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
