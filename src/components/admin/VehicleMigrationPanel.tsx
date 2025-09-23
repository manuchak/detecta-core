import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Truck, Database, Play, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useVehicleMigration } from '@/hooks/useVehicleMigration';

export function VehicleMigrationPanel() {
  const { isMigrating, migrationResults, runMigration } = useVehicleMigration();

  const handleMigration = async () => {
    if (window.confirm('¿Estás seguro de que deseas ejecutar la migración de datos de vehículos?')) {
      try {
        await runMigration();
      } catch (error) {
        // Error is handled in the hook
      }
    }
  };

  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5 text-blue-600" />
          Migración de Datos de Vehículos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Database className="h-4 w-4" />
          <AlertDescription>
            Migra automáticamente los datos de vehículos desde servicios_custodia hacia custodios_vehiculos.
          </AlertDescription>
        </Alert>

        {migrationResults !== null && (
          <Badge variant={migrationResults > 0 ? 'success' : 'secondary'}>
            <CheckCircle2 className="h-3 w-3 mr-1" />
            {migrationResults > 0 ? `${migrationResults} vehículos migrados` : 'Sin nuevos datos'}
          </Badge>
        )}

        <Button onClick={handleMigration} disabled={isMigrating} className="w-full">
          {isMigrating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Ejecutando migración...
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Ejecutar Migración
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}