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
import { Skeleton } from '@/components/ui/skeleton';
import { Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { CustodioLiberacion, EstadoLiberacion } from '@/types/liberacion';
import { useCustodioLiberacion } from '@/hooks/useCustodioLiberacion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import LiberacionProgressBar from './LiberacionProgressBar';

interface LiberacionTableProps {
  liberaciones: CustodioLiberacion[];
  onViewDetails: (liberacion: CustodioLiberacion) => void;
  limit?: number;
  compact?: boolean;
  isLoading?: boolean; // ✅ FIX: Prop para estado de carga
}

const LiberacionTable = ({ liberaciones, onViewDetails, limit, compact = false, isLoading = false }: LiberacionTableProps) => {
  const { calculateProgress } = useCustodioLiberacion();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = limit || 10;

  const totalPages = Math.ceil(liberaciones.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentLiberaciones = liberaciones.slice(startIndex, endIndex);

  const getEstadoBadge = (estado: EstadoLiberacion) => {
    const variants: Record<EstadoLiberacion, { variant: any; label: string }> = {
      pendiente: { variant: 'secondary', label: 'Pendiente' },
      documentacion: { variant: 'default', label: 'Documentación' },
      psicometricos: { variant: 'default', label: 'Psicométricos' },
      toxicologicos: { variant: 'default', label: 'Toxicológicos' },
      vehiculo: { variant: 'default', label: 'Vehículo' },
      gps: { variant: 'default', label: 'GPS' },
      aprobado_final: { variant: 'success', label: 'Aprobado' },
      liberado: { variant: 'success', label: 'Liberado' },
      rechazado: { variant: 'destructive', label: 'Rechazado' },
    };

    const config = variants[estado];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // ✅ FIX: Mostrar skeletons durante la carga inicial
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 border rounded-md">
            <Skeleton className="h-5 w-32" />
            {!compact && <Skeleton className="h-5 w-24" />}
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-4 w-48" />
            {!compact && <Skeleton className="h-5 w-20" />}
            <Skeleton className="h-8 w-24 ml-auto" />
          </div>
        ))}
      </div>
    );
  }

  if (liberaciones.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No hay custodios en este estado</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              {!compact && <TableHead>Teléfono</TableHead>}
              <TableHead>Estado</TableHead>
              <TableHead>Progreso</TableHead>
              {!compact && <TableHead>Fecha Inicio</TableHead>}
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentLiberaciones.map((liberacion) => {
              const progress = calculateProgress(liberacion);
              return (
                <TableRow key={liberacion.id}>
                  <TableCell className="font-medium">
                    {liberacion.candidato?.nombre || 'N/A'}
                  </TableCell>
                  {!compact && (
                    <TableCell>{liberacion.candidato?.telefono || 'N/A'}</TableCell>
                  )}
                  <TableCell>{getEstadoBadge(liberacion.estado_liberacion)}</TableCell>
                  <TableCell>
                    <div className="w-48">
                      <LiberacionProgressBar progress={progress} compact />
                    </div>
                  </TableCell>
                  {!compact && (
                    <TableCell>
                      {format(new Date(liberacion.created_at), 'dd/MM/yyyy', { locale: es })}
                    </TableCell>
                  )}
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewDetails(liberacion)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Detalles
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {!limit && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Mostrando {startIndex + 1} a {Math.min(endIndex, liberaciones.length)} de {liberaciones.length} registros
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <Button
                  key={page}
                  variant={currentPage === page ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className="w-8 h-8 p-0"
                >
                  {page}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiberacionTable;
