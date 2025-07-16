import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  MoreHorizontal, 
  Package, 
  Truck, 
  Wrench, 
  CheckCircle, 
  Clock,
  MapPin,
  User,
  Calendar,
  Cpu,
  CreditCard,
  HardDrive
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useKitsInstalacion, KitInstalacion } from '@/hooks/useKitsInstalacion';

const ESTADO_COLORS = {
  preparado: 'bg-blue-100 text-blue-800',
  enviado: 'bg-yellow-100 text-yellow-800',
  instalado: 'bg-orange-100 text-orange-800',
  validado: 'bg-green-100 text-green-800',
};

const ESTADO_ICONS = {
  preparado: Package,
  enviado: Truck,
  instalado: Wrench,
  validado: CheckCircle,
};

interface ActualizarEstadoDialogProps {
  kit: KitInstalacion | null;
  nuevoEstado: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (observaciones?: string, numeroTracking?: string) => void;
}

const ActualizarEstadoDialog = ({ 
  kit, 
  nuevoEstado, 
  open, 
  onOpenChange, 
  onConfirm 
}: ActualizarEstadoDialogProps) => {
  const [observaciones, setObservaciones] = useState('');
  const [numeroTracking, setNumeroTracking] = useState('');

  const handleConfirm = () => {
    onConfirm(observaciones || undefined, numeroTracking || undefined);
    setObservaciones('');
    setNumeroTracking('');
    onOpenChange(false);
  };

  const getDialogContent = () => {
    switch (nuevoEstado) {
      case 'enviado':
        return {
          title: 'Marcar como Enviado',
          description: 'Confirma que el kit ha sido enviado al instalador',
          showTracking: true,
          showObservaciones: false
        };
      case 'instalado':
        return {
          title: 'Marcar como Instalado',
          description: 'Confirma que la instalación ha sido completada',
          showTracking: false,
          showObservaciones: true
        };
      case 'validado':
        return {
          title: 'Validar Instalación',
          description: 'Confirma que la instalación ha sido validada',
          showTracking: false,
          showObservaciones: true
        };
      default:
        return {
          title: 'Actualizar Estado',
          description: 'Actualizar el estado del kit',
          showTracking: false,
          showObservaciones: true
        };
    }
  };

  const content = getDialogContent();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{content.title}</DialogTitle>
          <DialogDescription>{content.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {kit && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="font-medium">{kit.contacto_cliente}</p>
              <p className="text-sm text-muted-foreground">{kit.direccion_instalacion}</p>
              <p className="text-sm text-muted-foreground">GPS: {kit.gps_marca} {kit.gps_modelo}</p>
            </div>
          )}

          {content.showTracking && (
            <div className="space-y-2">
              <Label htmlFor="tracking">Número de Tracking</Label>
              <Input
                id="tracking"
                value={numeroTracking}
                onChange={(e) => setNumeroTracking(e.target.value)}
                placeholder="Ingresa el número de seguimiento"
              />
            </div>
          )}

          {content.showObservaciones && (
            <div className="space-y-2">
              <Label htmlFor="observaciones">Observaciones</Label>
              <Textarea
                id="observaciones"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Observaciones adicionales (opcional)"
              />
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirm}>
              Confirmar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const KitsInstalacionTable = () => {
  const { kits, isLoadingKits, updateEstadoKit, validarInstalacion } = useKitsInstalacion();
  const [kitSeleccionado, setKitSeleccionado] = useState<KitInstalacion | null>(null);
  const [nuevoEstado, setNuevoEstado] = useState<string>('');
  const [showDialog, setShowDialog] = useState(false);

  const handleEstadoChange = (kit: KitInstalacion, estado: string) => {
    setKitSeleccionado(kit);
    setNuevoEstado(estado);
    setShowDialog(true);
  };

  const handleConfirmChange = (observaciones?: string, numeroTracking?: string) => {
    if (!kitSeleccionado) return;

    if (nuevoEstado === 'validado') {
      validarInstalacion({
        kitId: kitSeleccionado.id,
        observaciones
      });
    } else {
      updateEstadoKit({
        kitId: kitSeleccionado.id,
        nuevoEstado,
        observaciones,
        numeroTracking
      });
    }
  };

  const getAccionesDisponibles = (kit: KitInstalacion) => {
    const acciones = [];
    
    switch (kit.estado_kit) {
      case 'preparado':
        acciones.push({ label: 'Marcar como Enviado', estado: 'enviado' });
        break;
      case 'enviado':
        acciones.push({ label: 'Marcar como Instalado', estado: 'instalado' });
        break;
      case 'instalado':
        acciones.push({ label: 'Validar Instalación', estado: 'validado' });
        break;
    }
    
    return acciones;
  };

  if (isLoadingKits) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 animate-spin" />
            <span>Cargando kits de instalación...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Kits de Instalación
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Fecha Programada</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Componentes</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Instalador</TableHead>
                  <TableHead>Tracking</TableHead>
                  <TableHead className="w-[50px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {kits?.map((kit) => {
                  const IconoEstado = ESTADO_ICONS[kit.estado_kit as keyof typeof ESTADO_ICONS];
                  const acciones = getAccionesDisponibles(kit);
                  
                  return (
                    <TableRow key={kit.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{kit.contacto_cliente}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {kit.direccion_instalacion}
                          </p>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span className="text-sm">
                            {format(new Date(kit.fecha_programada), 'dd/MM/yyyy HH:mm', { locale: es })}
                          </span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <Badge variant="outline">{kit.tipo_instalacion}</Badge>
                      </TableCell>
                      
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-xs">
                            <Cpu className="h-3 w-3" />
                            <span>{kit.gps_marca} {kit.gps_modelo}</span>
                          </div>
                          {kit.numero_sim && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <CreditCard className="h-3 w-3" />
                              <span>{kit.sim_operador}</span>
                            </div>
                          )}
                          {kit.microsd_marca && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <HardDrive className="h-3 w-3" />
                              <span>{kit.capacidad_gb}GB</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <Badge 
                          variant="secondary" 
                          className={ESTADO_COLORS[kit.estado_kit as keyof typeof ESTADO_COLORS]}
                        >
                          <IconoEstado className="h-3 w-3 mr-1" />
                          {kit.estado_kit}
                        </Badge>
                      </TableCell>
                      
                      <TableCell>
                        {kit.instalador_nombre ? (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span className="text-sm">{kit.instalador_nombre}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Sin asignar</span>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        {kit.numero_tracking ? (
                          <Badge variant="outline">{kit.numero_tracking}</Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        {acciones.length > 0 && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {acciones.map((accion) => (
                                <DropdownMenuItem 
                                  key={accion.estado}
                                  onClick={() => handleEstadoChange(kit, accion.estado)}
                                >
                                  {accion.label}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {(!kits || kits.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No hay kits de instalación registrados</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <ActualizarEstadoDialog
        kit={kitSeleccionado}
        nuevoEstado={nuevoEstado}
        open={showDialog}
        onOpenChange={setShowDialog}
        onConfirm={handleConfirmChange}
      />
    </>
  );
};