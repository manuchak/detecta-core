import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Upload, FileSpreadsheet, Calculator, TrendingUp, Search, Filter } from 'lucide-react';
import { useAuthenticatedQuery } from '@/hooks/useAuthenticatedQuery';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ColumnDef } from '@tanstack/react-table';
import { PriceMatrixImportWizard } from './PriceMatrixImportWizard';
import { PriceCalculator } from './PriceCalculator';

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
  const [showCalculator, setShowCalculator] = useState(false);

  // Fetch price matrix data
  const { data: precios = [], isPending, error } = useAuthenticatedQuery(
    ['matriz-precios'],
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

  const filteredPrecios = precios.filter(precio =>
    precio.cliente_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    precio.destino_texto.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <Dialog open={showCalculator} onOpenChange={setShowCalculator}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Calculator className="h-4 w-4" />
                Calculadora
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Calculadora de Precios</DialogTitle>
                <DialogDescription>
                  Calcula precios estimados basados en la matriz existente
                </DialogDescription>
              </DialogHeader>
              <PriceCalculator />
            </DialogContent>
          </Dialog>

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

      {/* Enhanced Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Rutas con más detalle */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Portfolio de Rutas</CardTitle>
            <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{precios.length}</div>
            <div className="flex items-center justify-between mt-2">
              <div className="text-xs text-muted-foreground">
                {new Set(precios.map(p => p.cliente_nombre)).size} clientes activos
              </div>
              <Badge variant="secondary" className="text-xs">
                {precios.length > 0 ? 
                  (precios.reduce((acc, p) => acc + (p.distancia_km || 0), 0) / precios.length).toFixed(0) 
                  : '0'
                } km prom
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Rentabilidad General */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rentabilidad Global</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {precios.length > 0 ? 
                (precios.reduce((acc, p) => acc + p.porcentaje_utilidad, 0) / precios.length).toFixed(1) 
                : '0'
              }%
            </div>
            <div className="flex items-center justify-between mt-2">
              <div className="text-xs text-success">
                Máx: {precios.length > 0 ? Math.max(...precios.map(p => p.porcentaje_utilidad)).toFixed(1) : '0'}%
              </div>
              <div className="text-xs text-destructive">
                Mín: {precios.length > 0 ? Math.min(...precios.map(p => p.porcentaje_utilidad)).toFixed(1) : '0'}%
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Análisis de Ingresos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Potenciales</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              ${precios.length > 0 ? 
                Math.round(precios.reduce((acc, p) => acc + p.valor_bruto, 0) / 1000) + 'K' 
                : '0'
              }
            </div>
            <div className="flex items-center justify-between mt-2">
              <div className="text-xs text-muted-foreground">
                ${precios.length > 0 ? Math.round(precios.reduce((acc, p) => acc + p.valor_bruto, 0) / precios.length).toLocaleString() : '0'} promedio
              </div>
              <Badge variant={precios.filter(p => p.valor_bruto > 50000).length > precios.length * 0.3 ? 'default' : 'secondary'} className="text-xs">
                {precios.filter(p => p.valor_bruto > 50000).length} premium
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Alertas Operativas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas de Gestión</CardTitle>
            <Filter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Bajo margen (&lt;15%)</span>
                <Badge variant="destructive" className="text-xs">
                  {precios.filter(p => p.porcentaje_utilidad < 15).length}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Alto costo (&gt;80%)</span>
                <Badge variant="secondary" className="text-xs">
                  {precios.filter(p => (p.precio_custodio + p.costo_operativo) / p.valor_bruto > 0.8).length}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Larga distancia (&gt;500km)</span>
                <Badge variant="outline" className="text-xs">
                  {precios.filter(p => (p.distancia_km || 0) > 500).length}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Clients & Efficiency Analysis */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top 5 Clientes por Volumen</CardTitle>
            <CardDescription>Clientes con mayor número de rutas configuradas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(
                precios.reduce((acc, precio) => {
                  acc[precio.cliente_nombre] = (acc[precio.cliente_nombre] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>)
              )
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([cliente, rutas], index) => {
                  const clientePrecios = precios.filter(p => p.cliente_nombre === cliente);
                  const avgMargin = clientePrecios.reduce((acc, p) => acc + p.porcentaje_utilidad, 0) / clientePrecios.length;
                  return (
                    <div key={cliente} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{cliente}</p>
                          <p className="text-xs text-muted-foreground">{rutas} rutas • {avgMargin.toFixed(1)}% margen prom.</p>
                        </div>
                      </div>
                      <Badge variant={avgMargin >= 20 ? 'default' : avgMargin >= 15 ? 'secondary' : 'destructive'}>
                        ${Math.round(clientePrecios.reduce((acc, p) => acc + p.valor_bruto, 0) / 1000)}K
                      </Badge>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Análisis de Eficiencia</CardTitle>
            <CardDescription>Métricas clave de desempeño operativo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 rounded-lg bg-success/10">
                  <div className="text-lg font-bold text-success">
                    {precios.filter(p => p.porcentaje_utilidad >= 25).length}
                  </div>
                  <div className="text-xs text-muted-foreground">Rutas Premium (&gt;25%)</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-warning/10">
                  <div className="text-lg font-bold text-warning">
                    {precios.filter(p => p.porcentaje_utilidad >= 15 && p.porcentaje_utilidad < 25).length}
                  </div>
                  <div className="text-xs text-muted-foreground">Rutas Estándar (15-25%)</div>
                </div>
              </div>
              
              <div className="pt-2 border-t">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Eficiencia por KM</span>
                  <span className="text-sm text-muted-foreground">
                    ${precios.length > 0 && precios.some(p => p.distancia_km) ? 
                      Math.round(precios.filter(p => p.distancia_km).reduce((acc, p) => acc + (p.valor_bruto / (p.distancia_km || 1)), 0) / precios.filter(p => p.distancia_km).length)
                      : '0'
                    } / km
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Costo Operativo Promedio</span>
                  <span className="text-sm text-muted-foreground">
                    {precios.length > 0 ? 
                      ((precios.reduce((acc, p) => acc + p.costo_operativo, 0) / precios.reduce((acc, p) => acc + p.valor_bruto, 0)) * 100).toFixed(1)
                      : '0'
                    }% del ingreso
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Matriz de Precios Activa</CardTitle>
              <CardDescription>
                Consulta y administra los precios por ruta configurados
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar cliente o destino..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-80"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={filteredPrecios}
            loading={isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
};