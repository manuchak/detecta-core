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
import { ExcelImportWizard } from './ExcelImportWizard';
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
              <ExcelImportWizard onSuccess={() => setShowImportWizard(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rutas</CardTitle>
            <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{precios.length}</div>
            <p className="text-xs text-muted-foreground">
              rutas configuradas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Únicos</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(precios.map(p => p.cliente_nombre)).size}
            </div>
            <p className="text-xs text-muted-foreground">
              clientes con precios
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Margen Promedio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {precios.length > 0 ? 
                (precios.reduce((acc, p) => acc + p.porcentaje_utilidad, 0) / precios.length).toFixed(1) 
                : '0'
              }%
            </div>
            <p className="text-xs text-muted-foreground">
              utilidad promedio
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rutas Bajo Margen</CardTitle>
            <Filter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {precios.filter(p => p.porcentaje_utilidad < 15).length}
            </div>
            <p className="text-xs text-muted-foreground">
              menos del 15% utilidad
            </p>
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