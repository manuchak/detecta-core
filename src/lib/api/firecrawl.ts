const SUPABASE_URL = "https://yydzzeljaewsfhmilnhm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5ZHp6ZWxqYWV3c2ZobWlsbmhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2OTc1MjIsImV4cCI6MjA2MzI3MzUyMn0.iP9UG12mKESneZq7XwY6vHvqRGH3hq3D1Hu0qneu8B8";

export type FirecrawlProgressEvent = {
  step: number;
  total_steps: number;
  query: string;
  status: 'searching' | 'inserting' | 'done' | 'error';
  found?: number;
  inserted?: number;
  dupes?: number;
  errors?: number;
  error?: string;
};

export type FirecrawlFinalStats = {
  insertados: number;
  duplicados: number;
  errores: number;
  total_resultados: number;
};

export type FirecrawlDoneEvent = {
  done: true;
  stats: FirecrawlFinalStats;
};

export const firecrawlIncidentApi = {
  async searchIncidentsWithProgress(
    timeFilter: 'qdr:h' | 'qdr:d' | 'qdr:w' | 'qdr:m' = 'qdr:w',
    onProgress: (event: FirecrawlProgressEvent) => void,
  ): Promise<FirecrawlFinalStats> {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/firecrawl-incident-search`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ time_filter: timeFilter, limit: 20 }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errData.error || `HTTP ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response stream');

    const decoder = new TextDecoder();
    let buffer = '';
    let finalStats: FirecrawlFinalStats | null = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const event = JSON.parse(trimmed);
          if (event.done) {
            finalStats = event.stats;
          } else {
            onProgress(event as FirecrawlProgressEvent);
          }
        } catch {
          // skip malformed lines
        }
      }
    }

    // Process remaining buffer
    if (buffer.trim()) {
      try {
        const event = JSON.parse(buffer.trim());
        if (event.done) {
          finalStats = event.stats;
        } else {
          onProgress(event as FirecrawlProgressEvent);
        }
      } catch {
        // skip
      }
    }

    return finalStats || { insertados: 0, duplicados: 0, errores: 0, total_resultados: 0 };
  },
};
