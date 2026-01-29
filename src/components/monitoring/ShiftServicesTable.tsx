import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  CheckCircle, Clock, User, AlertCircle, 
  Search, MapPin, ChevronRight, X 
} from "lucide-react";
import { ServicioTurno, COLORES_ESTADO, EstadoVisual } from "@/hooks/useServiciosTurno";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ShiftServicesTableProps {
  servicios: ServicioTurno[];
  onServiceClick?: (servicio: ServicioTurno) => void;
  selectedServiceId?: string | null;
  filterEstado?: EstadoVisual | null;
  onFilterChange?: (estado: EstadoVisual | null) => void;
}

const iconMap = {
  en_sitio: CheckCircle,
  proximo: Clock,
  asignado: User,
  sin_asignar: AlertCircle
};

const ShiftServicesTable = ({ 
  servicios, 
  onServiceClick,
  selectedServiceId,
  filterEstado,
  onFilterChange
}: ShiftServicesTableProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter and search services
  const filteredServicios = useMemo(() => {
    return servicios.filter(s => {
      // Estado filter
      if (filterEstado && s.estadoVisual !== filterEstado) return false;
      
      // Search filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchCliente = s.nombre_cliente?.toLowerCase().includes(term);
        const matchOrigen = s.origen?.toLowerCase().includes(term);
        const matchDestino = s.destino?.toLowerCase().includes(term);
        const matchCustodio = s.custodio_asignado?.toLowerCase().includes(term);
        return matchCliente || matchOrigen || matchDestino || matchCustodio;
      }
      
      return true;
    });
  }, [servicios, filterEstado, searchTerm]);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Custodios en Ruta</CardTitle>
          <Badge variant="secondary">
            {filteredServicios.length} de {servicios.length}
          </Badge>
        </div>
        
        {/* Search and filters */}
        <div className="flex gap-2 mt-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar cliente, origen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-9"
            />
          </div>
          {(filterEstado || searchTerm) && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                setSearchTerm('');
                onFilterChange?.(null);
              }}
              className="h-9 px-2"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {/* Quick filters */}
        <div className="flex gap-1 mt-2 flex-wrap">
          {Object.entries(COLORES_ESTADO).map(([key, config]) => {
            const estado = key as EstadoVisual;
            const count = servicios.filter(s => s.estadoVisual === estado).length;
            const isActive = filterEstado === estado;
            
            return (
              <Button
                key={key}
                variant={isActive ? "default" : "outline"}
                size="sm"
                className="h-7 text-xs gap-1"
                style={isActive ? { 
                  backgroundColor: config.primary,
                  borderColor: config.primary 
                } : undefined}
                onClick={() => onFilterChange?.(isActive ? null : estado)}
              >
                <span 
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: isActive ? 'white' : config.primary }}
                />
                {count}
              </Button>
            );
          })}
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full">
          <div className="space-y-1 p-4 pt-0">
            {filteredServicios.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No hay servicios que coincidan</p>
              </div>
            ) : (
              filteredServicios.map(servicio => {
                const config = COLORES_ESTADO[servicio.estadoVisual];
                const Icon = iconMap[servicio.estadoVisual];
                const isSelected = servicio.id === selectedServiceId;
                const horaCita = servicio.fecha_hora_cita 
                  ? format(new Date(servicio.fecha_hora_cita), "HH:mm", { locale: es })
                  : '--:--';
                
                return (
                  <div
                    key={servicio.id}
                    className={`
                      p-3 rounded-lg border cursor-pointer transition-all
                      hover:bg-accent/50
                      ${isSelected ? 'ring-2 ring-primary bg-accent' : ''}
                    `}
                    onClick={() => onServiceClick?.(servicio)}
                  >
                    <div className="flex items-start gap-3">
                      {/* Status icon */}
                      <div 
                        className="p-1.5 rounded-full mt-0.5 flex-shrink-0"
                        style={{ backgroundColor: config.bg }}
                      >
                        <Icon 
                          className="h-4 w-4" 
                          style={{ color: config.primary }}
                        />
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm truncate">
                            {servicio.nombre_cliente || 'Sin cliente'}
                          </span>
                          <Badge 
                            variant="outline" 
                            className="text-xs flex-shrink-0"
                            style={{ 
                              borderColor: config.border,
                              color: config.primary 
                            }}
                          >
                            {horaCita}
                          </Badge>
                        </div>
                        
                        <p className="text-xs text-muted-foreground truncate">
                          📍 {servicio.origen || 'Sin origen'}
                        </p>
                        
                        <div className="flex items-center justify-between mt-1.5">
                          {servicio.custodio_asignado ? (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {servicio.custodio_asignado}
                            </span>
                          ) : (
                            <span className="text-xs text-destructive font-medium">
                              Sin custodio
                            </span>
                          )}
                          
                          {servicio.minutosParaCita !== 0 && (
                            <span className={`text-xs ${
                              servicio.minutosParaCita < 0 
                                ? 'text-destructive' 
                                : servicio.minutosParaCita <= 60 
                                  ? 'text-amber-600' 
                                  : 'text-muted-foreground'
                            }`}>
                              {servicio.minutosParaCita > 0 
                                ? `en ${servicio.minutosParaCita} min` 
                                : `hace ${Math.abs(servicio.minutosParaCita)} min`}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Arrow */}
                      <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ShiftServicesTable;
