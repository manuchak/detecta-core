import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { computePersonalDataCompletion } from './PersonalDataTab';

interface Props {
  candidatoId: string;
  tipoOperativo?: 'custodio' | 'armado';
  size?: 'sm' | 'default';
}

export function PersonalDataBadge({ candidatoId, tipoOperativo = 'custodio', size = 'default' }: Props) {
  const isArmado = tipoOperativo === 'armado';
  const tableName = isArmado ? 'candidatos_armados' : 'candidatos_custodios';
  const selectFields = isArmado
    ? 'nombre, telefono, email, vehiculo_propio'
    : 'nombre, telefono, email, curp, direccion, vehiculo_propio, marca_vehiculo, modelo_vehiculo, placas_vehiculo, color_vehiculo, numero_serie, numero_motor, numero_licencia';

  const { data } = useQuery({
    queryKey: ['candidato-personal-data', candidatoId, tipoOperativo],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from(tableName)
        .select(selectFields)
        .eq('id', candidatoId)
        .single();
      if (error) throw error;
      return data as any;
    },
    enabled: !!candidatoId,
  });

  const { completed, total } = computePersonalDataCompletion(data, tipoOperativo);
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
