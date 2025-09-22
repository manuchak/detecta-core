import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { MapPin, Search, Plus, Star } from 'lucide-react';
import { initializeMapboxToken } from '@/lib/mapbox';
import { usePredefinedMeetingPoints } from '@/hooks/usePredefinedMeetingPoints';

interface LocationSuggestion {
  id: string;
  nombre: string;
  direccion_completa: string;
  zona?: string;
  categoria?: string;
  descripcion?: string;
}

interface MapboxSuggestion {
  id: string;
  place_name: string;
  center: [number, number];
  text: string;
}

interface SmartLocationDropdownProps {
  value?: string;
  onChange: (location: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
}

export function SmartLocationDropdown({ 
  value = '', 
  onChange, 
  label = "Punto de encuentro",
  placeholder = "Buscar o seleccionar ubicación",
  className 
}: SmartLocationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(value);
  const [mapboxSuggestions, setMapboxSuggestions] = useState<MapboxSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const debounceRef = useRef<NodeJS.Timeout>();
  const inputRef = useRef<HTMLInputElement>(null);

  // Use the hook for predefined locations
  const { data: predefinedLocations = [] } = usePredefinedMeetingPoints();

  // Initialize Mapbox token
  useEffect(() => {
    const initToken = async () => {
      const token = await initializeMapboxToken();
      setMapboxToken(token);
    };
    initToken();
  }, []);

  // Debounced search for Mapbox suggestions
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (searchQuery.length > 2 && mapboxToken) {
      debounceRef.current = setTimeout(async () => {
        setLoading(true);
        try {
          const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?access_token=${mapboxToken}&country=MX&proximity=-99.1332,19.4326&limit=5`
          );
          
          if (response.ok) {
            const data = await response.json();
            setMapboxSuggestions(data.features || []);
          }
        } catch (error) {
          console.error('Error fetching Mapbox suggestions:', error);
        } finally {
          setLoading(false);
        }
      }, 300);
    } else {
      setMapboxSuggestions([]);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchQuery, mapboxToken]);

  const handleLocationSelect = (location: string) => {
    setSearchQuery(location);
    onChange(location);
    setIsOpen(false);
  };

  const filteredPredefined = predefinedLocations.filter(loc =>
    loc.activo &&
    (loc.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    loc.direccion_completa.toLowerCase().includes(searchQuery.toLowerCase()) ||
    loc.zona?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getCategoryIcon = (categoria: string) => {
    switch (categoria) {
      case 'centro_comercial':
        return '🏬';
      case 'estacion':
        return '🚇';
      case 'oficina':
        return '🏢';
      case 'punto_referencia':
        return '📍';
      default:
        return '📍';
    }
  };

  return (
    <div className={cn("relative", className)}>
      <label className="block text-sm font-medium mb-2">
        {label} *
      </label>
      
      <div className="relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
          <Search className="h-4 w-4" />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-3 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
        />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-popover border border-border rounded-lg shadow-lg max-h-80 overflow-y-auto">
          {/* Predefined Locations */}
          {filteredPredefined.length > 0 && (
            <div className="p-2">
              <div className="flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground font-medium">
                <Star className="h-3 w-3" />
                Ubicaciones Favoritas
              </div>
              {filteredPredefined.map((location) => (
                <button
                  key={location.id}
                  onClick={() => handleLocationSelect(location.direccion_completa)}
                  className="w-full text-left p-3 hover:bg-accent rounded-md transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-lg">{getCategoryIcon(location.categoria || 'general')}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{location.nombre}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {location.direccion_completa}
                      </div>
                      {location.descripcion && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {location.descripcion}
                        </div>
                      )}
                    </div>
                    {location.zona && (
                      <div className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                        {location.zona}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Mapbox Suggestions */}
          {mapboxSuggestions.length > 0 && (
            <div className="p-2 border-t">
              <div className="flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground font-medium">
                <MapPin className="h-3 w-3" />
                Direcciones Encontradas
              </div>
              {mapboxSuggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  onClick={() => handleLocationSelect(suggestion.place_name)}
                  className="w-full text-left p-3 hover:bg-accent rounded-md transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{suggestion.text}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {suggestion.place_name}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Custom Location Option */}
          {searchQuery.length > 2 && !filteredPredefined.some(loc => 
            loc.direccion_completa.toLowerCase() === searchQuery.toLowerCase()
          ) && (
            <div className="p-2 border-t">
              <button
                onClick={() => handleLocationSelect(searchQuery)}
                className="w-full text-left p-3 hover:bg-accent rounded-md transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Plus className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium text-sm">Usar dirección personalizada</div>
                    <div className="text-xs text-muted-foreground">"{searchQuery}"</div>
                  </div>
                </div>
              </button>
            </div>
          )}

          {loading && (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mx-auto"></div>
              <div className="text-xs text-muted-foreground mt-2">Buscando direcciones...</div>
            </div>
          )}

          {searchQuery.length > 2 && !loading && filteredPredefined.length === 0 && mapboxSuggestions.length === 0 && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No se encontraron ubicaciones para "{searchQuery}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}