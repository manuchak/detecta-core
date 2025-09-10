import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Users, 
  TrendingUp, 
  MapPin, 
  Clock, 
  Search, 
  Eye, 
  Star,
  Calendar,
  Route,
  DollarSign,
  Activity,
  Shield,
  Upload
} from 'lucide-react';
import { useAuthenticatedQuery } from '@/hooks/useAuthenticatedQuery';
import { supabase } from '@/integrations/supabase/client';
import { ColumnDef } from '@tanstack/react-table';
import { PERFORMANCE_QUERY_CONFIG } from '@/utils/performanceOptimizations';
import { CustodianServicesImportWizard } from './CustodianServicesImportWizard';

interface CustodioData {
  nombre_custodio: string;
  total_servicios: number;
  ultimo_servicio: string | null;
  estados: string;
  servicios_finalizados: number;
  servicios_activos: number;
  km_total: number;
  ingresos_total: number;
  promedio_km: number;
  tasa_finalizacion: number;
}

interface ServicioDetalle {
  origen: string;
  destino: string;
  estado: string;
  fecha_hora_cita: string;
  km_recorridos: number;
  cobro_cliente: number;
}

export const CustodiosTab = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustodio, setSelectedCustodio] = useState<CustodioData | null>(null);
  const [showCustodioDetails, setShowCustodioDetails] = useState(false);
  const [showImportWizard, setShowImportWizard] = useState(false);

  // Fetch custodios data with aggregated statistics
  const { data: custodios = [], isPending: custodiosLoading } = useAuthenticatedQuery(
    ['custodios-planeacion'],
    async () => {
      const { data, error } = await supabase
        .rpc('get_custodios_estadisticas_planeacion');
      
      if (error) throw error;
      return data as CustodioData[];
    },
    PERFORMANCE_QUERY_CONFIG
  );

  // Fetch services details for selected custodio
  const { data: serviciosDetalle = [] } = useAuthenticatedQuery(
    ['custodio-servicios', selectedCustodio?.nombre_custodio],
    async () => {
      if (!selectedCustodio) return [];
      
      const { data, error } = await supabase
        .from('servicios_custodia')
        .select('origen, destino, estado, fecha_hora_cita, km_recorridos, cobro_cliente')
        .eq('nombre_custodio', selectedCustodio.nombre_custodio)
        .order('fecha_hora_cita', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data as ServicioDetalle[];
    },
    PERFORMANCE_QUERY_CONFIG
  );

  const filteredCustodios = useMemo(() => {
    return custodios.filter(custodio =>
      custodio.nombre_custodio.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [custodios, searchTerm]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    const totalCustodios = custodios.length;
    const custodiosActivos = custodios.filter(c => c.servicios_activos > 0).length;
    const promedioServicios = totalCustodios > 0 
      ? Math.round(custodios.reduce((acc, c) => acc + c.total_servicios, 0) / totalCustodios)
      : 0;
    const mejorCustodio = custodios.reduce((max, c) => 
      c.tasa_finalizacion > (max?.tasa_finalizacion || 0) ? c : max, 
      custodios[0]
    );

    return {
      totalCustodios,
      custodiosActivos,
      promedioServicios,
      mejorCustodio: mejorCustodio?.nombre_custodio || 'N/A'
    };
  }, [custodios]);

  const columns: ColumnDef<CustodioData>[] = [
    {
      accessorKey: 'nombre_custodio',
      header: 'Custodio',
      cell: ({ row }) => (
        <div className="font-medium">
          {row.getValue('nombre_custodio')}
        </div>
      ),
    },
    {
      accessorKey: 'total_servicios',
      header: 'Total Servicios',
      cell: ({ row }) => (
        <div className="text-center font-medium">
          {row.getValue('total_servicios')}
        </div>
      ),
    },
    {
      accessorKey: 'servicios_finalizados',
      header: 'Finalizados',
      cell: ({ row }) => (
        <div className="text-center text-green-600 font-medium">
          {row.getValue('servicios_finalizados')}
        </div>
      ),
    },
    {
      accessorKey: 'servicios_activos',
      header: 'Activos',
      cell: ({ row }) => (
        <div className="text-center text-blue-600 font-medium">
          {row.getValue('servicios_activos')}
        </div>
      ),
    },
    {
      accessorKey: 'tasa_finalizacion',
      header: '% Finalización',
      cell: ({ row }) => {
        const tasa = parseFloat(row.getValue('tasa_finalizacion'));
        const color = tasa >= 90 ? 'text-green-600' : 
                     tasa >= 70 ? 'text-yellow-600' : 'text-red-600';
        return (
          <div className={`text-center font-medium ${color}`}>
            {tasa.toFixed(1)}%
          </div>
        );
      },
    },
    {
      accessorKey: 'km_total',
      header: 'KM Total',
      cell: ({ row }) => (
        <div className="text-center">
          {Math.round(row.getValue('km_total')).toLocaleString()}
        </div>
      ),
    },
    {
      accessorKey: 'ingresos_total',
      header: 'Ingresos Total',
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue('ingresos_total'));
        return (
          <div className="text-center font-medium text-green-600">
            ${amount.toLocaleString()}
          </div>
        );
      },
    },
    {
      accessorKey: 'ultimo_servicio',
      header: 'Último Servicio',
      cell: ({ row }) => {
        const fecha = row.getValue('ultimo_servicio') as string;
        if (!fecha) return <span className="text-muted-foreground">N/A</span>;
        
        return (
          <div className="text-sm">
            {new Date(fecha).toLocaleDateString('es-MX')}
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => {
        const custodio = row.original;
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedCustodio(custodio);
              setShowCustodioDetails(true);
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Gestión de Custodios</h2>
          <p className="text-muted-foreground">
            Administra tu red de custodios y su disponibilidad
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowImportWizard(true)}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Cargar Servicios CSV
          </Button>
          <Badge variant="outline" className="text-sm">
            Solo Consulta - Datos desde Servicios
          </Badge>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Custodios</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.totalCustodios}</div>
            <p className="text-xs text-muted-foreground">
              custodios registrados en sistema
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custodios Activos</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.custodiosActivos}</div>
            <p className="text-xs text-muted-foreground">
              con servicios en proceso
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Promedio Servicios</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.promedioServicios}</div>
            <p className="text-xs text-muted-foreground">
              servicios por custodio
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mejor Custodio</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xs font-bold text-green-600 truncate">
              {kpis.mejorCustodio}
            </div>
            <p className="text-xs text-muted-foreground">
              mayor tasa de finalización
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Consulta de Custodios Activos</CardTitle>
              <CardDescription>
                Información de custodios basada en servicios registrados
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="flex-1 max-w-sm">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar custodio..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <Badge variant="outline" className="text-sm">
                {filteredCustodios.length} custodio(s) encontrado(s)
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Custodios Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Custodios</CardTitle>
          <CardDescription>
            Estadísticas y rendimiento de custodios activos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable 
            columns={columns} 
            data={filteredCustodios}
            loading={custodiosLoading}
          />
        </CardContent>
      </Card>

      {/* Custodio Details Dialog */}
      <Dialog open={showCustodioDetails} onOpenChange={setShowCustodioDetails}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Detalles del Custodio: {selectedCustodio?.nombre_custodio}
            </DialogTitle>
            <DialogDescription>
              Historial completo de servicios y estadísticas detalladas
            </DialogDescription>
          </DialogHeader>
          
          {selectedCustodio && (
            <div className="space-y-6">
              {/* Estadísticas Generales */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Route className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Total Servicios</span>
                  </div>
                  <div className="text-2xl font-bold">{selectedCustodio.total_servicios}</div>
                </div>
                
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Finalizados</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    {selectedCustodio.servicios_finalizados}
                  </div>
                </div>
                
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">KM Total</span>
                  </div>
                  <div className="text-2xl font-bold">
                    {Math.round(selectedCustodio.km_total).toLocaleString()}
                  </div>
                </div>
                
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Ingresos</span>
                  </div>
                  <div className="text-lg font-bold text-green-600">
                    ${selectedCustodio.ingresos_total.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Tasa de Finalización</span>
                  </div>
                  <div className="text-3xl font-bold text-green-600">
                    {selectedCustodio.tasa_finalizacion.toFixed(1)}%
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">Promedio KM</span>
                  </div>
                  <div className="text-3xl font-bold text-blue-600">
                    {selectedCustodio.promedio_km.toFixed(0)}
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium">Servicios Activos</span>
                  </div>
                  <div className="text-3xl font-bold text-purple-600">
                    {selectedCustodio.servicios_activos}
                  </div>
                </div>
              </div>

              {/* Últimos Servicios */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Últimos 20 Servicios
                </h3>
                
                <div className="border rounded-lg">
                  <div className="max-h-96 overflow-y-auto">
                    <table className="w-full">
                      <thead className="bg-muted/50 sticky top-0">
                        <tr>
                          <th className="text-left p-3 text-sm font-medium">Fecha</th>
                          <th className="text-left p-3 text-sm font-medium">Origen</th>
                          <th className="text-left p-3 text-sm font-medium">Destino</th>
                          <th className="text-left p-3 text-sm font-medium">Estado</th>
                          <th className="text-right p-3 text-sm font-medium">KM</th>
                          <th className="text-right p-3 text-sm font-medium">Cobro</th>
                        </tr>
                      </thead>
                      <tbody>
                        {serviciosDetalle.map((servicio, index) => (
                          <tr key={index} className="border-t hover:bg-muted/50">
                            <td className="p-3 text-sm">
                              {servicio.fecha_hora_cita 
                                ? new Date(servicio.fecha_hora_cita).toLocaleDateString('es-MX', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric'
                                  })
                                : 'N/A'
                              }
                            </td>
                            <td className="p-3 text-sm max-w-48 truncate" title={servicio.origen}>
                              {servicio.origen}
                            </td>
                            <td className="p-3 text-sm max-w-48 truncate" title={servicio.destino}>
                              {servicio.destino}
                            </td>
                            <td className="p-3">
                              <Badge 
                                variant={servicio.estado === 'Finalizado' ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {servicio.estado}
                              </Badge>
                            </td>
                            <td className="p-3 text-sm text-right">
                              {servicio.km_recorridos ? Math.round(servicio.km_recorridos) : '-'}
                            </td>
                            <td className="p-3 text-sm text-right font-medium">
                              {servicio.cobro_cliente 
                                ? `$${servicio.cobro_cliente.toLocaleString()}`
                                : '-'
                              }
                            </td>
                          </tr>
                        ))}
                        {serviciosDetalle.length === 0 && (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-muted-foreground">
                              No se encontraron servicios para este custodio
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Import Wizard */}
      <CustodianServicesImportWizard
        open={showImportWizard}
        onOpenChange={setShowImportWizard}
        onComplete={() => {
          // Refetch custodios data after successful import
          window.location.reload();
        }}
      />
    </div>
  );
};

// Export default para lazy loading
export default CustodiosTab;