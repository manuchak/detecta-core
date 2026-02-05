import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Search, 
  Building2, 
  MapPin, 
  Edit, 
  MoreHorizontal, 
  AlertTriangle,
  CheckCircle2,
  Plus
} from 'lucide-react';
import { useClientesEnRutas, ClienteEnRutas } from '@/hooks/useClientesEnRutas';
import { QuickClienteEditModal } from './QuickClienteEditModal';
import { useAuth } from '@/contexts/AuthContext';
import { NOMBRE_COMERCIAL_EDIT_ROLES } from '@/constants/accessControl';

export function ClientesConRutasTable() {
  const { userRole } = useAuth();
  const { data: clientes = [], isLoading, refetch } = useClientesEnRutas();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<'all' | 'registrados' | 'sin_registrar'>('all');
  const [clienteParaEditar, setClienteParaEditar] = useState<ClienteEnRutas | null>(null);

  const tienePermiso = userRole && NOMBRE_COMERCIAL_EDIT_ROLES.includes(userRole as any);

  const filteredClientes = useMemo(() => {
    return clientes.filter(cliente => {
      const matchesSearch = cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (cliente.razon_social?.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesTipo = filterTipo === 'all' ||
        (filterTipo === 'registrados' && cliente.es_cliente_maestro) ||
        (filterTipo === 'sin_registrar' && !cliente.es_cliente_maestro);
      
      return matchesSearch && matchesTipo;
    });
  }, [clientes, searchTerm, filterTipo]);

  // Estadísticas
  const stats = useMemo(() => {
    const total = clientes.length;
    const registrados = clientes.filter(c => c.es_cliente_maestro).length;
    const sinRegistrar = total - registrados;
    const totalRutas = clientes.reduce((sum, c) => sum + c.rutas_count, 0);
    
    return { total, registrados, sinRegistrar, totalRutas };
  }, [clientes]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Clientes con Rutas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clientes con Rutas</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">clientes únicos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Registrados</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{stats.registrados}</div>
              <p className="text-xs text-muted-foreground">en tabla maestra</p>
            </CardContent>
          </Card>

          <Card className={stats.sinRegistrar > 0 ? 'border-warning' : ''}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sin Registrar</CardTitle>
              <AlertTriangle className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{stats.sinRegistrar}</div>
              <p className="text-xs text-muted-foreground">solo en rutas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Rutas</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRutas}</div>
              <p className="text-xs text-muted-foreground">rutas activas</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabla principal */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Gestión de Clientes</CardTitle>
                <CardDescription>
                  Administra los nombres comerciales de clientes con rutas activas
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filtros */}
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex-1 min-w-64">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nombre..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={filterTipo === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterTipo('all')}
                >
                  Todos ({stats.total})
                </Button>
                <Button
                  variant={filterTipo === 'registrados' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterTipo('registrados')}
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Registrados ({stats.registrados})
                </Button>
                <Button
                  variant={filterTipo === 'sin_registrar' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterTipo('sin_registrar')}
                  className={filterTipo === 'sin_registrar' ? 'bg-warning hover:bg-warning/90' : ''}
                >
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  Sin Registrar ({stats.sinRegistrar})
                </Button>
              </div>
            </div>

            {/* Tabla */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre Comercial</TableHead>
                    <TableHead>Razón Social</TableHead>
                    <TableHead className="text-center">Rutas</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClientes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                        No se encontraron clientes
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredClientes.map((cliente) => (
                      <TableRow key={cliente.id || cliente.nombre}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{cliente.nombre}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {cliente.razon_social || '-'}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">
                            <MapPin className="h-3 w-3 mr-1" />
                            {cliente.rutas_count}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {cliente.es_cliente_maestro ? (
                            <Badge variant="outline" className="text-success border-success/30">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Registrado
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-warning border-warning/30">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Sin Registrar
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {cliente.es_cliente_maestro && tienePermiso && (
                                <DropdownMenuItem onClick={() => setClienteParaEditar(cliente)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Editar nombre comercial
                                </DropdownMenuItem>
                              )}
                              {!cliente.es_cliente_maestro && (
                                <DropdownMenuItem disabled className="text-muted-foreground">
                                  <Plus className="h-4 w-4 mr-2" />
                                  Registrar cliente (próximamente)
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Resumen al pie */}
            <div className="mt-4 text-sm text-muted-foreground">
              Mostrando {filteredClientes.length} de {clientes.length} clientes
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal de edición */}
      <QuickClienteEditModal
        open={!!clienteParaEditar}
        onOpenChange={(open) => !open && setClienteParaEditar(null)}
        cliente={clienteParaEditar}
        onSuccess={() => refetch()}
      />
    </>
  );
}
