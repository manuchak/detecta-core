import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, MapPin, Search } from 'lucide-react';
import { usePredefinedMeetingPoints } from '@/hooks/usePredefinedMeetingPoints';
import { geocodeAddress, type MapboxError } from '@/lib/mapbox';

interface LocationSuggestion {
  id: string;
  nombre: string;
  direccion_completa: string;
  categoria: string;
  zona: string;
}

interface MapboxSuggestion {
  place_name: string;
  center: [number, number];
  context?: Array<{ id: string; text: string }>;
}

interface SmartLocationDropdownProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  // Contextual props for filtering
  armadoInternoId?: string;
  proveedorId?: string;
  tipoArmado?: 'interno' | 'proveedor';
  onAutoAddPersonalAddress?: (address: string) => void;
}

export function SmartLocationDropdown({
  value,
  onChange,
  label = "Ubicación", 
  placeholder = "Buscar ubicación...",
  className,
  armadoInternoId,
  proveedorId,
  tipoArmado,
  onAutoAddPersonalAddress
}: SmartLocationDropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState(value);
  const [mapboxSuggestions, setMapboxSuggestions] = React.useState<MapboxSuggestion[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [mapboxError, setMapboxError] = React.useState<MapboxError | null>(null);
  const [retryCount, setRetryCount] = React.useState(0);
  const abortControllerRef = React.useRef<AbortController | null>(null);
  const timeoutRef = React.useRef<NodeJS.Timeout>();

  // Enhanced Mapbox integration with retry logic and better error handling
  React.useEffect(() => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Reset error on new search
    setMapboxError(null);

    const fetchMapboxSuggestions = async () => {
      if (!searchQuery.trim() || searchQuery.length < 3) {
        setMapboxSuggestions([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      
      // Create new abort controller
      abortControllerRef.current = new AbortController();
      
      try {
        const { suggestions, error } = await geocodeAddress(searchQuery, {
          limit: 5,
          country: 'MX',
          types: 'address,poi'
        });

        if (error) {
          setMapboxError(error);
          setMapboxSuggestions([]);
          
          // Auto-retry once for network errors
          if (error.type === 'network' && retryCount < 1) {
            setTimeout(() => {
              setRetryCount(prev => prev + 1);
            }, 2000);
          }
        } else {
          setMapboxSuggestions(suggestions);
          setRetryCount(0);
        }
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          setMapboxError({
            type: 'network',
            message: 'Error de conexión con Mapbox'
          });
          setMapboxSuggestions([]);
        }
      } finally {
        setLoading(false);
      }
    };

    timeoutRef.current = setTimeout(fetchMapboxSuggestions, 300);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [searchQuery, retryCount]);

  // Fetch contextual meeting points based on armed guard type
  const contextFilters = React.useMemo(() => {
    if (armadoInternoId) {
      return { armado_interno_id: armadoInternoId, include_general: true };
    }
    if (proveedorId) {
      return { proveedor_id: proveedorId, include_general: true };
    }
    return {};
  }, [armadoInternoId, proveedorId]);

  const { data: meetingPoints = [] } = usePredefinedMeetingPoints(contextFilters);

  const handleLocationSelect = (location: string | MapboxSuggestion) => {
    let selectedAddress: string;
    
    if (typeof location === 'string') {
      selectedAddress = location;
    } else {
      // Mapbox suggestion with coordinates
      selectedAddress = location.place_name;
      const coordinates = location.center; // [lng, lat]
      
      // Store coordinates for future use
      console.log('📍 Selected coordinates:', { 
        lat: coordinates[1], 
        lng: coordinates[0],
        address: selectedAddress 
      });
    }
    
    setSearchQuery(selectedAddress);
    onChange(selectedAddress);
    setIsOpen(false);
    setMapboxError(null); // Clear any errors on successful selection
    
    // Auto-add personal address for internal armed guards
    if (tipoArmado === 'interno' && armadoInternoId && onAutoAddPersonalAddress) {
      // Check if this is a manual address (not from predefined points)
      const isExistingPoint = meetingPoints.some(point => 
        point.direccion_completa === selectedAddress || point.nombre === selectedAddress
      );
      
      if (!isExistingPoint && selectedAddress.trim()) {
        onAutoAddPersonalAddress(selectedAddress);
      }
    }
  };

  // Filter and group predefined locations based on search query
  const filteredLocations = meetingPoints.filter(point =>
    point.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    point.direccion_completa.toLowerCase().includes(searchQuery.toLowerCase()) ||
    point.zona.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group locations by type for better organization
  const locationGroups = React.useMemo(() => {
    const groups: Record<string, typeof filteredLocations> = {};
    
    filteredLocations.forEach(point => {
      const groupKey = point.tipo_operacion;
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(point);
    });
    
    return groups;
  }, [filteredLocations]);

  const getCategoryIcon = (categoria: string) => {
    switch (categoria.toLowerCase()) {
      case 'terminal': return '🚌';
      case 'metro': return '🚇';
      case 'centro comercial': return '🛍️';
      case 'hospital': return '🏥';
      case 'escuela': return '🏫';
      case 'parque': return '🌳';
      case 'domicilio': return '🏠';
      default: return '📍';
    }
  };

  const getTypeLabel = (tipo: string) => {
    switch (tipo) {
      case 'direccion_personal': return 'Direcciones Personales';
      case 'base_empresa': return 'Bases de Empresa';
      case 'base_proveedor': return 'Bases del Proveedor';
      case 'general': return 'Ubicaciones Generales';
      default: return 'Otras Ubicaciones';
    }
  };

  const getTypeIcon = (tipo: string) => {
    switch (tipo) {
      case 'direccion_personal': return '🏠';
      case 'base_empresa': return '🏢';
      case 'base_proveedor': return '🏭';
      case 'general': return '🌟';
      default: return '📍';
    }
  };

  return (
    <div className={className}>
      {label && (
        <Label htmlFor="location-input" className="mb-2 block">
          {label}
        </Label>
      )}
      
      <div className="relative">
        <Input
          id="location-input"
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          className="w-full pr-10"
          disabled={loading && searchQuery.length > 2}
        />
        
        {/* Loading indicator */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          {loading && searchQuery.length > 2 ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <Search className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
        
        {isOpen && (searchQuery.length > 0 || filteredLocations.length > 0) && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg max-h-80 overflow-auto z-50">
            {/* Error state */}
            {mapboxError && (
              <div className="p-3 border-b border-border">
                <Alert className="border-destructive/20 bg-destructive/5">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <AlertDescription className="text-sm">
                    <div className="font-medium text-destructive">Error de búsqueda</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {mapboxError.message}
                      {mapboxError.type === 'token' && (
                        <div className="mt-1">
                          Verifica la configuración de Mapbox en los secretos de Supabase.
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {/* Contextual Favorite Locations */}
            {Object.keys(locationGroups).map((groupType) => {
              const locations = locationGroups[groupType];
              if (locations.length === 0) return null;
              
              return (
                <div key={groupType}>
                  <div className="px-3 py-2 text-xs font-medium text-muted-foreground bg-muted/50 flex items-center gap-2">
                    <span>{getTypeIcon(groupType)}</span>
                    {getTypeLabel(groupType)}
                    <span className="text-xs opacity-60">({locations.length})</span>
                  </div>
                  {locations.map((point) => (
                    <div
                      key={point.id}
                      className="px-3 py-2 cursor-pointer hover:bg-accent hover:text-accent-foreground flex items-center gap-2 text-sm"
                      onClick={() => handleLocationSelect(point.direccion_completa)}
                    >
                      <span className="text-base">{getCategoryIcon(point.categoria)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate flex items-center gap-2">
                          {point.nombre}
                          {point.frecuencia_uso > 0 && (
                            <span className="text-xs px-1.5 py-0.5 bg-primary/10 text-primary rounded-full">
                              {point.frecuencia_uso}
                            </span>
                          )}
                          {point.auto_agregado && (
                            <span className="text-xs text-muted-foreground">✨</span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {point.zona} • {point.direccion_completa}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}

            {/* Mapbox Results Section */}
            {searchQuery.length >= 3 && (
              <div>
                <div className="px-3 py-2 text-xs font-medium text-muted-foreground bg-muted/50 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {loading ? 'Buscando direcciones...' : 'Direcciones Encontradas'}
                  {mapboxSuggestions.length > 0 && (
                    <span className="text-xs opacity-60">({mapboxSuggestions.length})</span>
                  )}
                </div>
                {loading ? (
                  <div className="px-3 py-4 text-center text-muted-foreground flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Buscando direcciones...
                  </div>
                ) : mapboxSuggestions.length > 0 ? (
                  mapboxSuggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="px-3 py-2 cursor-pointer hover:bg-accent hover:text-accent-foreground text-sm flex items-center gap-2"
                      onClick={() => handleLocationSelect(suggestion)}
                    >
                      <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{suggestion.place_name}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {suggestion.context?.find(c => c.id.includes('place'))?.text || 'México'}
                        </div>
                      </div>
                    </div>
                  ))
                ) : searchQuery.length >= 3 && !mapboxError && (
                  <div className="px-3 py-2 text-sm text-muted-foreground flex items-center justify-center gap-2">
                    <Search className="h-4 w-4 opacity-50" />
                    No se encontraron direcciones
                  </div>
                )}
              </div>
            )}

            {/* Use Custom Address Option */}
            {searchQuery.length > 0 && (
              <div>
                <div className="px-3 py-2 text-xs font-medium text-muted-foreground bg-muted/50">
                  Dirección Manual
                </div>
                <div
                  className="px-3 py-2 cursor-pointer hover:bg-accent hover:text-accent-foreground text-sm border-t"
                  onClick={() => handleLocationSelect(searchQuery)}
                >
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Usar: "{searchQuery}"</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}