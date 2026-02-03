import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Upload, FileSpreadsheet, Plus, TrendingUp, Search, Filter, Eye, Edit, MapPin, DollarSign, Clock, Trash2, MoreHorizontal, Calendar } from 'lucide-react';
import { useAuthenticatedQuery } from '@/hooks/useAuthenticatedQuery';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ColumnDef } from '@tanstack/react-table';
import { PriceMatrixImportWizard } from './PriceMatrixImportWizard';
import { RouteManagementForm } from './RouteManagementForm';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PERFORMANCE_QUERY_CONFIG } from '@/utils/performanceOptimizations';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { DeleteRouteDialog } from './routes/DeleteRouteDialog';
import { PendingPriceRoute } from '@/hooks/useRoutesWithPendingPrices';

interface MatrizPrecio {
  id: string;
  cliente_nombre: string;
  origen_texto?: string;
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

type ActivityFilter = 'all' | '60' | '90' | '120' | '120+';

const ACTIVITY_FILTER_OPTIONS: { value: ActivityFilter; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: '60', label: 'Últimos 60 días' },
  { value: '90', label: 'Últimos 90 días' },
  { value: '120', label: 'Últimos 120 días' },
  { value: '120+', label: '+120 días sin uso' },
];

export const MatrizPreciosTab = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showImportWizard, setShowImportWizard] = useState(false);
  const [showRouteForm, setShowRouteForm] = useState(false);
  const [selectedRuta, setSelectedRuta] = useState<MatrizPrecio | null>(null);
  const [showRouteDetails, setShowRouteDetails] = useState(false);
  const [editingRoute, setEditingRoute] = useState<MatrizPrecio | null>(null);
  const [filterClient, setFilterClient] = useState('all');
  const [filterMargin, setFilterMargin] = useState('all');
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>('all');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [permissionLoading, setPermissionLoading] = useState(true);
  const [selectedRoutes, setSelectedRoutes] = useState<Set<string>>(new Set());
  const [routesToDelete, setRoutesToDelete] = useState<PendingPriceRoute[]>([]);

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
    setSelectedRoutes(new Set());
    toast.success('Datos actualizados correctamente');
  }, []);

  // Helper to calculate days since fecha_vigencia
  const getDaysSinceVigencia = useCallback((fecha: string | null) => {
    if (!fecha) return null;
    const vigenciaDate = new Date(fecha);
    const now = new Date();
    return Math.floor((now.getTime() - vigenciaDate.getTime()) / (1000 * 60 * 60 * 24));
  }, []);

  // Filter by activity first
  const preciosPorActividad = useMemo(() => {
    if (activityFilter === 'all') return precios;
    
    return precios.filter(precio => {
      const days = getDaysSinceVigencia(precio.fecha_vigencia);
      if (activityFilter === '120+') {
        return days === null || days > 120;
      }
      const maxDays = parseInt(activityFilter);
      return days !== null && days <= maxDays;
    });
  }, [precios, activityFilter, getDaysSinceVigencia]);

  const filteredPrecios = useMemo(() => {
    return preciosPorActividad.filter(precio => {
      const matchesSearch = precio.cliente_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           precio.destino_texto.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesClient = filterClient === 'all' || precio.cliente_nombre === filterClient;
      const matchesMargin = filterMargin === 'all' || 
                           (filterMargin === 'high' && precio.porcentaje_utilidad > 50) ||
                           (filterMargin === 'medium' && precio.porcentaje_utilidad >= 25 && precio.porcentaje_utilidad <= 50) ||
                           (filterMargin === 'low' && precio.porcentaje_utilidad < 25);
      
      return matchesSearch && matchesClient && matchesMargin;
    });
  }, [preciosPorActividad, searchTerm, filterClient, filterMargin]);

  // Selection handlers
  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedRoutes(new Set(filteredPrecios.map(r => r.id)));
    } else {
      setSelectedRoutes(new Set());
    }
  }, [filteredPrecios]);

  const handleSelectRoute = useCallback((id: string, checked: boolean) => {
    setSelectedRoutes(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  }, []);

  // Convert selected routes to PendingPriceRoute format for DeleteRouteDialog
  const convertToPendingRoute = useCallback((route: MatrizPrecio): PendingPriceRoute => {
    const dias = getDaysSinceVigencia(route.fecha_vigencia) || 0;
    return {
      id: route.id,
      cliente_nombre: route.cliente_nombre,
      origen_texto: route.origen_texto || '',
      destino_texto: route.destino_texto,
      valor_bruto: route.valor_bruto,
      precio_custodio: route.precio_custodio,
      costo_operativo: route.costo_operativo,
      margen_neto_calculado: route.margen_neto_calculado,
      porcentaje_utilidad: route.porcentaje_utilidad,
      created_at: route.fecha_vigencia,
      updated_at: route.fecha_vigencia,
      dias_sin_actualizar: dias,
      tiene_margen_negativo: route.valor_bruto < route.precio_custodio,
      es_precio_placeholder: route.valor_bruto <= 10,
    };
  }, [getDaysSinceVigencia]);

  const handleDeleteSelected = useCallback(() => {
    const selectedRoutesData = filteredPrecios
      .filter(r => selectedRoutes.has(r.id))
      .map(convertToPendingRoute);
    setRoutesToDelete(selectedRoutesData);
  }, [filteredPrecios, selectedRoutes, convertToPendingRoute]);

  const handleDeleteSingle = useCallback((route: MatrizPrecio) => {
    setRoutesToDelete([convertToPendingRoute(route)]);
  }, [convertToPendingRoute]);

  const columns: ColumnDef<MatrizPrecio>[] = useMemo(() => [
    ...(hasPermission ? [{
      id: 'select',
      header: () => (
        <Checkbox 
          checked={selectedRoutes.size > 0 && selectedRoutes.size === filteredPrecios.length}
          onCheckedChange={handleSelectAll}
          aria-label="Seleccionar todas"
        />
      ),
      cell: ({ row }: { row: { original: MatrizPrecio } }) => (
        <Checkbox 
          checked={selectedRoutes.has(row.original.id)}
          onCheckedChange={(checked) => handleSelectRoute(row.original.id, !!checked)}
          aria-label="Seleccionar ruta"
        />
      ),
    }] as ColumnDef<MatrizPrecio>[] : []),
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
          <div className={`font-medium ${amount > 0 ? 'text-success' : 'text-destructive'}`}>
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
        const color = percentage > 50 ? 'text-success' : 
                     percentage > 25 ? 'text-warning' : 'text-destructive';
        return <div className={`font-medium ${color}`}>{percentage.toFixed(1)}%</div>;
      },
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => {
        const route = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  setSelectedRuta(route);
                  setShowRouteDetails(true);
                }}
              >
                <Eye className="h-4 w-4 mr-2" />
                Ver detalles
              </DropdownMenuItem>
              {hasPermission && (
                <>
                  <DropdownMenuItem
                    onClick={() => {
                      setEditingRoute(route);
                      setShowRouteForm(true);
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar ruta
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => handleDeleteSingle(route)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar ruta
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ], [hasPermission, selectedRoutes, filteredPrecios.length, handleSelectAll, handleSelectRoute, handleDeleteSingle]);

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

              <div className="min-w-48">
                <label className="text-sm font-medium mb-2 block flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Actividad
                </label>
                <Select value={activityFilter} onValueChange={(v) => setActivityFilter(v as ActivityFilter)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas las rutas" />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTIVITY_FILTER_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Results Summary and Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Mostrando {filteredPrecios.length} de {preciosPorActividad.length} rutas</span>
                {activityFilter !== 'all' && (
                  <Badge variant="secondary" className="text-xs">
                    {ACTIVITY_FILTER_OPTIONS.find(o => o.value === activityFilter)?.label}
                  </Badge>
                )}
                {(searchTerm || filterClient !== 'all' || filterMargin !== 'all' || activityFilter !== 'all') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchTerm('');
                      setFilterClient('all');
                      setFilterMargin('all');
                      setActivityFilter('all');
                      setSelectedRoutes(new Set());
                    }}
                  >
                    Limpiar filtros
                  </Button>
                )}
              </div>

              {hasPermission && selectedRoutes.size > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeleteSelected}
                  className="gap-2 text-destructive hover:text-destructive border-destructive/30 hover:border-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                  Eliminar ({selectedRoutes.size})
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

      {/* Delete Route Dialog */}
      <DeleteRouteDialog
        open={routesToDelete.length > 0}
        onOpenChange={(open) => {
          if (!open) setRoutesToDelete([]);
        }}
        routes={routesToDelete}
        onSuccess={() => {
          setSelectedRoutes(new Set());
          handleRouteUpdated();
        }}
      />
    </div>
  );
};