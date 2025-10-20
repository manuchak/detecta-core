import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useVehicleMigration() {
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationResults, setMigrationResults] = useState<number | null>(null);

  const runMigration = async () => {
    setIsMigrating(true);
    setMigrationResults(null);
    
    try {
      const { data, error } = await supabase.rpc('migrate_vehicle_data_from_services');
      
      if (error) throw error;
      
      setMigrationResults(data);
      
      if (data > 0) {
        toast.success(`Migración completada: ${data} vehículos migrados`);
      } else {
        toast.info('No se encontraron vehículos nuevos para migrar');
      }
      
      return data;
    } catch (err) {
      console.error('Error running migration:', err);
      toast.error('Error al ejecutar la migración de vehículos');
      throw err;
    } finally {
      setIsMigrating(false);
    }
  };

  const migrateVehicleForCustodian = async (custodioNombre: string) => {
    try {
      const { data, error } = await supabase.rpc('migrate_vehicle_from_servicios_custodia', {
        p_custodio_nombre: custodioNombre
      });

      if (error) {
        console.error('Error en migración individual:', error);
        return { success: false, error: error.message };
      }

      if (data?.success) {
        toast.success(`Vehículo migrado: ${data.marca} ${data.modelo}`);
        return { success: true, data };
      } else {
        console.warn('Migración no exitosa:', data?.message);
        return { success: false, message: data?.message };
      }
    } catch (err) {
      console.error('Error en migración de vehículo:', err);
      return { success: false, error: err };
    }
  };

  return {
    isMigrating,
    migrationResults,
    runMigration,
    migrateVehicleForCustodian
  };
}