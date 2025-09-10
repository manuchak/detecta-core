
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, CheckCircle, Clock, Play, Shield, Trash2, Upload } from 'lucide-react';
import { useDuplicateCleanup } from '@/hooks/useDuplicateCleanup';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { ImportWizardEnhanced } from './ImportWizardEnhanced';

const DuplicateCleanupManager = () => {
  const {
    duplicates,
    maintenanceLogs,
    checkingDuplicates,
    loadingLogs,
    executeCleanup,
    isExecutingCleanup,
  } = useDuplicateCleanup();

  const [showImportWizard, setShowImportWizard] = useState(false);

  const totalDuplicates = duplicates?.reduce((sum, dup) => sum + dup.duplicate_count - 1, 0) || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Sistema de Limpieza de Duplicados</h2>
        <p className="text-gray-600 mt-1">
          Gestión automática de servicios con IDs duplicados en la base de datos
        </p>
      </div>

      {/* Estado actual */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Servicios Duplicados</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {checkingDuplicates ? "..." : totalDuplicates}
            </div>
            <p className="text-xs text-gray-600">
              registros duplicados detectados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">IDs Únicos Afectados</CardTitle>
            <Shield className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {checkingDuplicates ? "..." : duplicates?.length || 0}
            </div>
            <p className="text-xs text-gray-600">
              IDs de servicio con duplicados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Última Limpieza</CardTitle>
            <Clock className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold">
              {loadingLogs ? "Cargando..." : 
                maintenanceLogs?.[0]?.executed_at ? 
                formatDistanceToNow(new Date(maintenanceLogs[0].executed_at), { 
                  addSuffix: true, 
                  locale: es 
                }) : "No disponible"
              }
            </div>
            <p className="text-xs text-gray-600">
              limpieza automática programada
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Importador de Servicios */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Importación y Actualización de Servicios
          </CardTitle>
          <CardDescription>
            Sistema de carga masiva con capacidad de upsert para la tabla servicios_custodia
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Cargar archivo CSV/Excel para actualizar registros de servicios de custodia
              </p>
            </div>
            <Button 
              onClick={() => setShowImportWizard(true)}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Importar Servicios
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Controles de limpieza */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Limpieza Manual
          </CardTitle>
          <CardDescription>
            Ejecuta una limpieza inmediata de servicios duplicados. Esta operación mantiene el registro más reciente de cada ID duplicado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                {totalDuplicates > 0 
                  ? `${totalDuplicates} registros duplicados listos para limpieza`
                  : "No se detectaron duplicados en este momento"
                }
              </p>
            </div>
            <Button
              onClick={() => executeCleanup()}
              disabled={isExecutingCleanup || totalDuplicates === 0}
              className="gap-2"
            >
              <Play className="h-4 w-4" />
              {isExecutingCleanup ? "Ejecutando..." : "Ejecutar Limpieza"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de duplicados detectados */}
      {duplicates && duplicates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Duplicados Detectados</CardTitle>
            <CardDescription>
              Lista de IDs de servicio que tienen registros duplicados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {duplicates.map((duplicate) => (
                <div key={duplicate.id_servicio} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{duplicate.id_servicio}</div>
                    <div className="text-sm text-gray-600">
                      Última fecha: {duplicate.latest_date ? 
                        new Date(duplicate.latest_date).toLocaleDateString('es', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : "No disponible"
                      }
                    </div>
                  </div>
                  <Badge variant="destructive">
                    {duplicate.duplicate_count} registros
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Historial de operaciones */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Mantenimiento</CardTitle>
          <CardDescription>
            Registro de todas las operaciones de limpieza ejecutadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingLogs ? (
            <div className="text-center py-4">Cargando historial...</div>
          ) : maintenanceLogs && maintenanceLogs.length > 0 ? (
            <div className="space-y-3">
              {maintenanceLogs.slice(0, 10).map((log) => (
                <div key={log.id} className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="mt-1">
                    {log.operation_type.includes('error') ? (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    ) : (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="font-medium capitalize">
                        {log.operation_type.replace(/_/g, ' ')}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDistanceToNow(new Date(log.executed_at), { 
                          addSuffix: true, 
                          locale: es 
                        })}
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {log.operation_details}
                    </div>
                    {log.records_affected > 0 && (
                      <Badge variant="secondary" className="mt-2">
                        {log.records_affected} registros afectados
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              No hay registros de mantenimiento disponibles
            </div>
          )}
        </CardContent>
      </Card>

      {/* Información del sistema */}
      <Card>
        <CardHeader>
          <CardTitle>Configuración del Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Limpieza Automática:</span>
              <Badge variant="secondary">Diaria a las 3:00 AM UTC</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Criterio de Conservación:</span>
              <span>Registro más reciente por fecha</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Índice Único:</span>
              <Badge variant="secondary">Activo</Badge>
            </div>
            <Separator />
            <div className="text-xs text-gray-500">
              El sistema mantiene automáticamente la integridad de los datos eliminando duplicados 
              y preservando el registro más reciente basado en fecha_hora_cita y created_at.
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Import Wizard */}
      <ImportWizardEnhanced
        open={showImportWizard}
        onOpenChange={setShowImportWizard}
        onComplete={() => {
          // Optionally refresh data or show success message
          setShowImportWizard(false);
        }}
      />
    </div>
  );
};

export default DuplicateCleanupManager;
