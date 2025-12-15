import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type MaintenanceType = 
  | 'aceite' 
  | 'filtro_aceite' 
  | 'frenos' 
  | 'llantas_rotacion' 
  | 'llantas_cambio' 
  | 'filtro_aire' 
  | 'bujias' 
  | 'liquido_frenos' 
  | 'transmision' 
  | 'otro';

export interface MaintenanceRecord {
  id: string;
  custodio_id?: string;
  custodio_telefono?: string;
  tipo_mantenimiento: MaintenanceType;
  km_al_momento: number;
  fecha_realizacion: string;
  costo_estimado?: number;
  taller_mecanico?: string;
  notas?: string;
  evidencia_url?: string;
  created_at: string;
}

export interface MaintenanceInterval {
  tipo: MaintenanceType;
  nombre: string;
  intervalo_km: number;
  prioridad: 'alta' | 'media' | 'baja';
  descripcion: string;
  icono: string;
}

// Intervalos de mantenimiento basados en teoría automotriz
export const MAINTENANCE_INTERVALS: MaintenanceInterval[] = [
  { tipo: 'aceite', nombre: 'Cambio de Aceite', intervalo_km: 7500, prioridad: 'alta', descripcion: 'Aceite de motor y filtro', icono: '🛢️' },
  { tipo: 'filtro_aceite', nombre: 'Filtro de Aceite', intervalo_km: 7500, prioridad: 'alta', descripcion: 'Junto con cambio de aceite', icono: '🔧' },
  { tipo: 'frenos', nombre: 'Inspección de Frenos', intervalo_km: 20000, prioridad: 'media', descripcion: 'Balatas y discos', icono: '🛑' },
  { tipo: 'llantas_rotacion', nombre: 'Rotación de Llantas', intervalo_km: 10000, prioridad: 'media', descripcion: 'Para desgaste uniforme', icono: '🔄' },
  { tipo: 'llantas_cambio', nombre: 'Cambio de Llantas', intervalo_km: 50000, prioridad: 'baja', descripcion: 'Juego completo', icono: '🛞' },
  { tipo: 'filtro_aire', nombre: 'Filtro de Aire', intervalo_km: 20000, prioridad: 'media', descripcion: 'Filtro del motor', icono: '💨' },
  { tipo: 'bujias', nombre: 'Bujías', intervalo_km: 40000, prioridad: 'baja', descripcion: 'Encendido del motor', icono: '⚡' },
  { tipo: 'liquido_frenos', nombre: 'Líquido de Frenos', intervalo_km: 30000, prioridad: 'media', descripcion: 'Cambio de líquido', icono: '💧' },
  { tipo: 'transmision', nombre: 'Aceite Transmisión', intervalo_km: 60000, prioridad: 'baja', descripcion: 'Caja de velocidades', icono: '⚙️' },
];

export interface MaintenanceStatus {
  tipo: MaintenanceType;
  nombre: string;
  icono: string;
  ultimo_km: number;
  ultimo_fecha?: string;
  proximo_km: number;
  km_restantes: number;
  porcentaje_vida: number;
  estado: 'ok' | 'proximo' | 'vencido';
  prioridad: 'alta' | 'media' | 'baja';
}

interface CreateMaintenanceData {
  tipo_mantenimiento: MaintenanceType;
  km_al_momento: number;
  fecha_realizacion?: string;
  costo_estimado?: number;
  taller_mecanico?: string;
  notas?: string;
  evidencia_url?: string;
}

export const useCustodianMaintenance = (custodianPhone?: string, currentKm?: number) => {
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [customIntervals, setCustomIntervals] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (custodianPhone) {
      fetchMaintenanceRecords();
      fetchCustomIntervals();
    } else {
      setRecords([]);
      setCustomIntervals(new Map());
      setLoading(false);
    }
  }, [custodianPhone]);

  const fetchCustomIntervals = async () => {
    if (!custodianPhone) return;
    
    try {
      const { data } = await supabase
        .from('custodio_configuracion_mantenimiento')
        .select('tipo_mantenimiento, intervalo_km_personalizado')
        .eq('custodio_telefono', custodianPhone);
      
      const intervalMap = new Map(
        (data || []).map(d => [d.tipo_mantenimiento, d.intervalo_km_personalizado])
      );
      setCustomIntervals(intervalMap);
    } catch (error) {
      console.error('Error fetching custom intervals:', error);
    }
  };

  const fetchMaintenanceRecords = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('custodio_mantenimientos')
        .select('*')
        .eq('custodio_telefono', custodianPhone)
        .order('fecha_realizacion', { ascending: false });

      if (error) {
        console.error('Error fetching maintenance records:', error);
        setRecords([]);
      } else {
        setRecords(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const createMaintenance = async (data: CreateMaintenanceData): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('custodio_mantenimientos')
        .insert({
          custodio_telefono: custodianPhone,
          tipo_mantenimiento: data.tipo_mantenimiento,
          km_al_momento: data.km_al_momento,
          fecha_realizacion: data.fecha_realizacion || new Date().toISOString().split('T')[0],
          costo_estimado: data.costo_estimado,
          taller_mecanico: data.taller_mecanico,
          notas: data.notas,
          evidencia_url: data.evidencia_url,
        });

      if (error) {
        console.error('Error creating maintenance:', error);
        toast({
          title: 'Error',
          description: 'No se pudo registrar el mantenimiento',
          variant: 'destructive',
        });
        return false;
      }

      toast({
        title: '✅ Mantenimiento registrado',
        description: 'Se actualizó el estado de tu vehículo',
      });

      await fetchMaintenanceRecords();
      return true;
    } catch (error) {
      console.error('Error:', error);
      return false;
    }
  };

  // Calcular estado de cada tipo de mantenimiento
  const maintenanceStatus = useMemo((): MaintenanceStatus[] => {
    const km = currentKm || 0;
    
    return MAINTENANCE_INTERVALS.map(interval => {
      // Usar intervalo personalizado si existe
      const customInterval = customIntervals.get(interval.tipo);
      const effectiveInterval = customInterval || interval.intervalo_km;
      
      // Buscar último mantenimiento de este tipo
      const lastRecord = records.find(r => r.tipo_mantenimiento === interval.tipo);
      const ultimoKm = lastRecord?.km_al_momento || 0;
      const proximoKm = ultimoKm + effectiveInterval;
      const kmRestantes = proximoKm - km;
      const porcentajeVida = Math.max(0, Math.min(100, (kmRestantes / effectiveInterval) * 100));
      
      let estado: 'ok' | 'proximo' | 'vencido' = 'ok';
      if (kmRestantes <= 0) {
        estado = 'vencido';
      } else if (porcentajeVida <= 20) {
        estado = 'proximo';
      }

      return {
        tipo: interval.tipo,
        nombre: interval.nombre,
        icono: interval.icono,
        ultimo_km: ultimoKm,
        ultimo_fecha: lastRecord?.fecha_realizacion,
        proximo_km: proximoKm,
        km_restantes: kmRestantes,
        porcentaje_vida: porcentajeVida,
        estado,
        prioridad: interval.prioridad,
      };
    });
  }, [records, currentKm, customIntervals]);

  // Mantenimientos que requieren atención (vencidos o próximos)
  const pendingMaintenance = useMemo(() => {
    return maintenanceStatus
      .filter(m => m.estado === 'vencido' || m.estado === 'proximo')
      .sort((a, b) => a.km_restantes - b.km_restantes);
  }, [maintenanceStatus]);

  return {
    records,
    loading,
    maintenanceStatus,
    pendingMaintenance,
    createMaintenance,
    refetch: fetchMaintenanceRecords,
    refetchIntervals: fetchCustomIntervals,
    MAINTENANCE_INTERVALS,
  };
};
