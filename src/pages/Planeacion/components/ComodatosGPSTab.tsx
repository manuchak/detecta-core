import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  AlertTriangle,
  MapPin,
  Clock,
  Smartphone,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { useComodatosGPS, useKPIsComodatos } from '@/hooks/useComodatosGPS';
import { ComodatosTable } from './ComodatosTable';
import { AsignarGPSDialog } from './AsignarGPSDialog';
import { DevolucionDialog } from './DevolucionDialog';
import type { FiltrosComodatos, EstadoComodato } from '@/types/comodatos';

export const ComodatosGPSTab = () => {
  const [filtros, setFiltros] = useState<FiltrosComodatos>({});
  const [busqueda, setBusqueda] = useState('');
  const [mostrarAsignarDialog, setMostrarAsignarDialog] = useState(false);
  const [mostrarDevolucionDialog, setMostrarDevolucionDialog] = useState(false);
  const [comodatoSeleccionado, setComodatoSeleccionado] = useState<string | null>(null);

  const { data: kpis, isLoading: loadingKpis } = useKPIsComodatos();
  const { comodatos, isLoading: loadingComodatos, refetch } = useComodatosGPS({
    ...filtros,
    custodio_nombre: busqueda || undefined
  });

  const handleFiltroEstado = (estados: EstadoComodato[]) => {
    setFiltros(prev => ({ ...prev, estado: estados.length > 0 ? estados : undefined }));
  };

  const handleProcesarDevolucion = (comodatoId: string) => {
    setComodatoSeleccionado(comodatoId);
    setMostrarDevolucionDialog(true);
  };

  const handleExportarDatos = () => {
    // Implementar exportación a Excel/CSV
    console.log('Exportar datos...');
  };

  const getEstadoBadgeVariant = (estado: EstadoComodato) => {
    switch (estado) {
      case 'asignado': return 'default';
      case 'en_uso': return 'secondary';
      case 'devuelto': return 'outline';
      case 'vencido': return 'destructive';
      case 'perdido': return 'destructive';
      case 'dañado': return 'destructive';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6">
      {/* KPIs Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">GPS Activos</CardTitle>
            <Smartphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingKpis ? '...' : kpis?.total_activos || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              +{kpis?.en_uso || 0} en uso actual
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Por Vencer</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {loadingKpis ? '...' : kpis?.por_vencer || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Próximos 3 días
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vencidos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {loadingKpis ? '...' : kpis?.vencidos || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Requieren atención
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disponibles WMS</CardTitle>
            <MapPin className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {loadingKpis ? '...' : kpis?.disponibles_wms || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Listos para asignar
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Controles y Filtros */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle>Control de GPS en Comodato</CardTitle>
              <p className="text-sm text-muted-foreground">
                Gestiona la asignación y devolución de GPS portátiles para custodios activos
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => setMostrarAsignarDialog(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Asignar GPS
              </Button>
              <Button variant="outline" onClick={handleExportarDatos}>
                <Download className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            {/* Barra de búsqueda */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre de custodio..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Filtro por estado */}
            <Select 
              onValueChange={(value) => {
                if (value === 'todos') {
                  handleFiltroEstado([]);
                } else {
                  handleFiltroEstado([value as EstadoComodato]);
                }
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="asignado">Asignado</SelectItem>
                <SelectItem value="en_uso">En Uso</SelectItem>
                <SelectItem value="vencido">Vencido</SelectItem>
                <SelectItem value="devuelto">Devuelto</SelectItem>
                <SelectItem value="perdido">Perdido</SelectItem>
                <SelectItem value="dañado">Dañado</SelectItem>
              </SelectContent>
            </Select>

            {/* Filtros rápidos */}
            <div className="flex gap-2">
              <Button
                variant={filtros.vencidos_proximos ? "default" : "outline"}
                size="sm"
                onClick={() => setFiltros(prev => ({ 
                  ...prev, 
                  vencidos_proximos: !prev.vencidos_proximos 
                }))}
              >
                <AlertTriangle className="h-4 w-4 mr-1" />
                Urgentes
              </Button>
            </div>
          </div>

          {/* Tabla de comodatos */}
          <ComodatosTable
            comodatos={comodatos}
            isLoading={loadingComodatos}
            onProcesarDevolucion={handleProcesarDevolucion}
          />
        </CardContent>
      </Card>

      {/* Dialogs */}
      <AsignarGPSDialog
        open={mostrarAsignarDialog}
        onOpenChange={setMostrarAsignarDialog}
      />

      <DevolucionDialog
        open={mostrarDevolucionDialog}
        onOpenChange={setMostrarDevolucionDialog}
        comodatoId={comodatoSeleccionado}
      />
    </div>
  );
};