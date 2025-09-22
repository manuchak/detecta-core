import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Loader2, AlertCircle, Search, X, CheckCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { geocodeAddress, reverseGeocode, type MapboxError } from '@/lib/mapbox';

interface AddressSuggestion {
  id: string;
  place_name: string;
  place_type: string[];
  center: [number, number]; // [lng, lat]
  properties?: {
    category?: string;
    address?: string;
  };
  context?: Array<{ id: string; text: string }>;
}

interface EnhancedAddressAutocompleteProps {
  value?: string;
  onChange: (address: string, coordinates?: { lat: number; lng: number }) => void;
  placeholder?: string;
  className?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  onValidationChange?: (isValid: boolean) => void;
  showCoordinates?: boolean;
  allowManualInput?: boolean;
  countryFilter?: string;
  maxSuggestions?: number;
}

export function EnhancedAddressAutocomplete({
  value = '',
  onChange,
  placeholder = 'Buscar dirección...',
  className = '',
  error,
  disabled = false,
  required = false,
  onValidationChange,
  showCoordinates = false,
  allowManualInput = true,
  countryFilter = 'MX',
  maxSuggestions = 5
}: EnhancedAddressAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [mapboxError, setMapboxError] = useState<MapboxError | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isValidAddress, setIsValidAddress] = useState(false);
  const [selectedCoordinates, setSelectedCoordinates] = useState<{ lat: number; lng: number } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const abortControllerRef = useRef<AbortController | null>(null);

  // Sync external value changes
  useEffect(() => {
    if (value !== inputValue) {
      setInputValue(value);
      setIsValidAddress(!!value);
    }
  }, [value]);

  // Enhanced search with retry logic
  const searchAddresses = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      setMapboxError(null);
      setIsLoading(false);
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setIsLoading(true);
    setMapboxError(null);

    try {
      const { suggestions, error } = await geocodeAddress(query, {
        limit: maxSuggestions,
        country: countryFilter,
        types: 'address,poi'
      });

      if (error) {
        setMapboxError(error);
        setSuggestions([]);
        
        // Auto-retry for network errors
        if (error.type === 'network' && retryCount < 1) {
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
            searchAddresses(query);
          }, 2000);
        }
      } else {
        setSuggestions(suggestions);
        setRetryCount(0);
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        setMapboxError({
          type: 'network',
          message: 'Error de conexión'
        });
        setSuggestions([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced search effect
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (inputValue.trim()) {
      timeoutRef.current = setTimeout(() => {
        searchAddresses(inputValue);
      }, 300);
    } else {
      setSuggestions([]);
      setMapboxError(null);
      setIsLoading(false);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [inputValue, retryCount]);

  // Validation effect
  useEffect(() => {
    const valid = inputValue.length > 0 && (!required || (required && inputValue.length >= 10));
    setIsValidAddress(valid);
    onValidationChange?.(valid);
  }, [inputValue, required]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setIsOpen(true);
    setSelectedIndex(-1);
    setSelectedCoordinates(null);
    
    // Reset validation when typing
    if (newValue !== value) {
      setIsValidAddress(false);
    }
  };

  const handleSuggestionClick = (suggestion: AddressSuggestion) => {
    const address = suggestion.place_name;
    const coordinates = { lat: suggestion.center[1], lng: suggestion.center[0] };
    
    setInputValue(address);
    setSelectedCoordinates(coordinates);
    setIsValidAddress(true);
    setIsOpen(false);
    setMapboxError(null);
    setSuggestions([]);
    
    onChange(address, coordinates);
  };

  const handleManualSelection = () => {
    if (allowManualInput && inputValue.trim()) {
      setIsValidAddress(true);
      setIsOpen(false);
      setSelectedCoordinates(null);
      onChange(inputValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > -1 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionClick(suggestions[selectedIndex]);
        } else if (selectedIndex === suggestions.length && allowManualInput) {
          handleManualSelection();
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const clearInput = () => {
    setInputValue('');
    setSelectedCoordinates(null);
    setIsValidAddress(false);
    setSuggestions([]);
    setIsOpen(false);
    onChange('');
    inputRef.current?.focus();
  };

  const getSuggestionIcon = (suggestion: AddressSuggestion) => {
    const category = suggestion.properties?.category;
    const types = suggestion.place_type;
    
    if (types.includes('address')) return <MapPin className="h-4 w-4 text-primary" />;
    if (category === 'hospital') return <span className="text-red-500">🏥</span>;
    if (category === 'school') return <span className="text-blue-500">🏫</span>;
    if (category === 'shopping') return <span className="text-purple-500">🛍️</span>;
    return <MapPin className="h-4 w-4 text-muted-foreground" />;
  };

  const formatSuggestion = (suggestion: AddressSuggestion) => {
    const parts = suggestion.place_name.split(',');
    const main = parts[0];
    const secondary = parts.slice(1).join(',').trim();
    return { main, secondary };
  };

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => inputValue && setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            pr-20 
            ${error ? 'border-destructive' : ''}
            ${isValidAddress ? 'border-green-500' : ''}
          `}
        />
        
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          {isLoading && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
          {isValidAddress && !isLoading && (
            <CheckCircle className="h-4 w-4 text-green-500" />
          )}
          {inputValue && !disabled && (
            <button
              type="button"
              onClick={clearInput}
              className="h-4 w-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Error display */}
      {(error || mapboxError) && (
        <Alert className="mt-2 border-destructive/20 bg-destructive/5">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <AlertDescription className="text-sm text-destructive">
            {error || mapboxError?.message}
            {mapboxError?.type === 'token' && (
              <div className="mt-1 text-xs">
                Verifica la configuración de Mapbox en Supabase.
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Coordinates display */}
      {showCoordinates && selectedCoordinates && (
        <div className="mt-2 flex gap-2">
          <Badge variant="secondary" className="text-xs">
            Lat: {selectedCoordinates.lat.toFixed(6)}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            Lng: {selectedCoordinates.lng.toFixed(6)}
          </Badge>
        </div>
      )}

      {/* Suggestions dropdown */}
      {isOpen && (suggestions.length > 0 || mapboxError || isLoading) && (
        <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
          {/* Loading state */}
          {isLoading && (
            <div className="px-4 py-3 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Buscando direcciones...
            </div>
          )}

          {/* Suggestions */}
          {suggestions.map((suggestion, index) => {
            const { main, secondary } = formatSuggestion(suggestion);
            return (
              <button
                key={suggestion.id}
                ref={el => suggestionRefs.current[index] = el}
                onClick={() => handleSuggestionClick(suggestion)}
                className={`
                  w-full px-4 py-3 text-left hover:bg-muted/50 flex items-start gap-3 text-sm
                  ${selectedIndex === index ? 'bg-muted' : ''}
                `}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {getSuggestionIcon(suggestion)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{main}</div>
                  {secondary && (
                    <div className="text-xs text-muted-foreground truncate mt-0.5">
                      {secondary}
                    </div>
                  )}
                </div>
              </button>
            );
          })}

          {/* Manual input option */}
          {allowManualInput && inputValue.length > 0 && !isLoading && (
            <button
              onClick={handleManualSelection}
              className={`
                w-full px-4 py-3 text-left hover:bg-muted/50 flex items-center gap-3 text-sm border-t border-border
                ${selectedIndex === suggestions.length ? 'bg-muted' : ''}
              `}
            >
              <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div>
                <span className="text-muted-foreground">Usar dirección manual: </span>
                <span className="font-medium">"{inputValue}"</span>
              </div>
            </button>
          )}

          {/* No results */}
          {!isLoading && suggestions.length === 0 && inputValue.length >= 3 && !mapboxError && (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              No se encontraron direcciones para "{inputValue}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default EnhancedAddressAutocomplete;