import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePredefinedMeetingPoints } from '@/hooks/usePredefinedMeetingPoints';
import { initializeMapboxToken } from '@/lib/mapbox';

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
  const [mapboxToken, setMapboxToken] = React.useState<string | null>(null);

  // Initialize Mapbox token
  React.useEffect(() => {
    const initToken = async () => {
      const token = await initializeMapboxToken();
      setMapboxToken(token);
    };
    initToken();
  }, []);

  // Debounced fetch from Mapbox
  React.useEffect(() => {
    const fetchMapboxSuggestions = async () => {
      if (!searchQuery.trim() || !mapboxToken || searchQuery.length < 3) {
        setMapboxSuggestions([]);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?access_token=${mapboxToken}&country=MX&limit=5&language=es`
        );
        const data = await response.json();
        setMapboxSuggestions(data.features || []);
      } catch (error) {
        console.error('Error fetching Mapbox suggestions:', error);
        setMapboxSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchMapboxSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, mapboxToken]);

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

  const handleLocationSelect = (location: string) => {
    setSearchQuery(location);
    onChange(location);
    setIsOpen(false);
    
    // Auto-add personal address for internal armed guards
    if (tipoArmado === 'interno' && armadoInternoId && onAutoAddPersonalAddress) {
      // Check if this is a manual address (not from predefined points)
      const isExistingPoint = meetingPoints.some(point => 
        point.direccion_completa === location || point.nombre === location
      );
      
      if (!isExistingPoint && location.trim()) {
        onAutoAddPersonalAddress(location);
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
          className="w-full"
        />
        
        {isOpen && (searchQuery.length > 0 || filteredLocations.length > 0) && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg max-h-80 overflow-auto z-50">
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
                <div className="px-3 py-2 text-xs font-medium text-muted-foreground bg-muted/50">
                  {loading ? 'Buscando direcciones...' : 'Direcciones Encontradas'}
                </div>
                {loading ? (
                  <div className="px-3 py-4 text-center text-muted-foreground">
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  </div>
                ) : mapboxSuggestions.length > 0 ? (
                  mapboxSuggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="px-3 py-2 cursor-pointer hover:bg-accent hover:text-accent-foreground text-sm"
                      onClick={() => handleLocationSelect(suggestion.place_name)}
                    >
                      <div className="font-medium truncate">{suggestion.place_name}</div>
                    </div>
                  ))
                ) : searchQuery.length >= 3 && (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
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
                    <span>📝</span>
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