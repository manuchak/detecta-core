import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CustodioAdopcion {
  id: string;
  nombre: string;
  telefono: string;
  estado: string;
  tiene_cuenta: boolean;
  profile_id: string | null;
  display_name: string | null;
  email: string | null;
  tiene_rol_custodio: boolean;
  ultimo_checklist: string | null;
  ultimo_ticket: string | null;
}

export interface ResumenAdopcion {
  total: number;
  conCuenta: number;
  conRol: number;
  sinCuenta: number;
}

export type FiltroAdopcion = "todos" | "sin_cuenta" | "sin_rol" | "activos_digitalmente";

export const useAdopcionDigital = () => {
  return useQuery({
    queryKey: ["adopcion-digital"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_custodian_adoption_status");
      if (error) throw error;

      const custodios = (data || []) as CustodioAdopcion[];

      const resumen: ResumenAdopcion = {
        total: custodios.length,
        conCuenta: custodios.filter((c) => c.tiene_cuenta).length,
        conRol: custodios.filter((c) => c.tiene_rol_custodio).length,
        sinCuenta: custodios.filter((c) => !c.tiene_cuenta).length,
      };

      return { custodios, resumen };
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const filtrarCustodios = (
  custodios: CustodioAdopcion[],
  filtro: FiltroAdopcion
): CustodioAdopcion[] => {
  switch (filtro) {
    case "sin_cuenta":
      return custodios.filter((c) => !c.tiene_cuenta);
    case "sin_rol":
      return custodios.filter((c) => c.tiene_cuenta && !c.tiene_rol_custodio);
    case "activos_digitalmente":
      return custodios.filter((c) => c.tiene_rol_custodio);
    default:
      return custodios;
  }
};
