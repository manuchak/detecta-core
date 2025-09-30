
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { MapPin, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MAPBOX_ACCESS_TOKEN } from '@/lib/mapbox';

interface AddressSuggestion {
  id: string;
  place_name: string;
  place_type: string[];
  center: [number, number];
  properties: {
    accuracy?: string;
    address?: string;
  };
  context?: Array<{
    id: string;
    text: string;
    short_code?: string;
  }>;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string, suggestion?: AddressSuggestion) => void;
  placeholder?: string;
  className?: string;
  error?: boolean;
  disabled?: boolean;
}

export const AddressAutocomplete = ({ 
  value, 
  onChange, 
  placeholder = "Buscar dirección...", 
  className,
  error,
  disabled 
}: AddressAutocompleteProps) => {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [apiError, setApiError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const abortControllerRef = useRef<AbortController>();

  // Using centralized Mapbox token

  const searchAddresses = useCallback(async (query: string) => {
    console.log('Searching addresses for:', query);
    
    if (query.length < 4) {
      setSuggestions([]);
      setShowSuggestions(false);
      setApiError(null);
      return;
    }

    // Cancelar búsqueda anterior si existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setIsLoading(true);
    setApiError(null);
    
    try {
      // Configuración para México y países de LATAM
      const country = 'mx,co,ar,cl,pe,br,ec,bo,py,uy,ve,gt,hn,sv,ni,cr,pa';
      const types = 'address,poi,place,postcode';
      
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?` +
        `access_token=${MAPBOX_ACCESS_TOKEN}&` +
        `country=${country}&` +
        `types=${types}&` +
        `language=es&` +
        `limit=5&` +
        `autocomplete=true`;

      console.log('Making request to Mapbox API...');

      const response = await fetch(url, {
        signal: abortControllerRef.current.signal
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        throw new Error(`Error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('Response data:', data);

      if (data.features && Array.isArray(data.features)) {
        setSuggestions(data.features);
        setShowSuggestions(data.features.length > 0);
        setSelectedIndex(-1);
        console.log(`Found ${data.features.length} suggestions`);
      } else {
        console.warn('Invalid response format:', data);
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Request was aborted');
        return;
      }
      
      console.error('Error searching addresses:', error);
      setApiError(error instanceof Error ? error.message : 'Error desconocido');
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const debouncedSearch = useCallback((query: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      searchAddresses(query);
    }, 1500); // Optimized debounce: wait 1.5s after user stops typing
  }, [searchAddresses]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    console.log('Input changed:', newValue);
    onChange(newValue);
    setApiError(null);
    debouncedSearch(newValue);
  };

  const handleSuggestionClick = (suggestion: AddressSuggestion) => {
    console.log('Suggestion selected:', suggestion);
    onChange(suggestion.place_name, suggestion);
    setSuggestions([]);
    setShowSuggestions(false);
    setApiError(null);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionClick(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setSuggestions([]);
        setShowSuggestions(false);
        setSelectedIndex(-1);
        setApiError(null);
        break;
    }
  };

  const formatSuggestion = (suggestion: AddressSuggestion) => {
    const parts = suggestion.place_name.split(',');
    const main = parts[0];
    const secondary = parts.slice(1).join(',');
    
    return { main: main.trim(), secondary: secondary.trim() };
  };

  const getSuggestionIcon = (suggestion: AddressSuggestion) => {
    const placeType = suggestion.place_type?.[0];
    switch (placeType) {
      case 'address':
        return '🏠';
      case 'poi':
        return '📍';
      case 'place':
        return '🏙️';
      case 'postcode':
        return '📮';
      default:
        return '📍';
    }
  };

  // Cerrar sugerencias al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
        setApiError(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Limpiar timeouts al desmontar
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return (
    <div className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          ref={inputRef}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(
            "pl-10 pr-10 h-11",
            error && "border-red-500 focus-visible:ring-red-500",
            className
          )}
          disabled={disabled}
          autoComplete="off"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-3 h-4 w-4 text-gray-400 animate-spin" />
        )}
      </div>

      {/* Error de API */}
      {apiError && (
        <div className="absolute z-50 w-full mt-1 bg-red-50 border border-red-200 rounded-lg shadow-lg p-3">
          <div className="text-sm text-red-600">
            <strong>Error de autocompletado:</strong> {apiError}
          </div>
          <div className="text-xs text-red-500 mt-1">
            Verifica tu conexión o continúa escribiendo manualmente
          </div>
        </div>
      )}

      {/* Sugerencias */}
      {showSuggestions && suggestions.length > 0 && !apiError && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => {
            const { main, secondary } = formatSuggestion(suggestion);
            const isSelected = index === selectedIndex;
            
            return (
              <div
                key={suggestion.id}
                className={cn(
                  "px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors",
                  isSelected && "bg-blue-50 border-blue-200"
                )}
                onClick={() => handleSuggestionClick(suggestion)}
              >
                <div className="flex items-start gap-3">
                  <span className="text-lg mt-0.5 flex-shrink-0">
                    {getSuggestionIcon(suggestion)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">
                      {main}
                    </div>
                    {secondary && (
                      <div className="text-sm text-gray-500 truncate">
                        {secondary}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sin resultados */}
      {showSuggestions && suggestions.length === 0 && !isLoading && !apiError && value.length >= 4 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3"
        >
          <div className="text-sm text-gray-500 text-center">
            No se encontraron direcciones para "{value}"
          </div>
          <div className="text-xs text-gray-400 text-center mt-1">
            Puedes continuar escribiendo manualmente
          </div>
        </div>
      )}
    </div>
  );
};
