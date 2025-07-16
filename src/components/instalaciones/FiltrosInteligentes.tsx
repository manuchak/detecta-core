import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Calendar, MapPin, User, Clock, Star, Save, X, RotateCcw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { DateRange } from 'react-day-picker';

export interface FiltrosState {
  busqueda: string;
  estados: string[];
  fechaRango: DateRange | undefined;
  prioridades: string[];
  tiposInstalacion: string[];
  instaladores: string[];
  ubicaciones: string[];
  filtroInteligente: string;
}

interface FiltroGuardado {
  id: string;
  nombre: string;
  filtros: FiltrosState;
  fechaCreacion: Date;
  usos: number;
}

interface FiltrosInteligentesProps {
  instalaciones: any[];
  onFiltrosChange: (instalacionesFiltradas: any[]) => void;
  userRole: string;
  userId: string;
}

export const FiltrosInteligentes = ({ 
  instalaciones, 
  onFiltrosChange, 
  userRole, 
  userId 
}: FiltrosInteligentesProps) => {
  const [filtros, setFiltros] = useState<FiltrosState>({
    busqueda: '',
    estados: [],
    fechaRango: undefined,
    prioridades: [],
    tiposInstalacion: [],
    instaladores: [],
    ubicaciones: [],
    filtroInteligente: ''
  });

  const [filtrosGuardados, setFiltrosGuardados] = useLocalStorage<FiltroGuardado[]>(`filtros-instalaciones-${userId}`, []);
  const [nombreNuevoFiltro, setNombreNuevoFiltro] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [filtrosAvanzadosAbiertos, setFiltrosAvanzadosAbiertos] = useState(false);

  // Extraer opciones únicas de las instalaciones
  const opciones = useMemo(() => {
    return {
      estados: [...new Set(instalaciones.map(i => i.estado))].filter(Boolean),
      prioridades: [...new Set(instalaciones.map(i => i.prioridad))].filter(Boolean),
      tiposInstalacion: [...new Set(instalaciones.map(i => i.tipo_instalacion))].filter(Boolean),
      instaladores: [...new Set(instalaciones.map(i => i.instalador?.nombre_completo))].filter(Boolean),
      ubicaciones: [...new Set(instalaciones.map(i => {
        const ciudad = i.direccion_instalacion?.split(',').pop()?.trim();
        return ciudad;
      }))].filter(Boolean)
    };
  }, [instalaciones]);

  // Filtros inteligentes predefinidos
  const filtrosInteligentes = useMemo(() => {
    const baseFilters = [
      {
        id: 'urgente_hoy',
        nombre: 'Urgente Hoy',
        descripcion: 'Instalaciones urgentes programadas para hoy',
        filtro: (instalacion: any) => {
          const esHoy = new Date(instalacion.fecha_programada).toDateString() === new Date().toDateString();
          return esHoy && instalacion.prioridad === 'urgente';
        }
      },
      {
        id: 'pendientes_atrasadas',
        nombre: 'Pendientes Atrasadas',
        descripcion: 'Instalaciones pendientes con fecha vencida',
        filtro: (instalacion: any) => {
          const fechaInstalacion = new Date(instalacion.fecha_programada);
          const hoy = new Date();
          return fechaInstalacion < hoy && ['programada', 'confirmada'].includes(instalacion.estado);
        }
      },
      {
        id: 'proxima_semana',
        nombre: 'Próxima Semana',
        descripcion: 'Instalaciones programadas para los próximos 7 días',
        filtro: (instalacion: any) => {
          const fechaInstalacion = new Date(instalacion.fecha_programada);
          const hoy = new Date();
          const proximaSemana = new Date(hoy.getTime() + 7 * 24 * 60 * 60 * 1000);
          return fechaInstalacion >= hoy && fechaInstalacion <= proximaSemana;
        }
      },
      {
        id: 'mis_instalaciones',
        nombre: 'Mis Instalaciones',
        descripcion: 'Solo instalaciones asignadas a mí',
        filtro: (instalacion: any) => {
          return instalacion.instalador_id === userId;
        }
      }
    ];

    // Filtros específicos por rol
    if (userRole === 'coordinador_operaciones' || userRole === 'admin') {
      baseFilters.push(
        {
          id: 'sin_asignar',
          nombre: 'Sin Asignar',
          descripcion: 'Instalaciones sin instalador asignado',
          filtro: (instalacion: any) => !instalacion.instalador_id
        },
        {
          id: 'completadas_semana',
          nombre: 'Completadas Semana',
          descripcion: 'Instalaciones completadas esta semana',
          filtro: (instalacion: any) => {
            const fechaCompletado = new Date(instalacion.updated_at);
            const inicioSemana = new Date();
            inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay());
            return instalacion.estado === 'completada' && fechaCompletado >= inicioSemana;
          }
        }
      );
    }

    return baseFilters;
  }, [userRole, userId]);

  // Aplicar filtros
  const instalacionesFiltradas = useMemo(() => {
    let resultado = [...instalaciones];

    // Filtro de búsqueda general
    if (filtros.busqueda) {
      const termino = filtros.busqueda.toLowerCase();
      resultado = resultado.filter(instalacion => 
        instalacion.contacto_cliente?.toLowerCase().includes(termino) ||
        instalacion.telefono_contacto?.includes(termino) ||
        instalacion.direccion_instalacion?.toLowerCase().includes(termino) ||
        instalacion.instalador?.nombre_completo?.toLowerCase().includes(termino)
      );
    }

    // Filtros específicos
    if (filtros.estados.length > 0) {
      resultado = resultado.filter(i => filtros.estados.includes(i.estado));
    }

    if (filtros.prioridades.length > 0) {
      resultado = resultado.filter(i => filtros.prioridades.includes(i.prioridad));
    }

    if (filtros.tiposInstalacion.length > 0) {
      resultado = resultado.filter(i => filtros.tiposInstalacion.includes(i.tipo_instalacion));
    }

    if (filtros.instaladores.length > 0) {
      resultado = resultado.filter(i => filtros.instaladores.includes(i.instalador?.nombre_completo));
    }

    if (filtros.ubicaciones.length > 0) {
      resultado = resultado.filter(i => {
        const ciudad = i.direccion_instalacion?.split(',').pop()?.trim();
        return filtros.ubicaciones.includes(ciudad);
      });
    }

    // Filtro de rango de fechas
    if (filtros.fechaRango?.from) {
      resultado = resultado.filter(i => {
        const fechaInstalacion = new Date(i.fecha_programada);
        const desde = filtros.fechaRango!.from!;
        const hasta = filtros.fechaRango!.to || desde;
        return fechaInstalacion >= desde && fechaInstalacion <= hasta;
      });
    }

    // Filtro inteligente
    if (filtros.filtroInteligente) {
      const filtroInteligente = filtrosInteligentes.find(f => f.id === filtros.filtroInteligente);
      if (filtroInteligente) {
        resultado = resultado.filter(filtroInteligente.filtro);
      }
    }

    return resultado;
  }, [instalaciones, filtros, filtrosInteligentes]);

  // Notificar cambios
  useEffect(() => {
    onFiltrosChange(instalacionesFiltradas);
  }, [instalacionesFiltradas, onFiltrosChange]);

  // Función para actualizar filtros
  const actualizarFiltro = (campo: keyof FiltrosState, valor: any) => {
    setFiltros(prev => ({ ...prev, [campo]: valor }));
  };

  // Función para toggle de filtros múltiples
  const toggleFiltroMultiple = (campo: keyof FiltrosState, valor: string) => {
    const valores = filtros[campo] as string[];
    const nuevosValores = valores.includes(valor)
      ? valores.filter(v => v !== valor)
      : [...valores, valor];
    actualizarFiltro(campo, nuevosValores);
  };

  // Guardar filtro
  const guardarFiltro = () => {
    if (!nombreNuevoFiltro.trim()) return;

    const nuevoFiltro: FiltroGuardado = {
      id: Date.now().toString(),
      nombre: nombreNuevoFiltro,
      filtros: { ...filtros },
      fechaCreacion: new Date(),
      usos: 0
    };

    setFiltrosGuardados(prev => [...prev, nuevoFiltro]);
    setNombreNuevoFiltro('');
    setShowSaveDialog(false);
  };

  // Cargar filtro guardado
  const cargarFiltro = (filtroGuardado: FiltroGuardado) => {
    setFiltros(filtroGuardado.filtros);
    // Incrementar contador de usos
    setFiltrosGuardados(prev => 
      prev.map(f => f.id === filtroGuardado.id ? { ...f, usos: f.usos + 1 } : f)
    );
  };

  // Limpiar filtros
  const limpiarFiltros = () => {
    setFiltros({
      busqueda: '',
      estados: [],
      fechaRango: undefined,
      prioridades: [],
      tiposInstalacion: [],
      instaladores: [],
      ubicaciones: [],
      filtroInteligente: ''
    });
  };

  // Contar filtros activos
  const filtrosActivos = Object.values(filtros).reduce((count, value) => {
    if (Array.isArray(value)) return count + value.length;
    if (value && value !== '') return count + 1;
    return count;
  }, 0);

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros Inteligentes
            {filtrosActivos > 0 && (
              <Badge variant="secondary" className="ml-2">
                {filtrosActivos} activos
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setFiltrosAvanzadosAbiertos(!filtrosAvanzadosAbiertos)}
            >
              <Filter className="h-4 w-4 mr-1" />
              Avanzados
            </Button>
            {filtrosActivos > 0 && (
              <Button variant="outline" size="sm" onClick={limpiarFiltros}>
                <RotateCcw className="h-4 w-4 mr-1" />
                Limpiar
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Búsqueda rápida */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente, teléfono, dirección o instalador..."
            value={filtros.busqueda}
            onChange={(e) => actualizarFiltro('busqueda', e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filtros inteligentes rápidos */}
        <div className="flex flex-wrap gap-2">
          {filtrosInteligentes.slice(0, 4).map(filtro => (
            <Button
              key={filtro.id}
              variant={filtros.filtroInteligente === filtro.id ? "default" : "outline"}
              size="sm"
              onClick={() => actualizarFiltro('filtroInteligente', 
                filtros.filtroInteligente === filtro.id ? '' : filtro.id
              )}
              className="text-xs"
            >
              <Star className="h-3 w-3 mr-1" />
              {filtro.nombre}
            </Button>
          ))}
        </div>

        {/* Filtros guardados */}
        {filtrosGuardados.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Filtros Guardados</Label>
            <div className="flex flex-wrap gap-2">
              {filtrosGuardados.map(filtro => (
                <Button
                  key={filtro.id}
                  variant="outline"
                  size="sm"
                  onClick={() => cargarFiltro(filtro)}
                  className="text-xs"
                >
                  <Save className="h-3 w-3 mr-1" />
                  {filtro.nombre} ({filtro.usos})
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Panel de filtros avanzados */}
        {filtrosAvanzadosAbiertos && (
          <div className="space-y-4 pt-4 border-t">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Estados */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Badge className="h-3 w-3" />
                  Estados
                </Label>
                <div className="space-y-1">
                  {opciones.estados.map(estado => (
                    <div key={estado} className="flex items-center space-x-2">
                      <Checkbox
                        id={`estado-${estado}`}
                        checked={filtros.estados.includes(estado)}
                        onCheckedChange={() => toggleFiltroMultiple('estados', estado)}
                      />
                      <Label htmlFor={`estado-${estado}`} className="text-sm">
                        {estado}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Prioridades */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Clock className="h-3 w-3" />
                  Prioridades
                </Label>
                <div className="space-y-1">
                  {opciones.prioridades.map(prioridad => (
                    <div key={prioridad} className="flex items-center space-x-2">
                      <Checkbox
                        id={`prioridad-${prioridad}`}
                        checked={filtros.prioridades.includes(prioridad)}
                        onCheckedChange={() => toggleFiltroMultiple('prioridades', prioridad)}
                      />
                      <Label htmlFor={`prioridad-${prioridad}`} className="text-sm">
                        {prioridad}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ubicaciones */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MapPin className="h-3 w-3" />
                  Ubicaciones
                </Label>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {opciones.ubicaciones.slice(0, 10).map(ubicacion => (
                    <div key={ubicacion} className="flex items-center space-x-2">
                      <Checkbox
                        id={`ubicacion-${ubicacion}`}
                        checked={filtros.ubicaciones.includes(ubicacion)}
                        onCheckedChange={() => toggleFiltroMultiple('ubicaciones', ubicacion)}
                      />
                      <Label htmlFor={`ubicacion-${ubicacion}`} className="text-sm">
                        {ubicacion}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Rango de fechas */}
            <div className="space-y-2">
              <Label>Rango de Fechas</Label>
              <DatePickerWithRange
                date={filtros.fechaRango}
                onDateChange={(date) => actualizarFiltro('fechaRango', date)}
              />
            </div>

            {/* Guardar filtro */}
            <div className="flex items-center gap-2">
              <Input
                placeholder="Nombre para guardar este filtro..."
                value={nombreNuevoFiltro}
                onChange={(e) => setNombreNuevoFiltro(e.target.value)}
                className="max-w-xs"
              />
              <Button 
                onClick={guardarFiltro}
                disabled={!nombreNuevoFiltro.trim()}
                size="sm"
              >
                <Save className="h-4 w-4 mr-1" />
                Guardar
              </Button>
            </div>
          </div>
        )}

        {/* Resumen de resultados */}
        <div className="text-sm text-muted-foreground">
          Mostrando {instalacionesFiltradas.length} de {instalaciones.length} instalaciones
        </div>
      </CardContent>
    </Card>
  );
};