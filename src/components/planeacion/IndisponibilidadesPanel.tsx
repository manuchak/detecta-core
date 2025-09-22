import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Calendar,
  User,
  Phone,
  MapPin,
  Activity,
  MoreVertical,
  Edit,
  Play,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useCustodioIndisponibilidades } from '@/hooks/useCustodioIndisponibilidades';

const TIPO_ICONS = {
  falla_mecanica: '🔧',
  enfermedad: '🏥',
  familiar: '👨‍👩‍👧‍👦',
  personal: '👤',
  mantenimiento: '⚙️',
  capacitacion: '📚',
  otro: '📝'
};

const SEVERIDAD_COLORS = {
  baja: 'bg-green-100 text-green-800 border-green-200',
  media: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  alta: 'bg-red-100 text-red-800 border-red-200'
};

interface ResolverDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  indisponibilidad: any;
  onResolver: (id: string, notas?: string) => void;
  loading: boolean;
}

function ResolverDialog({ open, onOpenChange, indisponibilidad, onResolver, loading }: ResolverDialogProps) {
  const [notas, setNotas] = useState('');

  const handleSubmit = () => {
    onResolver(indisponibilidad?.id, notas);
    setNotas('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Resolver Indisponibilidad</DialogTitle>
          <DialogDescription>
            ¿Confirmas que se ha resuelto la indisponibilidad de{' '}
            <strong>{indisponibilidad?.custodio?.nombre}</strong>?
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4">
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span>{TIPO_ICONS[indisponibilidad?.tipo_indisponibilidad as keyof typeof TIPO_ICONS] || '📝'}</span>
              <span className="font-medium capitalize">
                {indisponibilidad?.tipo_indisponibilidad?.replace('_', ' ')}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {indisponibilidad?.motivo}
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notas-resolucion">Notas de Resolución (Opcional)</Label>
            <Textarea
              id="notas-resolucion"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Agregar información sobre cómo se resolvió la indisponibilidad..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Resolviendo...' : 'Resolver'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function IndisponibilidadesPanel() {
  const [filtroTipo, setFiltroTipo] = useState('');
  const [resolverDialog, setResolverDialog] = useState<{ open: boolean; indisponibilidad?: any }>({
    open: false
  });

  const {
    indisponibilidadesActivas,
    loading,
    resolverIndisponibilidad,
    cancelarIndisponibilidad,
    ejecutarAutoReactivacion,
    resolviendoIndisponibilidad,
    getCustodiosPorTipoIndisponibilidad
  } = useCustodioIndisponibilidades();

  const handleResolver = async (id: string, notas?: string) => {
    try {
      await resolverIndisponibilidad.mutateAsync({ id, notas });
    } catch (error) {
      console.error('Error resolviendo indisponibilidad:', error);
    }
  };

  const handleCancelar = async (id: string) => {
    try {
      await cancelarIndisponibilidad.mutateAsync({ 
        id, 
        motivo_cancelacion: 'Cancelado desde panel de administración' 
      });
    } catch (error) {
      console.error('Error cancelando indisponibilidad:', error);
    }
  };

  const filtrarIndisponibilidades = (indisponibilidades: any[]) => {
    if (!filtroTipo) return indisponibilidades;
    return indisponibilidades.filter(i => i.tipo_indisponibilidad === filtroTipo);
  };

  const indisponibilidadesFiltradas = filtrarIndisponibilidades(indisponibilidadesActivas);

  // Estadísticas rápidas
  const stats = {
    total: indisponibilidadesActivas.length,
    fallas_mecanicas: getCustodiosPorTipoIndisponibilidad('falla_mecanica').length,
    enfermedades: getCustodiosPorTipoIndisponibilidad('enfermedad').length,
    familiares: getCustodiosPorTipoIndisponibilidad('familiar').length,
    mantenimiento: getCustodiosPorTipoIndisponibilidad('mantenimiento').length
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Indisponibilidades Activas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-500" />
                Indisponibilidades Activas
              </CardTitle>
              <CardDescription>
                Gestión de custodios temporalmente indisponibles
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => ejecutarAutoReactivacion.mutate()}
                disabled={ejecutarAutoReactivacion.isPending}
              >
                <Activity className="h-4 w-4 mr-2" />
                {ejecutarAutoReactivacion.isPending ? 'Ejecutando...' : 'Auto-reactivar'}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Estadísticas rápidas */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-primary">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total Activas</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{stats.fallas_mecanicas}</div>
              <div className="text-sm text-muted-foreground">🔧 Mecánicas</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-red-600">{stats.enfermedades}</div>
              <div className="text-sm text-muted-foreground">🏥 Salud</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats.familiares}</div>
              <div className="text-sm text-muted-foreground">👨‍👩‍👧‍👦 Familiares</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{stats.mantenimiento}</div>
              <div className="text-sm text-muted-foreground">⚙️ Mantenimiento</div>
            </div>
          </div>

          {/* Filtros */}
          <div className="flex items-center gap-4 mb-4">
            <Input
              placeholder="Filtrar por tipo..."
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="max-w-xs"
            />
            <Badge variant="secondary">
              {indisponibilidadesFiltradas.length} de {indisponibilidadesActivas.length}
            </Badge>
          </div>

          {/* Lista de indisponibilidades */}
          <div className="space-y-4">
            {indisponibilidadesFiltradas.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {indisponibilidadesActivas.length === 0 
                  ? '🎉 No hay custodios indisponibles actualmente'
                  : 'No se encontraron indisponibilidades con ese filtro'
                }
              </div>
            ) : (
              indisponibilidadesFiltradas.map((indisponibilidad) => (
                <Card key={indisponibilidad.id} className="relative">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-lg">
                            {TIPO_ICONS[indisponibilidad.tipo_indisponibilidad as keyof typeof TIPO_ICONS] || '📝'}
                          </span>
                          <div>
                            <h4 className="font-semibold flex items-center gap-2">
                              {indisponibilidad.custodio?.nombre || 'Custodio desconocido'}
                              <Badge className={SEVERIDAD_COLORS[indisponibilidad.severidad as keyof typeof SEVERIDAD_COLORS]}>
                                {indisponibilidad.severidad}
                              </Badge>
                            </h4>
                            <p className="text-sm text-muted-foreground capitalize">
                              {indisponibilidad.tipo_indisponibilidad.replace('_', ' ')}
                            </p>
                          </div>
                        </div>

                        <p className="text-sm mb-3 text-gray-700">
                          {indisponibilidad.motivo}
                        </p>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Inicio: {format(new Date(indisponibilidad.fecha_inicio), 'dd/MM HH:mm', { locale: es })}
                          </div>
                          {indisponibilidad.fecha_fin_estimada && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Fin Est.: {format(new Date(indisponibilidad.fecha_fin_estimada), 'dd/MM HH:mm', { locale: es })}
                            </div>
                          )}
                          {indisponibilidad.custodio?.telefono && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {indisponibilidad.custodio.telefono}
                            </div>
                          )}
                          {indisponibilidad.requiere_seguimiento && (
                            <div className="flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3 text-yellow-500" />
                              Requiere seguimiento
                            </div>
                          )}
                        </div>

                        {indisponibilidad.notas && (
                          <div className="mt-3 p-2 bg-muted rounded text-xs">
                            <strong>Notas:</strong> {indisponibilidad.notas}
                          </div>
                        )}
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => setResolverDialog({ 
                              open: true, 
                              indisponibilidad 
                            })}
                          >
                            <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                            Resolver
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleCancelar(indisponibilidad.id)}
                            className="text-red-600"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Cancelar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <ResolverDialog
        open={resolverDialog.open}
        onOpenChange={(open) => setResolverDialog({ open })}
        indisponibilidad={resolverDialog.indisponibilidad}
        onResolver={handleResolver}
        loading={resolviendoIndisponibilidad}
      />
    </>
  );
}