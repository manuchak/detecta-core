import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { MapPin, Loader2, X } from 'lucide-react';
import { geocodeAddress } from '@/lib/mapbox';
import mapboxgl from 'mapbox-gl';
import { initializeMapboxToken } from '@/lib/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

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
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
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

  // Initialize map when coordinates exist
  useEffect(() => {
    if (!lat || !lng || !mapContainerRef.current) return;

    const initMap = async () => {
      const token = await initializeMapboxToken();
      if (!token || !mapContainerRef.current) return;

      if (mapRef.current) {
        mapRef.current.flyTo({ center: [lng, lat], zoom: 14 });
        if (markerRef.current) markerRef.current.setLngLat([lng, lat]);
        else markerRef.current = new mapboxgl.Marker({ color: '#ef4444' }).setLngLat([lng, lat]).addTo(mapRef.current);
        return;
      }

      mapboxgl.accessToken = token;
      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [lng, lat],
        zoom: 14,
        interactive: false,
      });
      mapRef.current = map;
      markerRef.current = new mapboxgl.Marker({ color: '#ef4444' }).setLngLat([lng, lat]).addTo(map);
    };

    initMap();
  }, [lat, lng]);

  // Cleanup
  useEffect(() => () => { mapRef.current?.remove(); }, []);

  const handleSearch = useCallback(async (text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (text.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

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
        {isSearching && <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-muted-foreground" />}
        {query && !isSearching && (
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

      {lat && lng && (
        <div className="rounded-md overflow-hidden border h-32" ref={mapContainerRef} />
      )}
    </div>
  );
};
