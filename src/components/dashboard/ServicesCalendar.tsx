import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useUpcomingServices, UpcomingService } from "@/hooks/useUpcomingServices";
import { getLocalDateString } from "@/utils/timezoneUtils";
import { getCDMXDate } from "@/utils/cdmxTimezone";

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
}

export const ServicesCalendar = () => {
  const { services, isLoading } = useUpcomingServices(60); // Fetch 60 days ahead
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [servicesForDay, setServicesForDay] = useState<UpcomingService[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Group services by date for badge display
  // ✅ FIX: Usar getCDMXDate en lugar de split('T')[0] para evitar bug UTC off-by-one
  const servicesByDate = services.reduce<Record<string, UpcomingService[]>>((acc, service) => {
    if (service.fecha_hora_cita) {
      const dateKey = getCDMXDate(service.fecha_hora_cita);
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(service);
    }
    return acc;
  }, {});

  // Handle day selection
  const handleDayClick = (day: Date | undefined) => {
    if (day) {
      // Usar getLocalDateString para fechas locales (evita bugs de timezone)
      const dateKey = getLocalDateString(day);
      const matchingServices = servicesByDate[dateKey] || [];
      setSelectedDate(day);
      setServicesForDay(matchingServices);
      
      if (matchingServices.length > 0) {
        setIsDialogOpen(true);
      }
    }
  };

  // Custom renderer for calendar days
  const renderDay = (day: CalendarDay) => {
    // Usar getLocalDateString para fechas locales del calendario
    const dateKey = getLocalDateString(day.date);
    const count = servicesByDate[dateKey]?.length || 0;
    
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <span>{format(day.date, 'd')}</span>
        {count > 0 && (
          <Badge 
            className="absolute -top-1 -right-1 h-5 min-w-[20px] flex items-center justify-center" 
            variant="destructive"
          >
            {count}
          </Badge>
        )}
      </div>
    );
  };

  const getColorForStatus = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'completado':
        return 'bg-green-100 border-green-500 text-green-700';
      case 'en proceso':
        return 'bg-blue-100 border-blue-500 text-blue-700';
      case 'cancelado':
        return 'bg-red-100 border-red-500 text-red-700';
      case 'retrasado':
        return 'bg-amber-100 border-amber-500 text-amber-700';
      default:
        return 'bg-gray-100 border-gray-500 text-gray-700';
    }
  };

  return (
    <Card className="col-span-full card-apple">
      <CardHeader>
        <CardTitle className="text-lg font-medium">Calendario de Servicios</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 min-w-[280px]">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDayClick}
              locale={es}
              className="rounded border shadow-sm p-3 pointer-events-auto"
              components={{
                Day: renderDay as any,
              }}
            />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-medium mb-3">
              Servicios para {selectedDate ? format(selectedDate, 'PPP', { locale: es }) : 'Hoy'}
            </h3>
            {!isLoading && servicesForDay.length === 0 && (
              <p className="text-muted-foreground">No hay servicios programados para esta fecha.</p>
            )}
            {isLoading ? (
              <div className="flex items-center justify-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {servicesForDay.map((service) => (
                    <div 
                      key={service.id} 
                      className={`p-3 border-l-4 rounded-md ${getColorForStatus(service.estado)}`}
                    >
                      <div className="font-medium">{service.nombre_cliente}</div>
                      <div className="text-sm">
                        {service.fecha_hora_cita && format(new Date(service.fecha_hora_cita), 'HH:mm')}
                      </div>
                      <div className="text-xs flex justify-between mt-1">
                        <span>{service.id_servicio}</span>
                        <span>{service.tipo_servicio || service.local_foraneo || 'Sin tipo'}</span>
                      </div>
                      {(service.origen || service.destino) && (
                        <div className="text-xs mt-1 text-muted-foreground">
                          {service.origen && `De: ${service.origen}`}
                          {service.origen && service.destino && ' → '}
                          {service.destino && `A: ${service.destino}`}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </CardContent>

      {/* Dialog for mobile view */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Servicios para {selectedDate ? format(selectedDate, 'PPP', { locale: es }) : 'Hoy'}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4">
              {servicesForDay.map((service) => (
                <div 
                  key={service.id} 
                  className={`p-3 border-l-4 rounded-md ${getColorForStatus(service.estado)}`}
                >
                  <div className="font-medium">{service.nombre_cliente}</div>
                  <div className="text-sm">
                    {service.fecha_hora_cita && format(new Date(service.fecha_hora_cita), 'HH:mm')}
                  </div>
                  <div className="text-xs flex justify-between mt-1">
                    <span>{service.id_servicio}</span>
                    <span>{service.tipo_servicio || service.local_foraneo || 'Sin tipo'}</span>
                  </div>
                  {(service.origen || service.destino) && (
                    <div className="text-xs mt-1 text-muted-foreground">
                      {service.origen && `De: ${service.origen}`}
                      {service.origen && service.destino && ' → '}
                      {service.destino && `A: ${service.destino}`}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
