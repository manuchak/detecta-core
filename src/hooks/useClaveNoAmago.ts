import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';
import { getCDMXDateString } from '@/utils/cdmxDateUtils';

/**
 * Batería de 200 palabras neutrales para la clave de no amago.
 * Se selecciona una por día de forma determinista (seed = fecha).
 */
const PALABRAS: string[] = [
  'horizonte','crepúsculo','ventana','diamante','brújula','cascada','centinela','tormenta',
  'coral','montaña','relámpago','aurora','cuarzo','amanecer','estrella','fénix',
  'glaciar','laguna','meteoro','nébula','olivo','pradera','quimera','rubí',
  'sardina','titán','umbral','viento','wafle','xilófono','yate','zafiro',
  'álamo','bambú','cerezo','delfín','esmeralda','fósil','granito','helio',
  'iris','jade','karma','lince','magma','nardo','ópalo','puma',
  'quetzal','reno','sirena','trueno','urraca','volcán','whisky','xenón',
  'yuca','zinc','ámbar','bonsái','cedro','durazno','encina','faro',
  'gaviota','halcón','iguana','jazmín','koala','loto','maple','naranjo',
  'olmo','pino','quinua','roble','sauce','tulipán','uva','violeta',
  'acacia','begonia','clavel','dalia','espino','fresno','gardenia','hiedra',
  'ibisco','junco','laurel','mirto','nogal','orquídea','petunia','reseda',
  'salvia','tilo','azucena','ciprés','eucalipto','flamboyán','geranio','higuera',
  'lavanda','magnolia','nomeolvides','palma','rododendro','siempreviva','trébol','verbena',
  'águila','bisonte','cóndor','dragón','elefante','faisán','grulla','hipopótamo',
  'jaguar','kiwi','leopardo','mapache','narval','ocelote','pantera','quokka',
  'rinoceronte','salamandra','tigre','unicornio','víbora','wombat','yak','zorro',
  'acero','bronce','cobre','estaño','fierro','grafeno','hierro','iridio',
  'litio','manganeso','níquel','osmio','platino','rodio','silicio','titanio',
  'uranio','vanadio','wolframio','berilio','cromo','disprosio','erbio','gadolinio',
  'hafnio','indio','kriptón','lantano','molibdeno','neón','oxígeno','paladio',
  'radio','selenio','talio','circonio','argón','bario','cerio','deuterio',
  'escandio','francio','galio','helio','iterbio','lutetio','mendelevio','neptunio',
  'praseodimio','renio','samario','terbio','tulio','europio','nobelio','fermio',
  'holmio','prometio','actinio','americio','bohrio','californio','dubnio','einstenio',
];

/** Deterministic word selection based on date string */
function selectWordForDate(dateStr: string): string {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = ((hash << 5) - hash + dateStr.charCodeAt(i)) | 0;
  }
  const idx = Math.abs(hash) % PALABRAS.length;
  return PALABRAS[idx];
}

/** Returns ms until next midnight CDMX */
function msUntilMidnightCDMX(): number {
  const now = new Date();
  const todayStr = getCDMXDateString(now.toISOString());
  const [y, m, d] = todayStr.split('-').map(Number);
  // Next day at 00:00 CDMX = 06:00 UTC (no DST)
  const nextMidnightUTC = Date.UTC(y, m - 1, d + 1, 6, 0, 0);
  return Math.max(nextMidnightUTC - now.getTime(), 1000);
}

export function useClaveNoAmago() {
  const qc = useQueryClient();
  const [todayCDMX, setTodayCDMX] = useState(() => getCDMXDateString(new Date().toISOString()));

  // Auto-refresh at midnight CDMX
  useEffect(() => {
    const timeout = setTimeout(() => {
      const newDate = getCDMXDateString(new Date().toISOString());
      setTodayCDMX(newDate);
      qc.invalidateQueries({ queryKey: ['clave-no-amago'] });
    }, msUntilMidnightCDMX());
    return () => clearTimeout(timeout);
  }, [todayCDMX, qc]);

  const insertWord = useMutation({
    mutationFn: async ({ fecha, palabra }: { fecha: string; palabra: string }) => {
      const { data, error } = await supabase
        .from('bitacora_clave_no_amago' as any)
        .upsert({ fecha, palabra }, { onConflict: 'fecha' })
        .select('palabra')
        .single();
      if (error) throw error;
      return (data as any).palabra as string;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clave-no-amago'] }),
  });

  const query = useQuery({
    queryKey: ['clave-no-amago', todayCDMX],
    queryFn: async () => {
      // Try to fetch today's word
      const { data, error } = await supabase
        .from('bitacora_clave_no_amago' as any)
        .select('palabra')
        .eq('fecha', todayCDMX)
        .maybeSingle();

      if (error) throw error;

      if (data) return (data as any).palabra as string;

      // No word for today — insert deterministically
      const palabra = selectWordForDate(todayCDMX);
      try {
        const result = await insertWord.mutateAsync({ fecha: todayCDMX, palabra });
        return result;
      } catch {
        // Race condition: another user already inserted — re-fetch
        const { data: refetch } = await supabase
          .from('bitacora_clave_no_amago' as any)
          .select('palabra')
          .eq('fecha', todayCDMX)
          .single();
        return (refetch as any)?.palabra as string ?? palabra;
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  return {
    palabra: query.data ?? null,
    isLoading: query.isLoading,
  };
}
