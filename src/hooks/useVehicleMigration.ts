import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useVehicleMigration = () => {
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState<{
    completed: boolean;
    recordCount?: number;
    error?: string;
  }>({ completed: false });

  const runMigration = async () => {
    setIsMigrating(true);
    try {
      console.log('🚀 Iniciando migración de datos de vehículos...');
      
      const { data, error } = await supabase.rpc('migrate_vehicle_data_from_services');
      
      if (error) {
        console.error('❌ Error en migración:', error);
        setMigrationStatus({
          completed: false,
          error: error.message
        });
        toast.error(`Error en migración: ${error.message}`);
        return false;
      }

      const recordCount = data || 0;
      console.log(`✅ Migración completada: ${recordCount} vehículos migrados`);
      
      setMigrationStatus({
        completed: true,
        recordCount
      });

      if (recordCount > 0) {
        toast.success(`Migración exitosa: ${recordCount} vehículos migrados desde servicios históricos`);
      } else {
        toast.info('Migración completada: no se encontraron nuevos vehículos por migrar');
      }

      return true;
    } catch (err) {
      console.error('❌ Error en migración:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido en migración';
      setMigrationStatus({
        completed: false,
        error: errorMessage
      });
      toast.error(`Error en migración: ${errorMessage}`);
      return false;
    } finally {
      setIsMigrating(false);
    }
  };

  const resetMigrationStatus = () => {
    setMigrationStatus({ completed: false });
  };

  return {
    runMigration,
    isMigrating,
    migrationStatus,
    resetMigrationStatus
  };
};