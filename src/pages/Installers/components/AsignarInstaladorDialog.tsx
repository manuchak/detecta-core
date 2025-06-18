
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { User, Star, MapPin, Phone, CheckCircle } from 'lucide-react';
import { useInstaladores } from '@/hooks/useInstaladores';
import { useProgramacionInstalaciones } from '@/hooks/useProgramacionInstalaciones';
import type { ProgramacionInstalacion, Instalador } from '@/types/instaladores';

interface AsignarInstaladorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  programacion: ProgramacionInstalacion;
}

export const AsignarInstaladorDialog: React.FC<AsignarInstaladorDialogProps> = ({
  open,
  onOpenChange,
  programacion
}) => {
  const { instaladoresActivos, isLoadingInstaladores } = useInstaladores();
  const { asignarInstalador } = useProgramacionInstalaciones();
  const [selectedInstalador, setSelectedInstalador] = useState<string>('');
  const [isAssigning, setIsAssigning] = useState(false);

  const handleAsignar = async () => {
    if (!selectedInstalador) return;
    
    setIsAssigning(true);
    try {
      await asignarInstalador.mutateAsync({
        id: programacion.id,
        instaladorId: selectedInstalador
      });
      onOpenChange(false);
      setSelectedInstalador('');
    } catch (error) {
      console.error('Error assigning installer:', error);
    } finally {
      setIsAssigning(false);
    }
  };

  const instaladoresDisponibles = instaladoresActivos?.filter(instalador => {
    // Verificar especialidades si es necesario
    const tieneEspecialidad = instalador.especialidades.some(esp => 
      esp.toLowerCase().includes('gps') || 
      esp.toLowerCase().includes(programacion.tipo_instalacion.toLowerCase())
    );
    return tieneEspecialidad || instalador.especialidades.length === 0;
  }) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Asignar Instalador</DialogTitle>
          <DialogDescription>
            Seleccione un instalador disponible para: {programacion.servicio?.numero_servicio}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Detalles de la instalación */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium mb-2">Detalles de la Instalación</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Tipo:</strong> {programacion.tipo_instalacion}
                </div>
                <div>
                  <strong>Prioridad:</strong> {programacion.prioridad}
                </div>
                <div>
                  <strong>Fecha:</strong> {new Date(programacion.fecha_programada).toLocaleString()}
                </div>
                <div>
                  <strong>Tiempo estimado:</strong> {programacion.tiempo_estimado} min
                </div>
                <div className="col-span-2">
                  <strong>Dirección:</strong> {programacion.direccion_instalacion}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de instaladores disponibles */}
          <div className="space-y-3">
            <h3 className="font-medium">Instaladores Disponibles ({instaladoresDisponibles.length})</h3>
            
            {isLoadingInstaladores ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                <p className="mt-2 text-gray-600">Cargando instaladores...</p>
              </div>
            ) : instaladoresDisponibles.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-gray-500">
                  <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No hay instaladores disponibles</p>
                  <p className="text-sm">No se encontraron instaladores activos para este tipo de instalación</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {instaladoresDisponibles.map((instalador) => (
                  <Card
                    key={instalador.id}
                    className={`cursor-pointer transition-all ${
                      selectedInstalador === instalador.id
                        ? 'ring-2 ring-blue-500 border-blue-500'
                        : 'hover:shadow-md'
                    }`}
                    onClick={() => setSelectedInstalador(instalador.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                              <User className="h-6 w-6 text-gray-500" />
                            </div>
                          </div>
                          
                          <div className="flex-grow">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">{instalador.nombre_completo}</h4>
                              {selectedInstalador === instalador.id && (
                                <CheckCircle className="h-4 w-4 text-blue-500" />
                              )}
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {instalador.telefono}
                              </div>
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3" />
                                {instalador.calificacion_promedio.toFixed(1)}
                              </div>
                              <div>
                                {instalador.servicios_completados} servicios
                              </div>
                            </div>
                            
                            <div className="flex flex-wrap gap-1 mb-2">
                              {instalador.especialidades.map((esp, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {esp}
                                </Badge>
                              ))}
                            </div>
                            
                            {instalador.vehiculo_propio && (
                              <div className="text-xs text-green-600">
                                ✓ Vehículo propio
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <Badge 
                            className={
                              instalador.estado_afiliacion === 'activo' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }
                          >
                            {instalador.estado_afiliacion}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Acciones */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleAsignar}
              disabled={!selectedInstalador || isAssigning}
            >
              {isAssigning ? 'Asignando...' : 'Asignar Instalador'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
