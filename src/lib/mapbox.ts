// Mapbox configuration
// The token will be set from Supabase secrets
export let MAPBOX_ACCESS_TOKEN = '';

// Function to get token from Supabase edge function
async function getMapboxToken() {
  try {
    const response = await fetch('https://yydzzeljaewsfhmilnhm.supabase.co/functions/v1/mapbox-token');
    if (response.ok) {
      const data = await response.json();
      return data.token;
    }
  } catch (error) {
    console.warn('Could not fetch Mapbox token from server:', error);
  }
  return null;
}

// Initialize token
export const initializeMapboxToken = async () => {
  if (!MAPBOX_ACCESS_TOKEN) {
    const token = await getMapboxToken();
    if (token) {
      MAPBOX_ACCESS_TOKEN = token;
      return token;
    } else {
      console.warn('MAPBOX_ACCESS_TOKEN not available. Please configure it in Supabase secrets.');
      return null;
    }
  }
  return MAPBOX_ACCESS_TOKEN;
};