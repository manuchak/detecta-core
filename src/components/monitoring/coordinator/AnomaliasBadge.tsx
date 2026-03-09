import React from 'react';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Badge showing count of assignment anomalies logged today.
 */
export const AnomaliasBadge: React.FC = () => {
  const { data: count = 0 } = useQuery({
    queryKey: ['anomalias-turno-today'],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count, error } = await (supabase as any)
        .from('bitacora_anomalias_turno')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());
      if (error) return 0;
      return count || 0;
    },
    refetchInterval: 30_000,
  });

  if (count === 0) return null;

  return (
    <Badge variant="destructive" className="text-[10px] gap-1 px-2 py-0.5">
      <AlertTriangle className="h-3 w-3" />
      {count} anomalía{count !== 1 ? 's' : ''}
    </Badge>
  );
};
