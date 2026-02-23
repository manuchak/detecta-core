import { supabase } from '@/integrations/supabase/client';

type FirecrawlIncidentResponse = {
  success: boolean;
  error?: string;
  stats?: {
    insertados: number;
    duplicados: number;
    errores: number;
    total_resultados: number;
  };
};

export const firecrawlIncidentApi = {
  async searchIncidents(timeFilter: 'qdr:h' | 'qdr:d' | 'qdr:w' | 'qdr:m' = 'qdr:w'): Promise<FirecrawlIncidentResponse> {
    const { data, error } = await supabase.functions.invoke('firecrawl-incident-search', {
      body: { time_filter: timeFilter, limit: 20 },
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return data;
  },
};
