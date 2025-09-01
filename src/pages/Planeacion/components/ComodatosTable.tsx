import React from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MoreHorizontal, 
  Eye, 
  RotateCcw, 
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { ComodatoGPSExtendido, EstadoComodato } from '@/types/comodatos';

interface ComodatosTableProps {
  comodatos: ComodatoGPSExtendido[];
  isLoading: boolean;
  onProcesarDevolucion: (comodatoId: string) => void;
}

export const ComodatosTable: React.FC<ComodatosTableProps> = ({
  comodatos,
  isLoading,
  onProcesarDevolucion
}) => {
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

  const getEstadoIcon = (comodato: ComodatoGPSExtendido) => {
    if (comodato.esta_vencido) {
      return <AlertTriangle className="h-4 w-4 text-destructive" />;
    }
    if (comodato.esta_por_vencer) {
      return <Clock className="h-4 w-4 text-warning" />;
    }
    if (comodato.estado === 'devuelto') {
      return <CheckCircle className="h-4 w-4 text-success" />;
    }
    return null;
  };

  const formatearFecha = (fecha: string) => {
    return format(new Date(fecha), 'dd/MM/yyyy', { locale: es });
  };

  const getCustodioDisplay = (comodato: ComodatoGPSExtendido) => {
    if (comodato.pc_custodio_nombre) {
      return {
        nombre: comodato.pc_custodio_nombre,
        tipo: 'Planeación',
        contacto: comodato.pc_custodio_tel || comodato.pc_custodio_email
      };
    } else if (comodato.custodio_operativo_nombre) {
      return {
        nombre: comodato.custodio_operativo_nombre,
        tipo: 'Operativo',
        contacto: comodato.custodio_operativo_telefono
      };
    }
    return {
      nombre: 'No asignado',
      tipo: '',
      contacto: ''
    };
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (comodatos.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No se encontraron comodatos GPS</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Estado</TableHead>
            <TableHead>GPS</TableHead>
            <TableHead>Custodio</TableHead>
            <TableHead>Fecha Asignación</TableHead>
            <TableHead>Fecha Devolución</TableHead>
            <TableHead>Días</TableHead>
            <TableHead>Asignado Por</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {comodatos.map((comodato) => {
            const custodioInfo = getCustodioDisplay(comodato);
            const estadoIcon = getEstadoIcon(comodato);
            
            return (
              <TableRow key={comodato.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {estadoIcon}
                    <Badge variant={getEstadoBadgeVariant(comodato.estado)}>
                      {comodato.estado}
                    </Badge>
                  </div>
                </TableCell>
                
                <TableCell>
                  <div>
                    <div className="font-medium">
                      {comodato.producto_nombre}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      S/N: {comodato.numero_serie_gps}
                    </div>
                  </div>
                </TableCell>
                
                <TableCell>
                  <div>
                    <div className="font-medium">{custodioInfo.nombre}</div>
                    <div className="text-sm text-muted-foreground">
                      {custodioInfo.tipo} {custodioInfo.contacto && `• ${custodioInfo.contacto}`}
                    </div>
                  </div>
                </TableCell>
                
                <TableCell>
                  {formatearFecha(comodato.fecha_asignacion)}
                </TableCell>
                
                <TableCell>
                  <div>
                    <div>{formatearFecha(comodato.fecha_devolucion_programada)}</div>
                    {comodato.fecha_devolucion_real && (
                      <div className="text-sm text-success">
                        Real: {formatearFecha(comodato.fecha_devolucion_real)}
                      </div>
                    )}
                  </div>
                </TableCell>
                
                <TableCell>
                  <div>
                    <div className="text-sm">
                      Asignado: {comodato.dias_asignado} días
                    </div>
                    {comodato.estado !== 'devuelto' && (
                      <div className={`text-sm ${
                        comodato.esta_vencido 
                          ? 'text-destructive' 
                          : comodato.esta_por_vencer 
                            ? 'text-warning'
                            : 'text-muted-foreground'
                      }`}>
                        {comodato.esta_vencido 
                          ? `Vencido ${Math.abs(comodato.dias_restantes || 0)} días`
                          : `${comodato.dias_restantes} días restantes`
                        }
                      </div>
                    )}
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="text-sm">
                    {comodato.asignado_por_nombre || 'Desconocido'}
                  </div>
                </TableCell>
                
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Eye className="mr-2 h-4 w-4" />
                        Ver Detalle
                      </DropdownMenuItem>
                      {comodato.estado !== 'devuelto' && (
                        <DropdownMenuItem 
                          onClick={() => onProcesarDevolucion(comodato.id)}
                        >
                          <RotateCcw className="mr-2 h-4 w-4" />
                          Procesar Devolución
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};