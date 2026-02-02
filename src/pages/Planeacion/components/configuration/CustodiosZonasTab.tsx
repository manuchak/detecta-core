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
  Check,
  RefreshCw,
  Users
} from 'lucide-react';
import { useAuthenticatedQuery } from '@/hooks/useAuthenticatedQuery';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { STATE_CODES } from '@/lib/locationUtils';

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

  return (
    <div className="space-y-6">
      {/* Alerta de datos faltantes */}
      {custodiosSinZona.length > 0 && (
        <Alert variant="destructive" className="border-orange-500 bg-orange-50 dark:bg-orange-950/20">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Datos incompletos detectados</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>
              <strong>{custodiosSinZona.length}</strong> custodios activos sin zona base definida. 
              Esto puede afectar la asignación de servicios.
            </span>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setFilterSinZona(true)}
            >
              Ver afectados
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Activos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{custodios.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sin Zona</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{custodiosSinZona.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Zonas Cubiertas</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(custodios.filter(c => c.zona_base).map(c => c.zona_base)).size}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">% Completitud</CardTitle>
            <Check className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {custodios.length > 0 
                ? Math.round(((custodios.length - custodiosSinZona.length) / custodios.length) * 100)
                : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Distribución por zona */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Distribución por Zona</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {estadisticasZona.map(([zona, count]) => (
              <Badge 
                key={zona} 
                variant={zona === 'Sin asignar' ? 'destructive' : 'secondary'}
                className="text-sm"
              >
                {zona}: {count}
              </Badge>
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

          {/* Tabla de custodios */}
          <div className="border rounded-lg overflow-hidden">
            <div className="max-h-[500px] overflow-y-auto">
              <table className="w-full">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="text-left p-3 text-sm font-medium">Custodio</th>
                    <th className="text-left p-3 text-sm font-medium">Teléfono</th>
                    <th className="text-left p-3 text-sm font-medium">Zona Base Actual</th>
                    <th className="text-left p-3 text-sm font-medium">Editar Zona</th>
                    <th className="text-center p-3 text-sm font-medium">Rotación</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustodios.map((custodio) => (
                    <tr key={custodio.id} className="border-t hover:bg-muted/50">
                      <td className="p-3">
                        <div className="font-medium">{custodio.nombre}</div>
                        <div className="text-xs text-muted-foreground">
                          {custodio.disponibilidad}
                        </div>
                      </td>
                      <td className="p-3 text-sm text-muted-foreground">
                        {custodio.telefono || '-'}
                      </td>
                      <td className="p-3">
                        {!custodio.zona_base || custodio.zona_base === 'Por asignar' ? (
                          <Badge variant="destructive" className="text-xs">
                            Sin asignar
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            {custodio.zona_base}
                          </Badge>
                        )}
                      </td>
                      <td className="p-3">
                        <Select
                          value={custodio.zona_base || ''}
                          onValueChange={(value) => handleZonaChange(custodio.id, value)}
                          disabled={updatingIds.has(custodio.id)}
                        >
                          <SelectTrigger className="w-[180px]">
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
                      </td>
                      <td className="p-3 text-center">
                        {custodio.tipo_ultimo_servicio ? (
                          <div className="flex items-center justify-center gap-1">
                            <Badge 
                              variant={custodio.tipo_ultimo_servicio === 'local' ? 'secondary' : 'default'}
                              className="text-xs"
                            >
                              {custodio.tipo_ultimo_servicio === 'local' ? '🏠' : '✈️'}
                              {custodio.tipo_ultimo_servicio === 'local' 
                                ? `L×${custodio.contador_locales_consecutivos}` 
                                : `F×${custodio.contador_foraneos_consecutivos}`}
                            </Badge>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredCustodios.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-muted-foreground">
                        No se encontraron custodios
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default CustodiosZonasTab;
