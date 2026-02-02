/**
 * CustodiosZonasTab - Apple Design System Refactored
 * Uses semantic tokens, CoverageRing, and apple-list pattern
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  MapPin, 
  Search, 
  AlertTriangle,
  RefreshCw,
  Users,
  Phone,
  Home,
  Plane,
  Circle
} from 'lucide-react';
import { useAuthenticatedQuery } from '@/hooks/useAuthenticatedQuery';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { CoverageRing } from '@/components/planeacion/CoverageRing';
import { ZoneStatusIndicator } from '@/components/planeacion/ZoneStatusIndicator';

interface CustodioOperativo {
  id: string;
  nombre: string;
  zona_base: string | null;
  estado: string;
  disponibilidad: string;
  telefono: string | null;
  tipo_ultimo_servicio: string | null;
  contador_locales_consecutivos: number;
  contador_foraneos_consecutivos: number;
}

// Lista de zonas/estados disponibles
const ZONAS_DISPONIBLES = [
  { value: 'Ciudad de México', label: 'CDMX' },
  { value: 'Estado de México', label: 'EDOMEX' },
  { value: 'Jalisco', label: 'Jalisco (GDL)' },
  { value: 'Nuevo León', label: 'Nuevo León (MTY)' },
  { value: 'Puebla', label: 'Puebla' },
  { value: 'Querétaro', label: 'Querétaro' },
  { value: 'Guanajuato', label: 'Guanajuato' },
  { value: 'Veracruz', label: 'Veracruz' },
  { value: 'Michoacán', label: 'Michoacán' },
  { value: 'Hidalgo', label: 'Hidalgo' },
  { value: 'Morelos', label: 'Morelos' },
  { value: 'Aguascalientes', label: 'Aguascalientes' },
  { value: 'San Luis Potosí', label: 'San Luis Potosí' },
  { value: 'Tamaulipas', label: 'Tamaulipas' },
  { value: 'Chihuahua', label: 'Chihuahua' },
  { value: 'Sonora', label: 'Sonora' },
  { value: 'Baja California', label: 'Baja California' },
  { value: 'Sinaloa', label: 'Sinaloa' },
  { value: 'Yucatán', label: 'Yucatán' },
  { value: 'Quintana Roo', label: 'Quintana Roo' },
];

export function CustodiosZonasTab() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSinZona, setFilterSinZona] = useState(false);
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  // Fetch custodios operativos
  const { data: custodios = [], isPending, refetch } = useAuthenticatedQuery(
    ['custodios-operativos-zonas'],
    async () => {
      const { data, error } = await supabase
        .from('custodios_operativos')
        .select('id, nombre, zona_base, estado, disponibilidad, telefono, tipo_ultimo_servicio, contador_locales_consecutivos, contador_foraneos_consecutivos')
        .eq('estado', 'activo')
        .order('nombre');
      
      if (error) throw error;
      return data as CustodioOperativo[];
    }
  );

  // Filtrar custodios
  const filteredCustodios = useMemo(() => {
    let result = custodios;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(c => 
        c.nombre.toLowerCase().includes(term) ||
        c.zona_base?.toLowerCase().includes(term)
      );
    }
    
    if (filterSinZona) {
      result = result.filter(c => 
        !c.zona_base || 
        c.zona_base === 'Por asignar' || 
        c.zona_base === 'Sin asignar' ||
        c.zona_base.trim() === ''
      );
    }
    
    return result;
  }, [custodios, searchTerm, filterSinZona]);

  // Contar custodios sin zona definida
  const custodiosSinZona = useMemo(() => {
    return custodios.filter(c => 
      !c.zona_base || 
      c.zona_base === 'Por asignar' || 
      c.zona_base === 'Sin asignar' ||
      c.zona_base.trim() === ''
    );
  }, [custodios]);

  // Calcular completitud
  const completitudPorcentaje = useMemo(() => {
    if (custodios.length === 0) return 0;
    return Math.round(((custodios.length - custodiosSinZona.length) / custodios.length) * 100);
  }, [custodios.length, custodiosSinZona.length]);

  // Actualizar zona de un custodio
  const handleZonaChange = async (custodioId: string, nuevaZona: string) => {
    setUpdatingIds(prev => new Set([...prev, custodioId]));
    
    try {
      const { error } = await supabase
        .from('custodios_operativos')
        .update({ zona_base: nuevaZona, updated_at: new Date().toISOString() })
        .eq('id', custodioId);
      
      if (error) throw error;
      
      toast.success('Zona actualizada correctamente');
      queryClient.invalidateQueries({ queryKey: ['custodios-operativos-zonas'] });
      queryClient.invalidateQueries({ queryKey: ['custodios-con-proximidad'] });
    } catch (err: any) {
      toast.error(`Error al actualizar: ${err.message}`);
    } finally {
      setUpdatingIds(prev => {
        const next = new Set(prev);
        next.delete(custodioId);
        return next;
      });
    }
  };

  // Estadísticas por zona
  const estadisticasZona = useMemo(() => {
    const porZona: Record<string, number> = {};
    custodios.forEach(c => {
      const zona = c.zona_base || 'Sin asignar';
      porZona[zona] = (porZona[zona] || 0) + 1;
    });
    return Object.entries(porZona)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
  }, [custodios]);

  const zonasConCustodios = new Set(custodios.filter(c => c.zona_base).map(c => c.zona_base)).size;

  // Helper to check if zona is missing
  const isMissingZona = (zona: string | null) => 
    !zona || zona === 'Por asignar' || zona === 'Sin asignar' || zona.trim() === '';

  return (
    <div className="space-y-6">
      {/* Alerta de datos faltantes - Semantic tokens */}
      {custodiosSinZona.length > 0 && (
        <Alert className="border-warning/50 bg-warning/5">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <AlertTitle className="text-warning">Datos incompletos detectados</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span className="text-muted-foreground">
              <strong className="text-foreground">{custodiosSinZona.length}</strong> custodios activos sin zona base definida. 
              Esto puede afectar la asignación de servicios.
            </span>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setFilterSinZona(true)}
              className="border-warning/50 hover:bg-warning/10"
            >
              Ver afectados
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Apple Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-4">
        {/* Total Activos */}
        <div className="apple-metric apple-metric-neutral">
          <div className="apple-metric-icon">
            <Users className="h-5 w-5" />
          </div>
          <div className="apple-metric-content">
            <div className="apple-metric-value">{custodios.length}</div>
            <div className="apple-metric-label">Total Activos</div>
          </div>
        </div>

        {/* Sin Zona */}
        <div className="apple-metric apple-metric-warning">
          <div className="apple-metric-icon">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="apple-metric-content">
            <div className="apple-metric-value">{custodiosSinZona.length}</div>
            <div className="apple-metric-label">Sin Zona</div>
          </div>
        </div>

        {/* Zonas Cubiertas */}
        <div className="apple-metric apple-metric-info">
          <div className="apple-metric-icon">
            <MapPin className="h-5 w-5" />
          </div>
          <div className="apple-metric-content">
            <div className="apple-metric-value">{zonasConCustodios}</div>
            <div className="apple-metric-label">Zonas Cubiertas</div>
          </div>
        </div>

        {/* Completitud con CoverageRing */}
        <div className="apple-metric apple-metric-success">
          <CoverageRing 
            percentage={completitudPorcentaje} 
            size={48}
            strokeWidth={5}
            showLabel={false}
          />
          <div className="apple-metric-content">
            <div className="apple-metric-value">{completitudPorcentaje}%</div>
            <div className="apple-metric-label">Completitud</div>
          </div>
        </div>
      </div>

      {/* Distribución por zona */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Distribución por Zona</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {estadisticasZona.map(([zona, count]) => (
              <ZoneStatusIndicator
                key={zona}
                status={zona === 'Sin asignar' ? 'missing' : 'assigned'}
                label={zona}
                count={count}
                size="md"
                showIcon={zona === 'Sin asignar'}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filtros y búsqueda */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gestión de Zonas Base</CardTitle>
              <CardDescription>
                Corrige la zona base de cada custodio para mejorar la asignación de servicios
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => refetch()}
              disabled={isPending}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isPending ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1 max-w-sm relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o zona..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Button
              variant={filterSinZona ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterSinZona(!filterSinZona)}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Solo sin zona ({custodiosSinZona.length})
            </Button>
            <Badge variant="outline">
              {filteredCustodios.length} custodio(s)
            </Badge>
          </div>

          {/* Apple List Pattern */}
          <div className="apple-list max-h-[500px] overflow-y-auto pr-1">
            {filteredCustodios.map((custodio) => (
              <div 
                key={custodio.id} 
                className={`
                  apple-list-item flex items-center justify-between gap-4
                  ${isMissingZona(custodio.zona_base) ? 'border-warning/30 bg-warning/5' : ''}
                `}
              >
                {/* Left: Status + Name + Phone */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Circle 
                    className={`h-3 w-3 flex-shrink-0 ${
                      isMissingZona(custodio.zona_base) 
                        ? 'fill-destructive text-destructive' 
                        : 'fill-success text-success'
                    }`} 
                  />
                  <div className="min-w-0">
                    <div className="font-medium truncate text-foreground">{custodio.nombre}</div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {custodio.telefono || '-'}
                      </span>
                      <span className="capitalize">{custodio.disponibilidad}</span>
                    </div>
                  </div>
                </div>

                {/* Center: Current Zone */}
                <div className="flex-shrink-0 w-28">
                  {isMissingZona(custodio.zona_base) ? (
                    <ZoneStatusIndicator status="missing" label="Sin asignar" />
                  ) : (
                    <Badge variant="outline" className="text-xs">
                      {custodio.zona_base}
                    </Badge>
                  )}
                </div>

                {/* Right: Zone Selector + Rotation */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <Select
                    value={custodio.zona_base || ''}
                    onValueChange={(value) => handleZonaChange(custodio.id, value)}
                    disabled={updatingIds.has(custodio.id)}
                  >
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Seleccionar zona" />
                    </SelectTrigger>
                    <SelectContent>
                      {ZONAS_DISPONIBLES.map((zona) => (
                        <SelectItem key={zona.value} value={zona.value}>
                          {zona.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Rotation Badge */}
                  <div className="w-16 text-center">
                    {custodio.tipo_ultimo_servicio ? (
                      <Badge 
                        variant={custodio.tipo_ultimo_servicio === 'local' ? 'secondary' : 'default'}
                        className="text-xs gap-1"
                      >
                        {custodio.tipo_ultimo_servicio === 'local' 
                          ? <><Home className="h-3 w-3" /> L×{custodio.contador_locales_consecutivos}</>
                          : <><Plane className="h-3 w-3" /> F×{custodio.contador_foraneos_consecutivos}</>
                        }
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {filteredCustodios.length === 0 && (
              <div className="apple-empty-state">
                <p className="text-muted-foreground">No se encontraron custodios</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default CustodiosZonasTab;
