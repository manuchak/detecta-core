import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MapPin, Loader2, AlertCircle, Search, X, CheckCircle, Clock, Wifi } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { geocodeAddress, reverseGeocode, type MapboxError } from '@/lib/mapbox';
import { addressCache, getAdaptiveTiming, detectNetworkSpeed } from '@/utils/addressCache';

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
  const [showRecentSearches, setShowRecentSearches] = useState(false);
  const [networkSpeed, setNetworkSpeed] = useState<'slow' | 'fast'>('fast');
  const [lastSearchTime, setLastSearchTime] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const throttleRef = useRef<NodeJS.Timeout>();
  const abortControllerRef = useRef<AbortController | null>(null);

  // Get adaptive timing based on network conditions
  const timing = getAdaptiveTiming();

  // Sync external value changes
  useEffect(() => {
    if (value !== inputValue) {
      setInputValue(value);
      setIsValidAddress(!!value);
    }
  }, [value]);

  // Enhanced search with caching and performance optimizations
  const searchAddresses = useCallback(async (query: string) => {
    const normalizedQuery = query.trim();
    const startTime = Date.now();
    
    // Check minimum characters based on network speed
    if (normalizedQuery.length < timing.minChars) {
      setSuggestions([]);
      setMapboxError(null);
      setIsLoading(false);
      setShowRecentSearches(normalizedQuery.length === 0);
      return;
    }

    // Check cache first
    const cachedResult = addressCache.get(normalizedQuery);
    if (cachedResult) {
      setSuggestions(cachedResult.suggestions || []);
      setMapboxError(cachedResult.error || null);
      setIsLoading(false);
      addressCache.recordRequest(Date.now() - startTime);
      return;
    }

    // Check if request is already in flight (deduplication)
    const inFlightRequest = addressCache.getInFlightRequest(normalizedQuery);
    if (inFlightRequest) {
      try {
        const result = await inFlightRequest;
        setSuggestions(result.suggestions || []);
        setMapboxError(result.error || null);
        setIsLoading(false);
        return;
      } catch (error) {
        // Continue with new request if in-flight request failed
      }
    }

    // Try to get similar results from cache while loading
    const similarResults = addressCache.getSimilarResults(normalizedQuery);
    if (similarResults.length > 0) {
      setSuggestions(similarResults);
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setIsLoading(true);
    setMapboxError(null);

    // Create and cache the request promise
    const requestPromise = geocodeAddress(normalizedQuery, {
      limit: maxSuggestions,
      country: countryFilter,
      types: 'address,poi'
    });

    addressCache.setInFlightRequest(normalizedQuery, requestPromise);

    try {
      const result = await requestPromise;
      const responseTime = Date.now() - startTime;

      if (result.error) {
        setMapboxError(result.error);
        setSuggestions([]);
        
        // Cache error for short time to avoid repeated failures
        addressCache.set(normalizedQuery, result, 30000); // 30 seconds
        addressCache.recordRequest(responseTime, true);
        
        // Enhanced retry logic with exponential backoff
        if (result.error.type === 'network' && retryCount < 2) {
          const retryDelay = Math.min(timing.retryDelay * Math.pow(2, retryCount), 8000);
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
            searchAddresses(normalizedQuery);
          }, retryDelay);
        }
      } else {
        setSuggestions(result.suggestions);
        setRetryCount(0);
        
        // Cache successful result
        addressCache.set(normalizedQuery, result);
        addressCache.addToRecent(normalizedQuery);
        addressCache.recordRequest(responseTime, false);
      }
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      
      if (error.name !== 'AbortError') {
        const errorResult = {
          error: {
            type: 'network' as const,
            message: 'Error de conexión'
          }
        };
        
        setMapboxError(errorResult.error);
        setSuggestions([]);
        
        // Cache error briefly
        addressCache.set(normalizedQuery, errorResult, 15000); // 15 seconds
        addressCache.recordRequest(responseTime, true);
      }
    } finally {
      setIsLoading(false);
      setLastSearchTime(Date.now());
    }
  }, [timing.minChars, timing.retryDelay, maxSuggestions, countryFilter, retryCount]);

  // Enhanced debounced search with throttling
  useEffect(() => {
    // Clear existing timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (throttleRef.current) {
      clearTimeout(throttleRef.current);
    }

    const query = inputValue.trim();
    
    if (query) {
      // Debounced search
      timeoutRef.current = setTimeout(() => {
        // Additional throttling to prevent too many requests
        const timeSinceLastSearch = Date.now() - lastSearchTime;
        if (timeSinceLastSearch < timing.throttle) {
          throttleRef.current = setTimeout(() => {
            searchAddresses(query);
          }, timing.throttle - timeSinceLastSearch);
        } else {
          searchAddresses(query);
        }
      }, timing.debounce);
    } else {
      setSuggestions([]);
      setMapboxError(null);
      setIsLoading(false);
      setShowRecentSearches(true);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (throttleRef.current) {
        clearTimeout(throttleRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [inputValue, searchAddresses, timing.debounce, timing.throttle, lastSearchTime]);

  // Network speed detection
  useEffect(() => {
    setNetworkSpeed(detectNetworkSpeed());
    
    // Re-detect network speed periodically
    const interval = setInterval(() => {
      setNetworkSpeed(detectNetworkSpeed());
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, []);

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
    setShowRecentSearches(newValue.trim().length === 0);
    
    // Reset validation when typing
    if (newValue !== value) {
      setIsValidAddress(false);
    }
  };

  const handleRecentSearchClick = (recentSearch: string) => {
    setInputValue(recentSearch);
    setIsOpen(true);
    setShowRecentSearches(false);
    setSelectedIndex(-1);
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
          onFocus={() => {
            setIsOpen(true);
            setShowRecentSearches(inputValue.trim().length === 0);
          }}
          placeholder={inputValue.length < timing.minChars ? 
            `${placeholder} (mínimo ${timing.minChars} caracteres)` : 
            placeholder
          }
          disabled={disabled}
          className={`
            pr-20 
            ${error ? 'border-destructive' : ''}
            ${isValidAddress ? 'border-green-500' : ''}
          `}
        />
        
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          {networkSpeed === 'slow' && (
            <div title="Conexión lenta detectada">
              <Wifi className="h-3 w-3 text-orange-500" />
            </div>
          )}
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
      {isOpen && (suggestions.length > 0 || mapboxError || isLoading || showRecentSearches) && (
        <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
          {/* Loading state */}
          {isLoading && (
            <div className="px-4 py-3 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              {networkSpeed === 'slow' ? 'Buscando (conexión lenta)...' : 'Buscando direcciones...'}
            </div>
          )}

          {/* Recent searches */}
          {showRecentSearches && !isLoading && (
            <>
              <div className="px-4 py-2 text-xs text-muted-foreground font-medium border-b border-border">
                Búsquedas recientes
              </div>
              {addressCache.getRecentSearches().map((recentSearch, index) => (
                <button
                  key={`recent-${index}`}
                  onClick={() => handleRecentSearchClick(recentSearch)}
                  className="w-full px-4 py-2 text-left hover:bg-muted/50 flex items-center gap-3 text-sm"
                >
                  <Clock className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  <span className="truncate">{recentSearch}</span>
                </button>
              ))}
              {addressCache.getRecentSearches().length === 0 && (
                <div className="px-4 py-3 text-sm text-muted-foreground text-center">
                  No hay búsquedas recientes
                </div>
              )}
            </>
          )}

          {/* Minimum characters message */}
          {!showRecentSearches && inputValue.length > 0 && inputValue.length < timing.minChars && !isLoading && (
            <div className="px-4 py-3 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
              <Search className="h-4 w-4" />
              Escribe al menos {timing.minChars} caracteres para buscar
            </div>
          )}

          {/* Suggestions */}
          {!showRecentSearches && suggestions.map((suggestion, index) => {
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
          {!showRecentSearches && allowManualInput && inputValue.length >= timing.minChars && !isLoading && (
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
          {!showRecentSearches && !isLoading && suggestions.length === 0 && inputValue.length >= timing.minChars && !mapboxError && (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              No se encontraron direcciones para "{inputValue}"
            </div>
          )}

          {/* Performance metrics (dev mode only) */}
          {process.env.NODE_ENV === 'development' && !showRecentSearches && (
            <div className="border-t border-border px-4 py-2 text-xs text-muted-foreground">
              Cache: {addressCache.size()} | Hit Rate: {(addressCache.getMetrics().cacheHitRate * 100).toFixed(1)}%
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default EnhancedAddressAutocomplete;