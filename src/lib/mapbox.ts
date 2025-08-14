// Mapbox configuration
// Using environment variable for security
export const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '';

// Fallback warning for development
if (!MAPBOX_ACCESS_TOKEN) {
  console.warn('MAPBOX_ACCESS_TOKEN not set. Map functionality may not work properly.');
}