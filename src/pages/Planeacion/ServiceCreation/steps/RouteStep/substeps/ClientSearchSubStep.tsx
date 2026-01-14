import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Search, Building2, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAllClientes, type ClienteUnificado } from '@/hooks/useClientesFromPricing';
import { ClientSuggestionsList } from '../components/ClientSuggestionsList';
import { NewClientBanner } from '../components/NewClientBanner';
import { cn } from '@/lib/utils';

interface ClientSearchSubStepProps {
  selectedCliente: string;
  isNewClient: boolean;
  onClientSelect: (cliente: string, clienteId: string, isNewClient: boolean) => void;
  onContinue: () => void;
}

export function ClientSearchSubStep({
  selectedCliente,
  isNewClient,
  onClientSelect,
  onContinue,
}: ClientSearchSubStepProps) {
  const [searchTerm, setSearchTerm] = useState(selectedCliente);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: allClientes = [], isLoading } = useAllClientes();

  // Filter suggestions based on search term
  const suggestions = useMemo(() => {
    if (searchTerm.length < 2) return [];
    const term = searchTerm.toLowerCase();
    return allClientes
      .filter(c => c.nombre.toLowerCase().includes(term))
      .slice(0, 8);
  }, [allClientes, searchTerm]);

  // Check if this is a new client
  const isNewClientDetected = useMemo(() => {
    if (searchTerm.length < 3) return false;
    const exactMatch = allClientes.some(
      c => c.nombre.toLowerCase() === searchTerm.toLowerCase()
    );
    return !exactMatch && suggestions.length === 0;
  }, [searchTerm, allClientes, suggestions]);

  // Handle client selection from suggestions
  const handleSelectCliente = useCallback((cliente: ClienteUnificado) => {
    setSearchTerm(cliente.nombre);
    setShowSuggestions(false);
    onClientSelect(cliente.nombre, '', false);
    // Auto-advance to next step
    setTimeout(() => onContinue(), 150);
  }, [onClientSelect, onContinue]);

  // Handle new client creation
  const handleNewClient = useCallback(() => {
    onClientSelect(searchTerm.trim(), '', true);
    onContinue();
  }, [searchTerm, onClientSelect, onContinue]);

  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowSuggestions(true);
    
    // Clear selection if user is typing again
    if (selectedCliente && value !== selectedCliente) {
      onClientSelect('', '', false);
    }
  }, [selectedCliente, onClientSelect]);

  // Handle clear
  const handleClear = useCallback(() => {
    setSearchTerm('');
    setShowSuggestions(false);
    onClientSelect('', '', false);
    inputRef.current?.focus();
  }, [onClientSelect]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="space-y-4 animate-in fade-in-50 duration-300">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            Buscar Cliente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div ref={containerRef} className="relative">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={handleInputChange}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Escribe el nombre del cliente..."
                className={cn(
                  "pl-10 pr-10 h-12 text-base",
                  selectedCliente && !isNewClient && "border-green-500 bg-green-50 dark:bg-green-950/20"
                )}
                autoComplete="off"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-full transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && searchTerm.length >= 2 && (
              <div className="absolute z-50 w-full mt-1 bg-background border rounded-lg shadow-lg max-h-80 overflow-y-auto">
                <ClientSuggestionsList
                  suggestions={suggestions}
                  searchTerm={searchTerm}
                  onSelect={handleSelectCliente}
                  isLoading={isLoading}
                />
                
                {/* New Client Banner */}
                {isNewClientDetected && !isLoading && (
                  <div className="p-2">
                    <NewClientBanner
                      clienteName={searchTerm}
                      onCreateNew={handleNewClient}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Selected Client Badge */}
          {selectedCliente && (
            <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-lg flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Building2 className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-foreground">{selectedCliente}</div>
                {isNewClient && (
                  <div className="text-xs text-amber-600 dark:text-amber-400">
                    Cliente nuevo — se creará al guardar
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Help text */}
      <p className="text-sm text-muted-foreground text-center">
        Selecciona un cliente existente o escribe un nuevo nombre para crear uno
      </p>
    </div>
  );
}
