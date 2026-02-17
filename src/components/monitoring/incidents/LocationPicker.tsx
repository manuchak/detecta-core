import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MapPin, Loader2, X, Maximize2 } from 'lucide-react';
import { geocodeAddress, reverseGeocode } from '@/lib/mapbox';
import mapboxgl from 'mapbox-gl';
import { initializeMapboxToken } from '@/lib/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface LocationPickerProps {
  value: string;
  lat?: number | null;
  lng?: number | null;
  onChange: (data: { zona: string; lat: number | null; lng: number | null }) => void;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({ value, lat, lng, onChange }) => {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedQuery, setExpandedQuery] = useState('');
  const [expandedSuggestions, setExpandedSuggestions] = useState<any[]>([]);
  const [expandedSearching, setExpandedSearching] = useState(false);
  const [showExpandedSuggestions, setShowExpandedSuggestions] = useState(false);
  const [expandedAddress, setExpandedAddress] = useState('');
  const [expandedCoords, setExpandedCoords] = useState<{ lat: number; lng: number } | null>(null);

  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const expandedDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const expandedMapContainerRef = useRef<HTMLDivElement>(null);
  const expandedMapRef = useRef<mapboxgl.Map | null>(null);
  const expandedMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close suggestions on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Sync external value changes
  useEffect(() => {
    if (value !== query) setQuery(value || '');
  }, [value]);

  // Default center (CDMX) when no coordinates are provided
  const DEFAULT_LAT = 19.4326;
  const DEFAULT_LNG = -99.1332;

  // Handle map click - reverse geocode and update
  const handleMapClick = useCallback(async (e: mapboxgl.MapMouseEvent) => {
    const { lng: clickLng, lat: clickLat } = e.lngLat;
    if (markerRef.current) {
      markerRef.current.setLngLat([clickLng, clickLat]);
    } else if (mapRef.current) {
      // Create marker on first click when none exists
      const marker = new mapboxgl.Marker({ color: '#ef4444', draggable: true }).setLngLat([clickLng, clickLat]).addTo(mapRef.current);
      marker.on('dragend', async () => {
        const lngLat = marker.getLngLat();
        setIsReverseGeocoding(true);
        const { address } = await reverseGeocode(lngLat.lat, lngLat.lng);
        setIsReverseGeocoding(false);
        const newZona = address || `${lngLat.lat.toFixed(5)}, ${lngLat.lng.toFixed(5)}`;
        setQuery(newZona);
        onChange({ zona: newZona, lat: lngLat.lat, lng: lngLat.lng });
      });
      markerRef.current = marker;
    }
    setIsReverseGeocoding(true);
    const { address } = await reverseGeocode(clickLat, clickLng);
    setIsReverseGeocoding(false);
    const newZona = address || `${clickLat.toFixed(5)}, ${clickLng.toFixed(5)}`;
    setQuery(newZona);
    onChange({ zona: newZona, lat: clickLat, lng: clickLng });
  }, [onChange]);

  // Initialize inline map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    const mapLat = lat || DEFAULT_LAT;
    const mapLng = lng || DEFAULT_LNG;
    const hasCoords = !!(lat && lng);

    const initMap = async () => {
      const token = await initializeMapboxToken();
      if (!token || !mapContainerRef.current) return;

      if (mapRef.current) {
        mapRef.current.flyTo({ center: [mapLng, mapLat], zoom: hasCoords ? 14 : 11 });
        if (hasCoords) {
          if (markerRef.current) markerRef.current.setLngLat([mapLng, mapLat]);
          else markerRef.current = new mapboxgl.Marker({ color: '#ef4444', draggable: true }).setLngLat([mapLng, mapLat]).addTo(mapRef.current);
        }
        return;
      }

      mapboxgl.accessToken = token;
      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [mapLng, mapLat],
        zoom: hasCoords ? 14 : 11,
        interactive: true,
      });

      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');

      let marker: mapboxgl.Marker | null = null;
      if (hasCoords) {
        marker = new mapboxgl.Marker({ color: '#ef4444', draggable: true }).setLngLat([mapLng, mapLat]).addTo(map);
      }

      if (marker) {
        marker.on('dragend', async () => {
          const lngLat = marker!.getLngLat();
          setIsReverseGeocoding(true);
          const { address } = await reverseGeocode(lngLat.lat, lngLat.lng);
          setIsReverseGeocoding(false);
          const newZona = address || `${lngLat.lat.toFixed(5)}, ${lngLat.lng.toFixed(5)}`;
          setQuery(newZona);
          onChange({ zona: newZona, lat: lngLat.lat, lng: lngLat.lng });
        });
      }

      map.on('click', handleMapClick);

      // Double-click opens expanded map
      map.on('dblclick', (e) => {
        e.preventDefault();
        setIsExpanded(true);
      });

      map.getCanvas().style.cursor = 'crosshair';
      mapRef.current = map;
      markerRef.current = marker;
    };

    initMap();
  }, [lat, lng, handleMapClick, onChange, DEFAULT_LAT, DEFAULT_LNG]);

  // Cleanup inline map
  useEffect(() => () => { mapRef.current?.remove(); }, []);

  // Initialize expanded map
  useEffect(() => {
    if (!isExpanded) return;
    const expLat = lat || DEFAULT_LAT;
    const expLng = lng || DEFAULT_LNG;

    setExpandedQuery(query);
    setExpandedAddress(query);
    setExpandedCoords(lat && lng ? { lat, lng } : null);

    // Small delay to let dialog render
    const timeout = setTimeout(async () => {
      if (!expandedMapContainerRef.current) return;
      const token = await initializeMapboxToken();
      if (!token || !expandedMapContainerRef.current) return;

      mapboxgl.accessToken = token;
      const map = new mapboxgl.Map({
        container: expandedMapContainerRef.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [expLng, expLat],
        zoom: lat && lng ? 14 : 11,
        interactive: true,
        doubleClickZoom: false,
      });

      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');
      const marker = new mapboxgl.Marker({ color: '#ef4444', draggable: true }).setLngLat([expLng, expLat]).addTo(map);

      const updateFromCoords = async (newLat: number, newLng: number) => {
        setIsReverseGeocoding(true);
        const { address } = await reverseGeocode(newLat, newLng);
        setIsReverseGeocoding(false);
        const addr = address || `${newLat.toFixed(5)}, ${newLng.toFixed(5)}`;
        setExpandedAddress(addr);
        setExpandedQuery(addr);
        setExpandedCoords({ lat: newLat, lng: newLng });
      };

      marker.on('dragend', () => {
        const lngLat = marker.getLngLat();
        updateFromCoords(lngLat.lat, lngLat.lng);
      });

      map.on('click', (e) => {
        const { lng: cLng, lat: cLat } = e.lngLat;
        marker.setLngLat([cLng, cLat]);
        updateFromCoords(cLat, cLng);
      });

      map.getCanvas().style.cursor = 'crosshair';
      expandedMapRef.current = map;
      expandedMarkerRef.current = marker;

      map.on('load', () => map.resize());
      setTimeout(() => map.resize(), 350);

      const observer = new ResizeObserver(() => map.resize());
      if (expandedMapContainerRef.current) {
        observer.observe(expandedMapContainerRef.current);
      }
    }, 100);

    return () => {
      clearTimeout(timeout);
      expandedMapRef.current?.remove();
      expandedMapRef.current = null;
      expandedMarkerRef.current = null;
    };
  }, [isExpanded]);

  // Inline search
  const handleSearch = useCallback(async (text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (text.length < 3) { setSuggestions([]); setShowSuggestions(false); return; }
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      const { suggestions: results } = await geocodeAddress(text, { limit: 5 });
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
      setIsSearching(false);
    }, 350);
  }, []);

  const handleSelect = (feature: any) => {
    const [fLng, fLat] = feature.center;
    const placeName = feature.place_name;
    setQuery(placeName);
    setSuggestions([]);
    setShowSuggestions(false);
    onChange({ zona: placeName, lat: fLat, lng: fLng });
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    onChange({ zona: '', lat: null, lng: null });
  };

  // Expanded search
  const handleExpandedSearch = useCallback(async (text: string) => {
    setExpandedQuery(text);
    if (expandedDebounceRef.current) clearTimeout(expandedDebounceRef.current);
    if (text.length < 3) { setExpandedSuggestions([]); setShowExpandedSuggestions(false); return; }
    expandedDebounceRef.current = setTimeout(async () => {
      setExpandedSearching(true);
      const { suggestions: results } = await geocodeAddress(text, { limit: 5 });
      setExpandedSuggestions(results);
      setShowExpandedSuggestions(results.length > 0);
      setExpandedSearching(false);
    }, 350);
  }, []);

  const handleExpandedSelect = (feature: any) => {
    const [fLng, fLat] = feature.center;
    setExpandedQuery(feature.place_name);
    setExpandedAddress(feature.place_name);
    setExpandedCoords({ lat: fLat, lng: fLng });
    setExpandedSuggestions([]);
    setShowExpandedSuggestions(false);
    if (expandedMapRef.current) {
      expandedMapRef.current.flyTo({ center: [fLng, fLat], zoom: 14 });
      expandedMarkerRef.current?.setLngLat([fLng, fLat]);
    }
  };

  const handleConfirmExpanded = () => {
    if (expandedCoords) {
      const addr = expandedAddress || `${expandedCoords.lat.toFixed(5)}, ${expandedCoords.lng.toFixed(5)}`;
      setQuery(addr);
      onChange({ zona: addr, lat: expandedCoords.lat, lng: expandedCoords.lng });
    }
    setIsExpanded(false);
  };

  return (
    <div className="space-y-2" ref={wrapperRef}>
      <div className="relative">
        <MapPin className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          value={query}
          onChange={e => handleSearch(e.target.value)}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          placeholder="Buscar dirección o ubicación..."
          className="h-8 text-xs pl-7 pr-8"
        />
        {(isSearching || isReverseGeocoding) && <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-muted-foreground" />}
        {query && !isSearching && !isReverseGeocoding && (
          <button onClick={handleClear} className="absolute right-2 top-1/2 -translate-y-1/2">
            <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
          </button>
        )}

        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-50 top-full mt-1 w-full bg-popover border rounded-md shadow-lg max-h-48 overflow-auto">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => handleSelect(s)}
                className="w-full text-left px-3 py-2 text-xs hover:bg-muted/50 flex items-start gap-2 border-b last:border-0"
              >
                <MapPin className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" />
                <span>{s.place_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="relative">
        <div className="rounded-md overflow-hidden border h-48" ref={mapContainerRef} />
        <button
          onClick={() => setIsExpanded(true)}
          className="absolute top-2 left-2 z-10 bg-background/90 border rounded-md p-1.5 hover:bg-accent transition-colors"
          title="Expandir mapa"
        >
          <Maximize2 className="h-3.5 w-3.5 text-foreground" />
        </button>
      </div>
      <p className="text-[10px] text-muted-foreground text-center">
        {lat && lng ? 'Doble clic para expandir el mapa' : 'Haz clic en el mapa para seleccionar ubicación'}
      </p>

      {/* Expanded map dialog */}
      <Dialog open={isExpanded} onOpenChange={(open) => { if (!open) handleConfirmExpanded(); }}>
        <DialogContent className="max-w-4xl !flex !flex-col overflow-hidden" style={{ height: '85vh' }}>
          <DialogHeader>
            <DialogTitle className="text-sm">Seleccionar Ubicación</DialogTitle>
          </DialogHeader>

          <div className="relative">
            <MapPin className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground z-10" />
            <Input
              value={expandedQuery}
              onChange={e => handleExpandedSearch(e.target.value)}
              onFocus={() => expandedSuggestions.length > 0 && setShowExpandedSuggestions(true)}
              placeholder="Buscar dirección o ubicación..."
              className="h-8 text-xs pl-7 pr-8"
            />
            {expandedSearching && <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-muted-foreground" />}

            {showExpandedSuggestions && expandedSuggestions.length > 0 && (
              <div className="absolute z-50 top-full mt-1 w-full bg-popover border rounded-md shadow-lg max-h-48 overflow-auto">
                {expandedSuggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handleExpandedSelect(s)}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-muted/50 flex items-start gap-2 border-b last:border-0"
                  >
                    <MapPin className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" />
                    <span>{s.place_name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 min-h-0 rounded-md overflow-hidden border" ref={expandedMapContainerRef} />

          <div className="flex items-center justify-between gap-4 pt-1">
            <p className="text-xs text-muted-foreground truncate flex-1">
              {isReverseGeocoding ? (
                <span className="flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Obteniendo dirección...</span>
              ) : expandedAddress ? (
                <>📍 {expandedAddress}</>
              ) : 'Haz clic en el mapa para seleccionar ubicación'}
            </p>
            <Button size="sm" onClick={handleConfirmExpanded} className="text-xs shrink-0">
              Confirmar ubicación
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
