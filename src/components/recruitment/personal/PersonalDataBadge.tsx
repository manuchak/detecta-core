import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { computePersonalDataCompletion } from './PersonalDataTab';

interface Props {
  candidatoId: string;
  size?: 'sm' | 'default';
}

export function PersonalDataBadge({ candidatoId, size = 'default' }: Props) {
  const { data } = useQuery({
    queryKey: ['candidato-personal-data', candidatoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('candidatos_custodios')
        .select('nombre, telefono, email, curp, direccion, vehiculo_propio, marca_vehiculo, modelo_vehiculo, placas_vehiculo, color_vehiculo, numero_serie, numero_motor, numero_licencia')
        .eq('id', candidatoId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!candidatoId,
  });

  const { completed, total } = computePersonalDataCompletion(data);
  const isComplete = completed >= 3; // nombre + telefono + email minimum

  return (
    <Badge
      variant={isComplete ? 'default' : 'outline'}
      className={size === 'sm' ? 'text-[10px] px-1.5 py-0' : ''}
    >
      {completed}/{total}
    </Badge>
  );
}
