/**
 * SancionesConfigTab - Configuration tab for sanctions system
 */

import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Shield, 
  Plus, 
  Search, 
  Filter,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  Settings
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  useSancionesAplicadas, 
  useCatalogoSanciones,
  useActualizarSancion,
  type SancionAplicada 
} from '@/hooks/useSanciones';
import { CatalogoSancionesDialog } from '@/components/operatives/CatalogoSancionesDialog';

const estadoBadgeConfig: Record<string, { icon: typeof CheckCircle; color: string; label: string }> = {
  activa: { icon: AlertTriangle, color: 'bg-destructive/10 text-destructive', label: 'Activa' },
  cumplida: { icon: CheckCircle, color: 'bg-success/10 text-success', label: 'Cumplida' },
  apelada: { icon: Clock, color: 'bg-warning/10 text-warning', label: 'Apelada' },
  revocada: { icon: XCircle, color: 'bg-muted text-muted-foreground', label: 'Revocada' },
};

const categoriaBadgeColors: Record<string, string> = {
  leve: 'bg-blue-500/10 text-blue-600',
  moderada: 'bg-warning/10 text-warning',
  grave: 'bg-orange-500/10 text-orange-600',
  muy_grave: 'bg-destructive/10 text-destructive',
};

export function SancionesConfigTab() {
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<string>('all');
  const [catalogoOpen, setCatalogoOpen] = useState(false);
  
  const { data: sanciones, isLoading } = useSancionesAplicadas({
    estado: estadoFilter !== 'all' ? estadoFilter as any : undefined,
  });
  const { data: catalogo } = useCatalogoSanciones();
  const { mutate: actualizarSancion } = useActualizarSancion();

  // Filter sanciones by search term
  const filteredSanciones = sanciones?.filter(s => {
    if (!searchTerm) return true;
    const sancionNombre = s.sancion?.nombre?.toLowerCase() || '';
    return sancionNombre.includes(searchTerm.toLowerCase());
  }) || [];

  // Stats
  const totalActivas = sanciones?.filter(s => s.estado === 'activa').length || 0;
  const totalMesActual = sanciones?.filter(s => {
    const fecha = new Date(s.created_at);
    const now = new Date();
    return fecha.getMonth() === now.getMonth() && fecha.getFullYear() === now.getFullYear();
  }).length || 0;

  const handleCambiarEstado = (sancionId: string, nuevoEstado: 'cumplida' | 'apelada' | 'revocada') => {
    actualizarSancion({ sancionId, nuevoEstado });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Sistema de Sanciones
              </CardTitle>
              <CardDescription>
                Gestión de sanciones aplicadas a custodios y armados
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setCatalogoOpen(true)}>
                <Settings className="h-4 w-4 mr-2" />
                Configurar Catálogo
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-destructive/10 rounded-lg">
              <p className="text-2xl font-bold text-destructive">{totalActivas}</p>
              <p className="text-sm text-muted-foreground">Sanciones Activas</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold">{totalMesActual}</p>
              <p className="text-sm text-muted-foreground">Este Mes</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold">{sanciones?.length || 0}</p>
              <p className="text-sm text-muted-foreground">Total Histórico</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold">{catalogo?.length || 0}</p>
              <p className="text-sm text-muted-foreground">Tipos en Catálogo</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por tipo de sanción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={estadoFilter} onValueChange={setEstadoFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="activa">Activas</SelectItem>
                <SelectItem value="cumplida">Cumplidas</SelectItem>
                <SelectItem value="apelada">Apeladas</SelectItem>
                <SelectItem value="revocada">Revocadas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Fecha Inicio</TableHead>
                  <TableHead>Días</TableHead>
                  <TableHead>Puntos</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Cargando sanciones...
                    </TableCell>
                  </TableRow>
                ) : filteredSanciones.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No hay sanciones registradas
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSanciones.map((sancion) => {
                    const estadoConfig = estadoBadgeConfig[sancion.estado];
                    const IconEstado = estadoConfig.icon;
                    
                    return (
                      <TableRow key={sancion.id}>
                        <TableCell className="font-medium">
                          {sancion.sancion?.nombre || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {sancion.sancion?.categoria && (
                            <Badge 
                              variant="outline" 
                              className={categoriaBadgeColors[sancion.sancion.categoria]}
                            >
                              {sancion.sancion.categoria.replace('_', ' ')}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {format(new Date(sancion.fecha_inicio), "d MMM yyyy", { locale: es })}
                        </TableCell>
                        <TableCell>{sancion.dias_suspension}</TableCell>
                        <TableCell>-{sancion.puntos_perdidos}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`gap-1 ${estadoConfig.color}`}>
                            <IconEstado className="h-3 w-3" />
                            {estadoConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {sancion.estado === 'activa' && (
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCambiarEstado(sancion.id, 'cumplida')}
                              >
                                Marcar cumplida
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCambiarEstado(sancion.id, 'revocada')}
                              >
                                Revocar
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Catalog Dialog */}
      <CatalogoSancionesDialog 
        open={catalogoOpen} 
        onOpenChange={setCatalogoOpen} 
      />
    </div>
  );
}

export default SancionesConfigTab;
