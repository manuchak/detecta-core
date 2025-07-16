import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  MapPin, 
  Search, 
  Users, 
  Navigation,
  Clock,
  RefreshCw,
  Filter
} from 'lucide-react';

interface UbicacionInstalador {
  id: string;
  instalador: {
    nombre_completo: string;
    telefono: string;
  };
  latitud: number;
  longitud: number;
  direccion: string;
  tipo_ubicacion: 'trabajo' | 'disponible' | 'descanso';
  timestamp: string;
  precision_metros: number;
}

export const UbicacionInstaladores = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');

  // Datos simulados - en producción vendría de la base de datos
  const ubicaciones: UbicacionInstalador[] = [
    {
      id: '1',
      instalador: {
        nombre_completo: 'Juan Carlos Rodríguez',
        telefono: '5512345678'
      },
      latitud: 19.4326,
      longitud: -99.1332,
      direccion: 'Av. Reforma 123, CDMX',
      tipo_ubicacion: 'trabajo',
      timestamp: '2024-01-15T14:30:00Z',
      precision_metros: 8
    },
    {
      id: '2',
      instalador: {
        nombre_completo: 'María Elena Sánchez',
        telefono: '5587654321'
      },
      latitud: 20.6597,
      longitud: -103.3496,
      direccion: 'Av. Vallarta 456, Guadalajara',
      tipo_ubicacion: 'disponible',
      timestamp: '2024-01-15T14:25:00Z',
      precision_metros: 12
    },
    {
      id: '3',
      instalador: {
        nombre_completo: 'Roberto Méndez Torres',
        telefono: '5543218765'
      },
      latitud: 25.6866,
      longitud: -100.3161,
      direccion: 'Av. Constitución 789, Monterrey',
      tipo_ubicacion: 'descanso',
      timestamp: '2024-01-15T13:45:00Z',
      precision_metros: 15
    }
  ];

  const ubicacionesFiltradas = ubicaciones.filter(ubicacion => {
    const matchesSearch = ubicacion.instalador.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ubicacion.direccion.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTipo = filtroTipo === 'todos' || ubicacion.tipo_ubicacion === filtroTipo;
    
    return matchesSearch && matchesTipo;
  });

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'trabajo': return 'bg-blue-100 text-blue-800';
      case 'disponible': return 'bg-green-100 text-green-800';
      case 'descanso': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTipoLabel = (tipo: string) => {
    const tipos = {
      trabajo: 'En Trabajo',
      disponible: 'Disponible',
      descanso: 'Descanso'
    };
    return tipos[tipo as keyof typeof tipos] || tipo;
  };

  const getTimeDifference = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ${diffMins % 60}min`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ${diffHours % 24}h`;
  };

  const estadisticas = {
    total: ubicaciones.length,
    trabajando: ubicaciones.filter(u => u.tipo_ubicacion === 'trabajo').length,
    disponibles: ubicaciones.filter(u => u.tipo_ubicacion === 'disponible').length,
    descanso: ubicaciones.filter(u => u.tipo_ubicacion === 'descanso').length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Ubicación de Instaladores</h2>
          <p className="text-muted-foreground mt-1">Seguimiento en tiempo real de ubicaciones</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Button>
            <MapPin className="h-4 w-4 mr-2" />
            Ver Mapa
          </Button>
        </div>
      </div>

      {/* Estadísticas de ubicación */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Instaladores</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estadisticas.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Trabajo</CardTitle>
            <Navigation className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{estadisticas.trabajando}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disponibles</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{estadisticas.disponibles}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Descanso</CardTitle>
            <Clock className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{estadisticas.descanso}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros y búsqueda */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por instalador o dirección..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            
            <div className="flex gap-2">
              {['todos', 'trabajo', 'disponible', 'descanso'].map((tipo) => (
                <Button
                  key={tipo}
                  variant={filtroTipo === tipo ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFiltroTipo(tipo)}
                >
                  {tipo === 'todos' ? 'Todos' : getTipoLabel(tipo)}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mapa placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Mapa de Ubicaciones</CardTitle>
          <CardDescription>Vista en tiempo real de todos los instaladores</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
            <div className="text-center">
              <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Mapa interactivo en desarrollo</p>
              <p className="text-sm text-muted-foreground">Se integrará con servicio de mapas</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de ubicaciones */}
      <Card>
        <CardHeader>
          <CardTitle>Ubicaciones Actuales</CardTitle>
          <CardDescription>
            {ubicacionesFiltradas.length} instaladores encontrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {ubicacionesFiltradas.map((ubicacion) => (
              <div key={ubicacion.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <MapPin className="h-5 w-5 text-blue-600" />
                  </div>
                  
                  <div className="space-y-1">
                    <div className="font-medium">{ubicacion.instalador.nombre_completo}</div>
                    <div className="text-sm text-muted-foreground">{ubicacion.instalador.telefono}</div>
                    <div className="text-sm text-muted-foreground">{ubicacion.direccion}</div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <Badge className={getTipoColor(ubicacion.tipo_ubicacion)}>
                      {getTipoLabel(ubicacion.tipo_ubicacion)}
                    </Badge>
                    <div className="text-xs text-muted-foreground mt-1">
                      {getTimeDifference(ubicacion.timestamp)} • ±{ubicacion.precision_metros}m
                    </div>
                  </div>
                  
                  <Button variant="outline" size="sm">
                    <Navigation className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          {ubicacionesFiltradas.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p>No se encontraron ubicaciones</p>
              <p className="text-sm">Ajusta los filtros de búsqueda</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};