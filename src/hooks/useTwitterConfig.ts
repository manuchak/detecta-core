import { useAuthenticatedQuery } from '@/hooks/useAuthenticatedQuery';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface TwitterMonitoredAccount {
  id: string;
  username: string;
  display_name: string | null;
  categoria: string;
  activa: boolean;
  notas: string | null;
  agregada_por: string | null;
  created_at: string;
}

export interface TwitterApiUsage {
  id: string;
  fecha: string;
  tweets_leidos: number;
  queries_ejecutadas: number;
  tweets_insertados: number;
  tweets_duplicados: number;
  rate_limited: boolean;
  created_at: string;
}

const MONTHLY_TWEET_LIMIT = 10000;
const COST_PER_TWEET = 0.02;

export function useTwitterAccounts() {
  return useAuthenticatedQuery<TwitterMonitoredAccount[]>(
    ['twitter-monitored-accounts'],
    async () => {
      const { data, error } = await supabase
        .from('twitter_monitored_accounts')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as unknown as TwitterMonitoredAccount[];
    },
    { config: 'standard' }
  );
}

export function useTwitterApiUsage() {
  const now = new Date();
  const firstOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

  return useAuthenticatedQuery<TwitterApiUsage[]>(
    ['twitter-api-usage', firstOfMonth],
    async () => {
      const { data, error } = await supabase
        .from('twitter_api_usage')
        .select('*')
        .gte('fecha', firstOfMonth)
        .order('fecha', { ascending: false });
      if (error) throw error;
      return data as unknown as TwitterApiUsage[];
    },
    { config: 'standard' }
  );
}

export function useMonthlyUsageSummary() {
  const { data: usage, isLoading } = useTwitterApiUsage();

  const totalTweets = usage?.reduce((sum, d) => sum + d.tweets_leidos, 0) ?? 0;
  const totalInserted = usage?.reduce((sum, d) => sum + d.tweets_insertados, 0) ?? 0;
  const totalQueries = usage?.reduce((sum, d) => sum + d.queries_ejecutadas, 0) ?? 0;
  const wasRateLimited = usage?.some((d) => d.rate_limited) ?? false;
  const usagePercent = Math.min((totalTweets / MONTHLY_TWEET_LIMIT) * 100, 100);
  const estimatedCost = totalTweets * COST_PER_TWEET;

  return {
    totalTweets,
    totalInserted,
    totalQueries,
    wasRateLimited,
    usagePercent,
    estimatedCost,
    limit: MONTHLY_TWEET_LIMIT,
    dailyUsage: usage ?? [],
    isLoading,
  };
}

export function useAddTwitterAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (account: { username: string; display_name: string; categoria: string; notas: string }) => {
      const { error } = await supabase.from('twitter_monitored_accounts').insert({
        username: account.username.replace(/^@/, ''),
        display_name: account.display_name || null,
        categoria: account.categoria,
        notas: account.notas || null,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['twitter-monitored-accounts'] });
      toast.success('Cuenta agregada');
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useToggleTwitterAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, activa }: { id: string; activa: boolean }) => {
      const { error } = await supabase
        .from('twitter_monitored_accounts')
        .update({ activa } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['twitter-monitored-accounts'] }),
    onError: (e: any) => toast.error(e.message),
  });
}

export function useDeleteTwitterAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('twitter_monitored_accounts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['twitter-monitored-accounts'] });
      toast.success('Cuenta eliminada');
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useRunTwitterSearch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('twitter-incident-search');
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['twitter-api-usage'] });
      qc.invalidateQueries({ queryKey: ['incidentes-rrss'] });
      qc.invalidateQueries({ queryKey: ['incidentes-stats'] });
      toast.success(`Búsqueda completada: ${data?.insertados ?? 0} tweets nuevos`);
    },
    onError: (e: any) => toast.error(`Error: ${e.message}`),
  });
}

// ── Twitter Search Keywords ─────────────────────────────────────────

export interface TwitterSearchKeyword {
  id: string;
  query_text: string;
  categoria: string;
  activa: boolean;
  es_predeterminada: boolean;
  notas: string | null;
  created_at: string;
}

export function useTwitterKeywords() {
  return useAuthenticatedQuery<TwitterSearchKeyword[]>(
    ['twitter-search-keywords'],
    async () => {
      const { data, error } = await supabase
        .from('twitter_search_keywords')
        .select('*')
        .order('categoria', { ascending: true })
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as unknown as TwitterSearchKeyword[];
    },
    { config: 'standard' }
  );
}

export function useAddTwitterKeyword() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (kw: { query_text: string; categoria: string; notas: string }) => {
      const { error } = await supabase.from('twitter_search_keywords').insert({
        query_text: kw.query_text,
        categoria: kw.categoria,
        notas: kw.notas || null,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['twitter-search-keywords'] });
      toast.success('Palabra clave agregada');
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useToggleTwitterKeyword() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, activa }: { id: string; activa: boolean }) => {
      const { error } = await supabase
        .from('twitter_search_keywords')
        .update({ activa } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['twitter-search-keywords'] }),
    onError: (e: any) => toast.error(e.message),
  });
}

export function useDeleteTwitterKeyword() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('twitter_search_keywords').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['twitter-search-keywords'] });
      toast.success('Palabra clave eliminada');
    },
    onError: (e: any) => toast.error(e.message),
  });
}
