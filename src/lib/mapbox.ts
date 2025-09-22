// Mapbox configuration and utilities
export let MAPBOX_ACCESS_TOKEN = '';

// Enhanced error types for better debugging
export interface MapboxError {
  type: 'network' | 'auth' | 'api' | 'token';
  message: string;
  status?: number;
}

// Function to get token from Supabase edge function with retry logic
async function getMapboxToken(retries = 2): Promise<string | null> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch('https://yydzzeljaewsfhmilnhm.supabase.co/functions/v1/mapbox-token', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.token && typeof data.token === 'string') {
          console.log('✅ Mapbox token retrieved successfully');
          return data.token;
        } else {
          console.warn('⚠️ Invalid token format received from server');
        }
      } else {
        console.warn(`⚠️ Mapbox token request failed with status ${response.status}:`, response.statusText);
        
        // Try to get error details
        try {
          const errorData = await response.json();
          console.warn('Error details:', errorData);
        } catch (e) {
          console.warn('Could not parse error response');
        }
      }
    } catch (error) {
      console.warn(`🔄 Mapbox token fetch attempt ${attempt + 1} failed:`, error);
      
      // If it's the last attempt, don't retry
      if (attempt === retries) {
        console.error('❌ All Mapbox token fetch attempts failed');
      } else {
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }
  return null;
}

// Initialize token with improved error handling
export const initializeMapboxToken = async (): Promise<string | null> => {
  if (MAPBOX_ACCESS_TOKEN) {
    return MAPBOX_ACCESS_TOKEN;
  }

  console.log('🔄 Initializing Mapbox token...');
  const token = await getMapboxToken();
  
  if (token) {
    MAPBOX_ACCESS_TOKEN = token;
    console.log('✅ Mapbox token initialized successfully');
    return token;
  } else {
    console.error('❌ MAPBOX_ACCESS_TOKEN not available. Please configure it in Supabase Edge Functions secrets.');
    return null;
  }
};

// Geocoding function with enhanced error handling
export async function geocodeAddress(address: string, options?: {
  limit?: number;
  country?: string;
  types?: string;
}): Promise<{ suggestions: any[], error?: MapboxError }> {
  try {
    const token = await initializeMapboxToken();
    if (!token) {
      return {
        suggestions: [],
        error: {
          type: 'token',
          message: 'Token de Mapbox no disponible'
        }
      };
    }

    const params = new URLSearchParams({
      access_token: token,
      limit: (options?.limit || 5).toString(),
      country: options?.country || 'MX',
      language: 'es',
      ...(options?.types && { types: options.types })
    });

    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?${params}`
    );

    if (!response.ok) {
      const errorText = await response.text();
      return {
        suggestions: [],
        error: {
          type: response.status === 401 ? 'auth' : 'api',
          message: `Error de Mapbox (${response.status}): ${errorText}`,
          status: response.status
        }
      };
    }

    const data = await response.json();
    return {
      suggestions: data.features || [],
      error: undefined
    };

  } catch (error) {
    console.error('Geocoding error:', error);
    return {
      suggestions: [],
      error: {
        type: 'network',
        message: error instanceof Error ? error.message : 'Error de conexión'
      }
    };
  }
}

// Reverse geocoding function
export async function reverseGeocode(lat: number, lng: number): Promise<{ address: string | null, error?: MapboxError }> {
  try {
    const token = await initializeMapboxToken();
    if (!token) {
      return {
        address: null,
        error: {
          type: 'token',
          message: 'Token de Mapbox no disponible'
        }
      };
    }

    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}&language=es&country=MX`
    );

    if (!response.ok) {
      return {
        address: null,
        error: {
          type: response.status === 401 ? 'auth' : 'api',
          message: `Error de geocodificación inversa (${response.status})`,
          status: response.status
        }
      };
    }

    const data = await response.json();
    const feature = data.features?.[0];
    
    return {
      address: feature?.place_name || null,
      error: undefined
    };

  } catch (error) {
    return {
      address: null,
      error: {
        type: 'network',
        message: error instanceof Error ? error.message : 'Error de conexión'
      }
    };
  }
}