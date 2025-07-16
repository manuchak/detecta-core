import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  ClipboardCheck, 
  Plus, 
  Search, 
  Filter, 
  FileText,
  Settings,
  CheckCircle,
  AlertTriangle,
  Users,
  BarChart3
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface NormaInstalacion {
  id: string;
  tipo_equipo: string;
  nombre_norma: string;
  descripcion: string;
  pasos_requeridos: any[];
  puntuacion_maxima: number;
  categoria: string;
  version: string;
  activa: boolean;
  created_at: string;
}

export const NormasInstalacion = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');

  const { data: normas, isLoading } = useQuery({
    queryKey: ['normas-instalacion'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('normas_instalacion')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as NormaInstalacion[];
    }
  });

  const normasFiltradas = normas?.filter(norma => {
    const matchesSearch = norma.nombre_norma.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         norma.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         norma.tipo_equipo.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTipo = filtroTipo === 'todos' || norma.tipo_equipo === filtroTipo;
    
    return matchesSearch && matchesTipo;
  }) || [];

  const getTipoEquipoLabel = (tipo: string) => {
    const tipos = {
      gps_vehicular: 'GPS Vehicular',
      gps_personal: 'GPS Personal',
      alarma: 'Alarma',
      camara: 'Cámara'
    };
    return tipos[tipo as keyof typeof tipos] || tipo;
  };

  const getCategoriaColor = (categoria: string) => {
    switch (categoria) {
      case 'seguridad': return 'bg-red-100 text-red-800';
      case 'calidad': return 'bg-blue-100 text-blue-800';
      case 'funcionalidad': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const estadisticas = {
    total: normas?.length || 0,
    activas: normas?.filter(n => n.activa).length || 0,
    inactivas: normas?.filter(n => !n.activa).length || 0,
    porTipo: {
      gps_vehicular: normas?.filter(n => n.tipo_equipo === 'gps_vehicular').length || 0,
      gps_personal: normas?.filter(n => n.tipo_equipo === 'gps_personal').length || 0,
      alarma: normas?.filter(n => n.tipo_equipo === 'alarma').length || 0,
      camara: normas?.filter(n => n.tipo_equipo === 'camara').length || 0
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando normas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Normas de Instalación</h2>
          <p className="text-muted-foreground mt-1">Estándares y procedimientos de calidad</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <BarChart3 className="h-4 w-4 mr-2" />
            Reportes
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Norma
          </Button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Normas</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estadisticas.total}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">{estadisticas.activas}</span> activas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">GPS Vehicular</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {estadisticas.porTipo.gps_vehicular}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">GPS Personal</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {estadisticas.porTipo.gps_personal}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cumplimiento</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">94%</div>
            <p className="text-xs text-muted-foreground">
              Promedio general
            </p>
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
                placeholder="Buscar normas por nombre, descripción o tipo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            
            <div className="flex gap-2">
              {['todos', 'gps_vehicular', 'gps_personal', 'alarma', 'camara'].map((tipo) => (
                <Button
                  key={tipo}
                  variant={filtroTipo === tipo ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFiltroTipo(tipo)}
                >
                  {tipo === 'todos' ? 'Todos' : getTipoEquipoLabel(tipo)}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de normas */}
      <Card>
        <CardHeader>
          <CardTitle>Catálogo de Normas</CardTitle>
          <CardDescription>
            {normasFiltradas.length} normas encontradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Norma</TableHead>
                <TableHead>Tipo Equipo</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Pasos</TableHead>
                <TableHead>Puntuación</TableHead>
                <TableHead>Versión</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {normasFiltradas.map((norma) => (
                <TableRow key={norma.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{norma.nombre_norma}</div>
                      <div className="text-sm text-muted-foreground line-clamp-2">
                        {norma.descripcion}
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <Badge variant="outline">
                      {getTipoEquipoLabel(norma.tipo_equipo)}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    <Badge className={getCategoriaColor(norma.categoria)}>
                      {norma.categoria}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    <span className="font-medium">{norma.pasos_requeridos?.length || 0}</span>
                  </TableCell>
                  
                  <TableCell>
                    <span className="font-medium">{norma.puntuacion_maxima} pts</span>
                  </TableCell>
                  
                  <TableCell>
                    <Badge variant="secondary">v{norma.version}</Badge>
                  </TableCell>
                  
                  <TableCell>
                    {norma.activa ? (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Activa
                      </Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-800">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Inactiva
                      </Badge>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {normasFiltradas.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <ClipboardCheck className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p>No se encontraron normas</p>
              <p className="text-sm">Ajusta los filtros o crea una nueva norma</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detalles de pasos para norma seleccionada */}
      {normasFiltradas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pasos de Instalación - {normasFiltradas[0]?.nombre_norma}</CardTitle>
            <CardDescription>
              Procedimiento detallado para {getTipoEquipoLabel(normasFiltradas[0]?.tipo_equipo)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {normasFiltradas[0]?.pasos_requeridos?.map((paso: any, index: number) => (
                <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">{paso.orden}</span>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{paso.descripcion}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={paso.obligatorio ? 'default' : 'secondary'} className="text-xs">
                        {paso.obligatorio ? 'Obligatorio' : 'Opcional'}
                      </Badge>
                      <span className="text-sm text-muted-foreground">{paso.puntos} puntos</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};