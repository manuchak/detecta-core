import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface VoCTheme {
  name: string;
  count: number;
  sentiment: 'positivo' | 'negativo' | 'neutro';
  keywords: string[];
}

export interface VoCWordCloud {
  word: string;
  frequency: number;
  sentiment: 'positivo' | 'negativo' | 'neutro';
}

export interface VoCVerbatim {
  text: string;
  source: 'Queja' | 'CSAT' | 'NPS' | 'Touchpoint';
  sentiment: 'positivo' | 'negativo' | 'neutro';
  cliente: string;
}

export interface VoCRecommendation {
  action: string;
  priority: 'alta' | 'media' | 'baja';
  context: string;
}

export interface VoCAnalysis {
  sentiment_score: number;
  executive_summary: string;
  themes: VoCTheme[];
  word_cloud: VoCWordCloud[];
  verbatims: VoCVerbatim[];
  recommendations: VoCRecommendation[];
  total_texts: number;
  sources: { quejas: number; touchpoints: number; csat: number; nps: number };
  analyzed_at: string;
  empty?: boolean;
}

export function useCSVoC() {
  const qc = useQueryClient();

  const query = useQuery<VoCAnalysis>({
    queryKey: ['cs-voc-analysis'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('cs-voc-analysis');
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as VoCAnalysis;
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
    retry: 1,
    meta: {
      onError: (e: Error) => {
        toast.error('Error al analizar VoC: ' + e.message);
      },
    },
  });

  const regenerate = () => {
    qc.invalidateQueries({ queryKey: ['cs-voc-analysis'] });
    toast.info('Regenerando análisis VoC...');
  };

  return { ...query, regenerate };
}
