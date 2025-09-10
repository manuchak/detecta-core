import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Upload, FileSpreadsheet, Plus, TrendingUp, Search, Filter, Eye, Edit, MapPin, DollarSign, Clock } from 'lucide-react';
import { useAuthenticatedQuery } from '@/hooks/useAuthenticatedQuery';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ColumnDef } from '@tanstack/react-table';
import { PriceMatrixImportWizard } from './PriceMatrixImportWizard';
import { RouteManagementForm } from './RouteManagementForm';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PERFORMANCE_QUERY_CONFIG } from '@/utils/performanceOptimizations';

interface MatrizPrecio {
  id: string;
  cliente_nombre: string;
  destino_texto: string;
  dias_operacion?: string;
  valor_bruto: number;
  precio_custodio: number;
  costo_operativo: number;
  margen_neto_calculado: number;
  distancia_km?: number;
  porcentaje_utilidad: number;
  fecha_vigencia: string;
  activo: boolean;
}

export const MatrizPreciosTab = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showImportWizard, setShowImportWizard] = useState(false);
  const [showRouteForm, setShowRouteForm] = useState(false);
  const [selectedRuta, setSelectedRuta] = useState<MatrizPrecio | null>(null);
  const [showRouteDetails, setShowRouteDetails] = useState(false);
  const [editingRoute, setEditingRoute] = useState<MatrizPrecio | null>(null);
  const [filterClient, setFilterClient] = useState('all');
  const [filterMargin, setFilterMargin] = useState('all');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [permissionLoading, setPermissionLoading] = useState(true);

  // Verificación directa y simple de permisos
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        console.log('🔐 Verificando permisos de planeación...');
        const { data, error } = await supabase.rpc('puede_acceder_planeacion');
        
        if (error) {
          console.error('❌ Error en RPC:', error);
          throw error;
        }
        
        console.log('✅ Permisos obtenidos:', data);
        setHasPermission(data === true);
      } catch (error) {
        console.error('❌ Error verificando permisos:', error);
        setHasPermission(false);
        toast.error('Error al verificar permisos de acceso');
      } finally {
        setPermissionLoading(false);
      }
    };

    checkPermissions();
  }, []);

  // Fetch optimizado con configuración de performance
  const { data: precios = [], isPending, error } = useAuthenticatedQuery(
    ['matriz-precios', refreshTrigger.toString()],
    async () => {
      const { data, error } = await supabase
        .from('matriz_precios_rutas')
        .select('*')
        .eq('activo', true)
        .order('fecha_vigencia', { ascending: false });
      
      if (error) throw error;
      return data as MatrizPrecio[];
    },
    PERFORMANCE_QUERY_CONFIG
  );

  const handleRouteUpdated = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
    toast.success('Datos actualizados correctamente');
  }, []);

  const filteredPrecios = React.useMemo(() => {
    return precios.filter(precio => {
      const matchesSearch = precio.cliente_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           precio.destino_texto.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesClient = filterClient === 'all' || precio.cliente_nombre === filterClient;
      const matchesMargin = filterMargin === 'all' || 
                           (filterMargin === 'high' && precio.porcentaje_utilidad > 50) ||
                           (filterMargin === 'medium' && precio.porcentaje_utilidad >= 25 && precio.porcentaje_utilidad <= 50) ||
                           (filterMargin === 'low' && precio.porcentaje_utilidad < 25);
      
      return matchesSearch && matchesClient && matchesMargin;
    });
  }, [precios, searchTerm, filterClient, filterMargin]);

  const columns: ColumnDef<MatrizPrecio>[] = React.useMemo(() => [
    {
      accessorKey: 'cliente_nombre',
      header: 'Cliente',
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue('cliente_nombre')}</div>
      ),
    },
    {
      accessorKey: 'destino_texto',
      header: 'Destino',
    },
    {
      accessorKey: 'valor_bruto',
      header: 'Valor Bruto',
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue('valor_bruto'));
        return <div className="font-medium">${amount.toLocaleString()}</div>;
      },
    },
    {
      accessorKey: 'precio_custodio',
      header: 'Precio Custodio',
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue('precio_custodio'));
        return <div>${amount.toLocaleString()}</div>;
      },
    },
    {
      accessorKey: 'margen_neto_calculado',
      header: 'Margen Neto',
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue('margen_neto_calculado'));
        return (
          <div className={`font-medium ${amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${amount.toLocaleString()}
          </div>
        );
      },
    },
    {
      accessorKey: 'porcentaje_utilidad',
      header: '% Utilidad',
      cell: ({ row }) => {
        const percentage = parseFloat(row.getValue('porcentaje_utilidad'));
        const color = percentage > 50 ? 'text-green-600' : 
                     percentage > 25 ? 'text-yellow-600' : 'text-red-600';
        return <div className={`font-medium ${color}`}>{percentage.toFixed(1)}%</div>;
      },
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => {
        const route = row.original;
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedRuta(route);
                setShowRouteDetails(true);
              }}
            >
              <Eye className="h-4 w-4" />
            </Button>
            {hasPermission && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditingRoute(route);
                  setShowRouteForm(true);
                }}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
          </div>
        );
      },
    },
  ], [hasPermission]);

  if (permissionLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  if (hasPermission === false) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="bg-destructive/10 text-destructive p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Acceso Denegado</h3>
            <p>No tienes permisos para acceder a la matriz de precios.</p>
            <p className="text-sm mt-2 text-muted-foreground">
              Contacta a tu administrador para obtener los permisos necesarios.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Rutas Configuradas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rutas Configuradas</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{precios.length}</div>
            <p className="text-xs text-muted-foreground">
              rutas activas en sistema
            </p>
          </CardContent>
        </Card>

        {/* Ruta más Cotizada */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ruta más Cotizada</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${precios.length > 0 ? Math.max(...precios.map(p => p.valor_bruto)).toLocaleString() : '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              valor más alto registrado
            </p>
          </CardContent>
        </Card>

        {/* Precio Promedio */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Precio Promedio</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${precios.length > 0 ? Math.round(precios.reduce((acc, p) => acc + p.valor_bruto, 0) / precios.length).toLocaleString() : '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              promedio de todas las rutas
            </p>
          </CardContent>
        </Card>

        {/* Destinos Únicos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Destinos Únicos</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(precios.map(p => p.destino_texto)).size}
            </div>
            <p className="text-xs text-muted-foreground">
              destinos diferentes configurados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Consultar Rutas Específicas</CardTitle>
              <CardDescription>
                Usa los filtros avanzados para encontrar rutas específicas y consultar su información detallada
              </CardDescription>
            </div>
            {hasPermission && (
              <Button 
                onClick={() => {
                  setEditingRoute(null);
                  setShowRouteForm(true);
                }}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nueva Ruta
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            {/* Filter Row */}
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-80">
                <label className="text-sm font-medium mb-2 block">Búsqueda General</label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar cliente o destino..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              <div className="min-w-48">
                <label className="text-sm font-medium mb-2 block">Cliente</label>
                <Select value={filterClient} onValueChange={setFilterClient}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los clientes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los clientes</SelectItem>
                    {Array.from(new Set(precios.map(p => p.cliente_nombre))).map(cliente => (
                      <SelectItem key={cliente} value={cliente}>{cliente}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="min-w-48">
                <label className="text-sm font-medium mb-2 block">Margen</label>
                <Select value={filterMargin} onValueChange={setFilterMargin}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los márgenes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los márgenes</SelectItem>
                    <SelectItem value="high">Alto (&gt;50%)</SelectItem>
                    <SelectItem value="medium">Medio (25-50%)</SelectItem>
                    <SelectItem value="low">Bajo (&lt;25%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Results Summary */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Mostrando {filteredPrecios.length} de {precios.length} rutas</span>
              {(searchTerm || filterClient !== 'all' || filterMargin !== 'all') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setFilterClient('all');
                    setFilterMargin('all');
                  }}
                >
                  Limpiar filtros
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Matriz de Precios Activa</CardTitle>
          <CardDescription>
            Listado completo con información detallada por cada ruta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable 
            columns={columns} 
            data={filteredPrecios}
            loading={isPending}
          />
        </CardContent>
      </Card>

      {/* Import Wizard Dialog */}
      <PriceMatrixImportWizard
        open={showImportWizard}
        onOpenChange={setShowImportWizard}
      />

      {/* Route Details Dialog */}
      <Dialog open={showRouteDetails} onOpenChange={setShowRouteDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalles de la Ruta</DialogTitle>
            <DialogDescription>
              Información completa de la ruta seleccionada
            </DialogDescription>
          </DialogHeader>
          
          {selectedRuta && (
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Cliente</label>
                  <p className="text-lg font-semibold">{selectedRuta.cliente_nombre}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Destino</label>
                  <p className="text-lg font-semibold">{selectedRuta.destino_texto}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Valor Bruto</label>
                  <p className="text-xl font-bold text-green-600">${selectedRuta.valor_bruto.toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Precio Custodio</label>
                  <p className="text-xl font-bold">${selectedRuta.precio_custodio.toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Costo Operativo</label>
                  <p className="text-xl font-bold">${selectedRuta.costo_operativo.toLocaleString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Margen Neto</label>
                  <p className={`text-xl font-bold ${selectedRuta.margen_neto_calculado > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${selectedRuta.margen_neto_calculado.toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">% Utilidad</label>
                  <p className="text-xl font-bold">{selectedRuta.porcentaje_utilidad.toFixed(1)}%</p>
                </div>
              </div>

              {selectedRuta.distancia_km && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Distancia</label>
                  <p className="text-lg">{selectedRuta.distancia_km} km</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Route Management Form */}
      <RouteManagementForm
        open={showRouteForm}
        onOpenChange={(open) => {
          setShowRouteForm(open);
          if (!open) {
            setEditingRoute(null);
          }
        }}
        editingRoute={editingRoute}
        onRouteUpdated={handleRouteUpdated}
        hasPermission={hasPermission}
      />
    </div>
  );
};