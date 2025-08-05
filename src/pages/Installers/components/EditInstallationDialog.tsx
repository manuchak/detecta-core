import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, CalendarIcon, Clock, MapPin, User, Phone, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import type { ProgramacionInstalacion } from '@/types/instaladores';
import { useProgramacionInstalaciones } from '@/hooks/useProgramacionInstalaciones';
import { useToast } from '@/hooks/use-toast';

interface EditInstallationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  programacion: ProgramacionInstalacion;
}

export const EditInstallationDialog: React.FC<EditInstallationDialogProps> = ({
  open,
  onOpenChange,
  programacion
}) => {
  const { toast } = useToast();
  const { updateProgramacion, updateEstadoInstalacion } = useProgramacionInstalaciones();
  
  const [editForm, setEditForm] = useState({
    fecha_programada: new Date(programacion.fecha_programada),
    direccion_instalacion: programacion.direccion_instalacion,
    contacto_cliente: programacion.contacto_cliente,
    telefono_contacto: programacion.telefono_contacto,
    observaciones_cliente: programacion.observaciones_cliente || '',
    tiempo_estimado: programacion.tiempo_estimado
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedTime, setSelectedTime] = useState(
    format(new Date(programacion.fecha_programada), 'HH:mm')
  );

  const handleSave = async () => {
    try {
      // Combinar fecha y hora
      const [hours, minutes] = selectedTime.split(':');
      const fechaCompleta = new Date(editForm.fecha_programada);
      fechaCompleta.setHours(parseInt(hours), parseInt(minutes));

      await updateProgramacion.mutateAsync({
        id: programacion.id,
        fecha_programada: fechaCompleta.toISOString(),
        direccion_instalacion: editForm.direccion_instalacion,
        contacto_cliente: editForm.contacto_cliente,
        telefono_contacto: editForm.telefono_contacto,
        observaciones_cliente: editForm.observaciones_cliente,
        tiempo_estimado: editForm.tiempo_estimado
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Error updating installation:', error);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateEstadoInstalacion.mutateAsync({
        id: programacion.id,
        estado: newStatus,
        observaciones: editForm.observaciones_cliente
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Editar Instalación - {programacion.servicio?.numero_servicio || 'Sin número'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información básica */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Input
                value={editForm.contacto_cliente}
                onChange={(e) => setEditForm(prev => ({ ...prev, contacto_cliente: e.target.value }))}
                placeholder="Nombre del contacto"
              />
            </div>
            <div className="space-y-2">
              <Label>Teléfono</Label>
              <Input
                value={editForm.telefono_contacto}
                onChange={(e) => setEditForm(prev => ({ ...prev, telefono_contacto: e.target.value }))}
                placeholder="Teléfono de contacto"
              />
            </div>
          </div>

          {/* Dirección */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Dirección de instalación
            </Label>
            <Textarea
              value={editForm.direccion_instalacion}
              onChange={(e) => setEditForm(prev => ({ ...prev, direccion_instalacion: e.target.value }))}
              placeholder="Dirección completa donde se realizará la instalación"
              rows={2}
            />
          </div>

          {/* Fecha y hora */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fecha programada</Label>
              <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !editForm.fecha_programada && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {editForm.fecha_programada ? (
                      format(editForm.fecha_programada, "PPP", { locale: es })
                    ) : (
                      <span>Seleccionar fecha</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={editForm.fecha_programada}
                    onSelect={(date) => {
                      if (date) {
                        setEditForm(prev => ({ ...prev, fecha_programada: date }));
                        setShowDatePicker(false);
                      }
                    }}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Hora programada</Label>
              <Input
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
              />
            </div>
          </div>

          {/* Tiempo estimado */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Tiempo estimado (minutos)
            </Label>
            <Input
              type="number"
              value={editForm.tiempo_estimado}
              onChange={(e) => setEditForm(prev => ({ ...prev, tiempo_estimado: parseInt(e.target.value) || 120 }))}
              min="30"
              max="480"
              step="30"
            />
          </div>

          {/* Observaciones */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Observaciones del cliente
            </Label>
            <Textarea
              value={editForm.observaciones_cliente}
              onChange={(e) => setEditForm(prev => ({ ...prev, observaciones_cliente: e.target.value }))}
              placeholder="Observaciones especiales, instrucciones de acceso, etc."
              rows={3}
            />
          </div>

          {/* Estado actual y acciones */}
          <div className="border-t pt-4">
            <Label className="text-base font-semibold">Cambiar estado</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {programacion.estado === 'programada' && (
                <Button
                  variant="outline"
                  onClick={() => handleStatusChange('confirmada')}
                  className="text-blue-700 border-blue-200 hover:bg-blue-50"
                >
                  Confirmar
                </Button>
              )}
              
              {['programada', 'confirmada'].includes(programacion.estado) && (
                <Button
                  variant="outline"
                  onClick={() => handleStatusChange('en_proceso')}
                  className="text-yellow-700 border-yellow-200 hover:bg-yellow-50"
                >
                  Iniciar
                </Button>
              )}
              
              {programacion.estado === 'en_proceso' && (
                <Button
                  variant="outline"
                  onClick={() => handleStatusChange('completada')}
                  className="text-green-700 border-green-200 hover:bg-green-50"
                >
                  Completar
                </Button>
              )}
              
              {!['completada', 'cancelada'].includes(programacion.estado) && (
                <Button
                  variant="outline"
                  onClick={() => handleStatusChange('cancelada')}
                  className="text-red-700 border-red-200 hover:bg-red-50"
                >
                  Cancelar
                </Button>
              )}
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={updateProgramacion.isPending}>
              {updateProgramacion.isPending ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};