
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Star, User, MapPin, Clock } from 'lucide-react';
import { useInstaladores } from '@/hooks/useInstaladores';
import { useProgramacionInstalaciones } from '@/hooks/useProgramacionInstalaciones';
import type { ProgramacionInstalacion } from '@/types/instaladores';

interface AsignarInstaladorDialogProps {
  programacion: ProgramacionInstalacion;
  children: React.ReactNode;
}

export const AsignarInstaladorDialog: React.FC<AsignarInstaladorDialogProps> = ({ 
  programacion, 
  children 
}) => {
  const [open, setOpen] = React.useState(false);
  const { instaladoresActivos, getInstalladoresDisponibles } = useInstaladores();
  const { asignarInstalador } = useProgramacionInstalaciones();
  const [instaladoresDisponibles, setInstaladoresDisponibles] = React.useState<any[]>([]);

  React.useEffect(() => {
    if (open) {
      getInstalladoresDisponibles(programacion.fecha_programada, programacion.tipo_instalacion)
        .then(setInstaladoresDisponibles)
        .catch(console.error);
    }
  }, [open, programacion.fecha_programada, programacion.tipo_instalacion]);

  const handleAsignar = (instaladorId: string) => {
    asignarInstalador.mutate({
      id: programacion.id,
      instaladorId
    }, {
      onSuccess: () => {
        setOpen(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Asignar Instalador</DialogTitle>
          <p className="text-sm text-gray-600">
            {programacion.servicio?.numero_servicio} - {programacion.tipo_instalacion}
          </p>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4" />
              <span className="font-medium">Fecha programada:</span>
              <span>{new Date(programacion.fecha_programada).toLocaleString('es-MX')}</span>
            </div>
            <div className="flex items-center gap-2 text-sm mt-1">
              <MapPin className="h-4 w-4" />
              <span className="font-medium">Ubicación:</span>
              <span>{programacion.direccion_instalacion}</span>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-medium">Instaladores Disponibles</h3>
            
            {instaladoresDisponibles.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <User className="h-12 w-12 text-gray-400 mb-2" />
                  <p className="text-gray-600 text-center">No hay instaladores disponibles</p>
                  <p className="text-gray-400 text-sm text-center mt-1">
                    Para la fecha y tipo de instalación seleccionada
                  </p>
                </CardContent>
              </Card>
            ) : (
              instaladoresDisponibles.map((instalador) => (
                <Card key={instalador.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">{instalador.nombre_completo}</h4>
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-yellow-500 fill-current" />
                            <span className="text-sm">{instalador.calificacion_promedio.toFixed(1)}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                          <span>{instalador.telefono}</span>
                          <span>{instalador.servicios_completados} servicios</span>
                        </div>

                        <div className="flex flex-wrap gap-1">
                          {instalador.especialidades.map((esp: string) => (
                            <Badge key={esp} variant="secondary" className="text-xs">
                              {esp.replace('_', ' ')}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        {instalador.disponible ? (
                          <Badge className="bg-green-100 text-green-800">
                            Disponible
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800">
                            Ocupado
                          </Badge>
                        )}
                        
                        <Button
                          size="sm"
                          onClick={() => handleAsignar(instalador.id)}
                          disabled={!instalador.disponible || asignarInstalador.isPending}
                        >
                          Asignar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
