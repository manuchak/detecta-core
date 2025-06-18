
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarIcon, Clock, MapPin, User, Filter, Plus } from 'lucide-react';
import { useProgramacionInstalaciones } from '@/hooks/useProgramacionInstalaciones';
import { useInstaladores } from '@/hooks/useInstaladores';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { ProgramarInstalacionDialog } from './components/ProgramarInstalacionDialog';

const InstallationCalendar = () => {
  const { programaciones, isLoading } = useProgramacionInstalaciones();
  const { instaladoresActivos } = useInstaladores();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [filtroInstalador, setFiltroInstalador] = useState<string>('todos');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [showProgramarDialog, setShowProgramarDialog] = useState(false);

  const programacionesFiltradas = programaciones?.filter(prog => {
    if (filtroInstalador !== 'todos' && prog.instalador_id !== filtroInstalador) return false;
    if (filtroEstado !== 'todos' && prog.estado !== filtroEstado) return false;
    return true;
  }) || [];

  // Obtener instalaciones del mes seleccionado
  const instalacionesDelMes = programacionesFiltradas.filter(prog => {
    const fechaProg = parseISO(prog.fecha_programada);
    const inicioMes = startOfMonth(selectedDate);
    const finMes = endOfMonth(selectedDate);
    return fechaProg >= inicioMes && fechaProg <= finMes;
  });

  // Obtener instalaciones del día seleccionado
  const instalacionesDelDia = programacionesFiltradas.filter(prog => {
    const fechaProg = parseISO(prog.fecha_programada);
    return isSameDay(fechaProg, selectedDate);
  });

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'programada': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'confirmada': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'en_proceso': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'completada': return 'bg-green-100 text-green-800 border-green-300';
      case 'cancelada': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getPrioridadColor = (prioridad: string) => {
    switch (prioridad) {
      case 'urgente': return 'border-l-4 border-l-red-500';
      case 'alta': return 'border-l-4 border-l-orange-500';
      case 'normal': return 'border-l-4 border-l-blue-500';
      case 'baja': return 'border-l-4 border-l-gray-500';
      default: return 'border-l-4 border-l-gray-500';
    }
  };

  // Función para obtener las instalaciones de un día específico
  const getInstalacionesPorDia = (date: Date) => {
    return programacionesFiltradas.filter(prog => {
      const fechaProg = parseISO(prog.fecha_programada);
      return isSameDay(fechaProg, date);
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando calendario...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Calendario de Instalaciones</h1>
          <p className="text-gray-600 mt-1">Vista de calendario para seguimiento de instalaciones GPS</p>
        </div>
        <Button onClick={() => setShowProgramarDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Instalación
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <Filter className="h-4 w-4 text-gray-500" />
            
            <Select value={filtroInstalador} onValueChange={setFiltroInstalador}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Instalador" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los instaladores</SelectItem>
                {instaladoresActivos?.map((instalador) => (
                  <SelectItem key={instalador.id} value={instalador.id}>
                    {instalador.nombre_completo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filtroEstado} onValueChange={setFiltroEstado}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="programada">Programada</SelectItem>
                <SelectItem value="confirmada">Confirmada</SelectItem>
                <SelectItem value="en_proceso">En Proceso</SelectItem>
                <SelectItem value="completada">Completada</SelectItem>
              </SelectContent>
            </Select>

            <div className="ml-auto text-sm text-gray-600">
              {instalacionesDelMes.length} instalaciones este mes
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Calendario */}
        <Card>
          <CardHeader>
            <CardTitle>Calendario</CardTitle>
            <CardDescription>
              Selecciona una fecha para ver las instalaciones programadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              locale={es}
              className="rounded-md border"
              modifiers={{
                hasInstallations: (date) => getInstalacionesPorDia(date).length > 0
              }}
              modifiersStyles={{
                hasInstallations: {
                  backgroundColor: '#dbeafe',
                  color: '#1e40af',
                  fontWeight: 'bold'
                }
              }}
            />
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded"></div>
                <span>Días con instalaciones programadas</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instalaciones del día seleccionado */}
        <Card>
          <CardHeader>
            <CardTitle>
              Instalaciones - {format(selectedDate, 'dd MMM yyyy', { locale: es })}
            </CardTitle>
            <CardDescription>
              {instalacionesDelDia.length} instalación(es) programada(s) para este día
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {instalacionesDelDia.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No hay instalaciones programadas para este día</p>
                </div>
              ) : (
                instalacionesDelDia.map((instalacion) => (
                  <div
                    key={instalacion.id}
                    className={cn(
                      "p-4 border rounded-lg space-y-3",
                      getPrioridadColor(instalacion.prioridad)
                    )}
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="font-medium">
                          {instalacion.servicio?.numero_servicio} - {instalacion.servicio?.nombre_cliente}
                        </div>
                        <div className="text-sm text-gray-600 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(parseISO(instalacion.fecha_programada), 'HH:mm')}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge className={getEstadoColor(instalacion.estado)}>
                          {instalacion.estado}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {instalacion.prioridad}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-1">
                        <MapPin className="h-3 w-3 mt-0.5 text-gray-400" />
                        <span className="text-gray-600">{instalacion.direccion_instalacion}</span>
                      </div>
                      
                      {instalacion.instalador && (
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3 text-gray-400" />
                          <span className="text-gray-600">{instalacion.instalador.nombre_completo}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Tipo: {instalacion.tipo_instalacion}</span>
                        <span>Duración: {instalacion.tiempo_estimado}min</span>
                      </div>
                    </div>

                    {instalacion.observaciones_cliente && (
                      <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                        <strong>Observaciones:</strong> {instalacion.observaciones_cliente}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog */}
      <ProgramarInstalacionDialog
        open={showProgramarDialog}
        onOpenChange={setShowProgramarDialog}
      />
    </div>
  );
};

export default InstallationCalendar;
