// @ts-nocheck
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface ProjectCostEntry {
  id: string;
  entry_date: string;
  messages_count: number;
  estimated_cost_usd: number;
  participants: string[];
  version_id: string | null;
  category: string;
  notes: string | null;
  created_at: string;
  version_number?: string;
  version_name?: string;
}

export const useProjectCosts = () => {
  const queryClient = useQueryClient();

  const { data: costEntries, isLoading } = useQuery({
    queryKey: ['project-cost-entries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_cost_entries')
        .select(`
          *,
          system_versions (
            version_number,
            version_name
          )
        `)
        .order('entry_date', { ascending: true });

      if (error) throw error;
      return (data || []).map((entry: any) => ({
        ...entry,
        version_number: entry.system_versions?.version_number,
        version_name: entry.system_versions?.version_name,
      })) as ProjectCostEntry[];
    },
  });

  const addEntry = useMutation({
    mutationFn: async (entry: {
      entry_date: string;
      messages_count: number;
      estimated_cost_usd: number;
      participants: string[];
      version_id?: string;
      category: string;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from('project_cost_entries')
        .insert(entry)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-cost-entries'] });
      toast({ title: "Éxito", description: "Entrada de costo registrada" });
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo registrar la entrada", variant: "destructive" });
    },
  });

  // Computed KPIs
  const totalCost = costEntries?.reduce((sum, e) => sum + Number(e.estimated_cost_usd), 0) ?? 0;
  const totalMessages = costEntries?.reduce((sum, e) => sum + e.messages_count, 0) ?? 0;
  const uniqueParticipants = [...new Set(costEntries?.flatMap(e => e.participants) ?? [])];
  
  const firstDate = costEntries?.[0]?.entry_date;
  const lastDate = costEntries?.[costEntries.length - 1]?.entry_date;
  const daySpan = firstDate && lastDate
    ? Math.max(1, Math.ceil((new Date(lastDate).getTime() - new Date(firstDate).getTime()) / (1000 * 60 * 60 * 24)))
    : 1;
  const avgDailyCost = totalCost / daySpan;

  // Chart data - accumulated cost over time
  const accumulatedCostData = costEntries?.reduce((acc, entry) => {
    const prev = acc.length > 0 ? acc[acc.length - 1].costo_acumulado : 0;
    acc.push({
      fecha: entry.entry_date,
      costo: Number(entry.estimated_cost_usd),
      costo_acumulado: prev + Number(entry.estimated_cost_usd),
      version: entry.version_number || 'N/A',
    });
    return acc;
  }, [] as { fecha: string; costo: number; costo_acumulado: number; version: string }[]) ?? [];

  // Chart data - messages per version
  const messagesByVersion = costEntries?.map(entry => ({
    version: entry.version_number || 'N/A',
    mensajes: entry.messages_count,
    costo: Number(entry.estimated_cost_usd),
  })) ?? [];

  return {
    costEntries,
    isLoading,
    addEntry,
    totalCost,
    totalMessages,
    uniqueParticipants,
    avgDailyCost,
    accumulatedCostData,
    messagesByVersion,
  };
};
