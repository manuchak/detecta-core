import React, { useState } from 'react';
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

  // Fetch price matrix data
  const { data: precios = [], isPending, error } = useAuthenticatedQuery(
    ['matriz-precios', refreshTrigger.toString()],
    async () => {
      const { data, error } = await supabase
        .from('matriz_precios_rutas')
        .select('*')
        .eq('activo', true)
        .order('fecha_vigencia', { ascending: false });

      if (error) throw error;
      return data || [];
    }
  );

  const filteredPrecios = precios.filter(precio => {
    const matchesSearch = precio.cliente_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      precio.destino_texto.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesClient = filterClient === 'all' || filterClient === '' || precio.cliente_nombre === filterClient;
    
    const matchesMargin = filterMargin === 'all' || 
      (filterMargin === 'high' && precio.porcentaje_utilidad >= 25) ||
      (filterMargin === 'medium' && precio.porcentaje_utilidad >= 15 && precio.porcentaje_utilidad < 25) ||
      (filterMargin === 'low' && precio.porcentaje_utilidad < 15);
    
    return matchesSearch && matchesClient && matchesMargin;
  });

  const columns: ColumnDef<MatrizPrecio>[] = [
    {
      accessorKey: 'cliente_nombre',
      header: 'Cliente',
    },
    {
      accessorKey: 'destino_texto',
      header: 'Destino',
    },
    {
      accessorKey: 'dias_operacion',
      header: 'Días',
      cell: ({ row }) => (
        <Badge variant="secondary" className="text-xs">
          {row.getValue('dias_operacion') || 'L-V'}
        </Badge>
      ),
    },
    {
      accessorKey: 'valor_bruto',
      header: 'Precio Cliente',
      cell: ({ row }) => (
        <span className="font-mono font-medium text-primary">
          ${Number(row.getValue('valor_bruto')).toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: 'precio_custodio',
      header: 'Pago Custodio',
      cell: ({ row }) => (
        <span className="font-mono text-muted-foreground">
          ${Number(row.getValue('precio_custodio')).toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: 'costo_operativo',
      header: 'Costo Op.',
      cell: ({ row }) => (
        <span className="font-mono text-destructive">
          ${Number(row.getValue('costo_operativo')).toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: 'margen_neto_calculado',
      header: 'Margen',
      cell: ({ row }) => {
        const margen = Number(row.getValue('margen_neto_calculado'));
        return (
          <div className="flex items-center gap-2">
            <span className={`font-mono font-medium ${margen > 0 ? 'text-success' : 'text-destructive'}`}>
              ${margen.toLocaleString()}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'porcentaje_utilidad',
      header: '% Utilidad',
      cell: ({ row }) => {
        const porcentaje = Number(row.getValue('porcentaje_utilidad'));
        return (
          <Badge variant={porcentaje >= 20 ? 'default' : porcentaje >= 10 ? 'secondary' : 'destructive'}>
            {porcentaje.toFixed(1)}%
          </Badge>
        );
      },
    },
    {
      accessorKey: 'distancia_km',
      header: 'KM',
      cell: ({ row }) => {
        const km = row.getValue('distancia_km');
        return km ? <span className="text-sm text-muted-foreground">{Number(km).toFixed(0)} km</span> : '-';
      },
    },
    {
      id: 'actions',
      header: 'Consultar',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSelectedRuta(row.original);
            setShowRouteDetails(true);
          }}
          className="gap-2"
        >
          <Eye className="h-4 w-4" />
          Ver detalles
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Matriz de Precios</h2>
          <p className="text-muted-foreground">
            Gestiona los precios por ruta y cliente para el cálculo automático de cotizaciones
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={() => {
              setEditingRoute(null);
              setShowRouteForm(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Nueva Ruta
          </Button>

          <Dialog open={showImportWizard} onOpenChange={setShowImportWizard}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Upload className="h-4 w-4" />
                Importar Excel
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Importar Matriz de Precios</DialogTitle>
                <DialogDescription>
                  Sube tu archivo Excel con la matriz de precios para importar automáticamente
                </DialogDescription>
              </DialogHeader>
              <PriceMatrixImportWizard 
                open={showImportWizard}
                onOpenChange={setShowImportWizard}
                onComplete={() => {
                  setShowImportWizard(false);
                  window.location.reload();
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Simplified Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Rutas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rutas Configuradas</CardTitle>
            <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{precios.length}</div>
            <p className="text-xs text-muted-foreground">
              {new Set(precios.map(p => p.cliente_nombre)).size} clientes activos
            </p>
          </CardContent>
        </Card>

        {/* Ruta más cotizada */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ruta más Cotizada</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              ${precios.length > 0 ? Math.max(...precios.map(p => p.valor_bruto)).toLocaleString() : '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              precio más alto configurado
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
              
              <div className="min-w-60">
                <label className="text-sm font-medium mb-2 block">Cliente Específico</label>
                <Select value={filterClient} onValueChange={setFilterClient}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los clientes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los clientes</SelectItem>
                    {Array.from(new Set(precios.map(p => p.cliente_nombre))).sort().map(cliente => (
                      <SelectItem key={cliente} value={cliente}>{cliente}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="min-w-48">
                <label className="text-sm font-medium mb-2 block">Filtrar por Margen</label>
                <Select value={filterMargin} onValueChange={setFilterMargin}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los márgenes</SelectItem>
                    <SelectItem value="high">Alto (&gt;25%)</SelectItem>
                    <SelectItem value="medium">Medio (15-25%)</SelectItem>
                    <SelectItem value="low">Bajo (&lt;15%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setFilterClient('all');
                  setFilterMargin('all');
                }}
                className="gap-2"
              >
                <Filter className="h-4 w-4" />
                Limpiar filtros
              </Button>
            </div>
            
            {/* Results Summary */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground border-t pt-4">
              <span>Mostrando {filteredPrecios.length} de {precios.length} rutas</span>
              {(searchTerm || filterClient || filterMargin !== 'all') && (
                <Badge variant="secondary" className="gap-1">
                  <Filter className="h-3 w-3" />
                  Filtros activos
                </Badge>
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
            Haz clic en "Ver detalles" para consultar información completa de cada ruta
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

      {/* Route Details Modal */}
      <Dialog open={showRouteDetails} onOpenChange={setShowRouteDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Detalles de Ruta: {selectedRuta?.cliente_nombre} → {selectedRuta?.destino_texto}
            </DialogTitle>
            <DialogDescription>
              Información completa y análisis financiero de la ruta seleccionada
            </DialogDescription>
          </DialogHeader>
          
          {selectedRuta && (
            <div className="space-y-6">
              {/* Basic Route Info */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Información General
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cliente:</span>
                      <span className="font-medium">{selectedRuta.cliente_nombre}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Destino:</span>
                      <span className="font-medium">{selectedRuta.destino_texto}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Días operación:</span>
                      <Badge variant="secondary">{selectedRuta.dias_operacion || 'L-V'}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Distancia:</span>
                      <span className="font-medium">
                        {selectedRuta.distancia_km ? `${selectedRuta.distancia_km} km` : 'No especificada'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Vigencia:</span>
                      <span className="font-medium">
                        {new Date(selectedRuta.fecha_vigencia).toLocaleDateString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Análisis Financiero
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Precio al cliente:</span>
                      <span className="font-bold text-primary">
                        ${selectedRuta.valor_bruto.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pago custodio:</span>
                      <span className="font-medium">
                        ${selectedRuta.precio_custodio.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Costo operativo:</span>
                      <span className="font-medium text-destructive">
                        ${selectedRuta.costo_operativo.toLocaleString()}
                      </span>
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Margen neto:</span>
                        <span className={`font-bold ${selectedRuta.margen_neto_calculado > 0 ? 'text-success' : 'text-destructive'}`}>
                          ${selectedRuta.margen_neto_calculado.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">% Utilidad:</span>
                        <Badge variant={selectedRuta.porcentaje_utilidad >= 20 ? 'default' : selectedRuta.porcentaje_utilidad >= 10 ? 'secondary' : 'destructive'}>
                          {selectedRuta.porcentaje_utilidad.toFixed(1)}%
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Profitability Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Análisis de Rentabilidad
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="text-center p-4 rounded-lg bg-primary/10">
                      <div className="text-2xl font-bold text-primary">
                        {((selectedRuta.precio_custodio / selectedRuta.valor_bruto) * 100).toFixed(1)}%
                      </div>
                      <div className="text-sm text-muted-foreground">% Costo Custodio</div>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-destructive/10">
                      <div className="text-2xl font-bold text-destructive">
                        {((selectedRuta.costo_operativo / selectedRuta.valor_bruto) * 100).toFixed(1)}%
                      </div>
                      <div className="text-sm text-muted-foreground">% Costo Operativo</div>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-success/10">
                      <div className="text-2xl font-bold text-success">
                        {selectedRuta.distancia_km ? (selectedRuta.valor_bruto / selectedRuta.distancia_km).toFixed(0) : '-'}
                      </div>
                      <div className="text-sm text-muted-foreground">$ por KM</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle>Recomendaciones</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {selectedRuta.porcentaje_utilidad < 15 && (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
                        <span className="font-medium">⚠️ Margen bajo:</span>
                        <span>Esta ruta tiene un margen inferior al 15%. Considera revisar los costos o ajustar el precio.</span>
                      </div>
                    )}
                    {selectedRuta.porcentaje_utilidad >= 25 && (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-success/10 text-success">
                        <span className="font-medium">✅ Ruta premium:</span>
                        <span>Excelente rentabilidad. Esta ruta es altamente rentable.</span>
                      </div>
                    )}
                    {(selectedRuta.precio_custodio + selectedRuta.costo_operativo) / selectedRuta.valor_bruto > 0.8 && (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-warning/10 text-warning">
                        <span className="font-medium">⚡ Costos altos:</span>
                        <span>Los costos representan más del 80% del precio. Revisa oportunidades de optimización.</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
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
        onRouteUpdated={() => {
          setRefreshTrigger(prev => prev + 1);
          toast.success('Datos actualizados correctamente');
        }}
      />
    </div>
  );
};