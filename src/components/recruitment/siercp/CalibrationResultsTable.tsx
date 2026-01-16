import { useState } from 'react';
import { useSIERCPResults } from '@/hooks/useSIERCPResults';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Eye, Trash2, AlertTriangle, FlaskConical, User, XCircle, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

// Flag para ocultar en producción (cambiar a true cuando esté listo)
const HIDE_CALIBRATION_IN_PRODUCTION = false;

export function CalibrationResultsTable() {
  const { allResults, loading, loadingAll, errorAllResults, isAdmin, deleteResult, refetch } = useSIERCPResults();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();

  if (HIDE_CALIBRATION_IN_PRODUCTION) {
    return null;
  }

  // Mostrar error si falló la carga
  if (errorAllResults) {
    return (
      <Alert variant="destructive">
        <XCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>Error al cargar resultados: {errorAllResults}</span>
          <Button variant="outline" size="sm" onClick={refetch} className="ml-4 gap-2">
            <RefreshCw className="h-3 w-3" />
            Reintentar
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await deleteResult(deleteId);
      toast({
        title: 'Resultado eliminado',
        description: 'El resultado de calibración ha sido eliminado.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el resultado.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading || loadingAll) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Alert className="bg-amber-500/10 border-amber-500/30">
        <FlaskConical className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-700">
          <strong>Modo Calibración:</strong> Estos resultados son de pruebas internas 
          del equipo Supply para validar el sistema SIERCP.
        </AlertDescription>
      </Alert>

      {allResults.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No hay resultados de calibración aún</p>
          <p className="text-sm">Los miembros del equipo Supply pueden realizar la evaluación en la sección SIERCP</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuario</TableHead>
              <TableHead className="text-center">Score Global</TableHead>
              <TableHead className="text-center">Riesgos</TableHead>
              <TableHead>Interpretación</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allResults.map((result: any) => (
              <TableRow key={result.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-semibold text-primary">
                        {result.profiles?.display_name?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">
                        {result.profiles?.display_name || 'Usuario'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {result.profiles?.email || ''}
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-600 text-xs">
                      CALIBRACIÓN
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <span className={`font-bold text-lg ${getScoreColor(result.global_score)}`}>
                    {result.global_score}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  {result.risk_flags?.length > 0 ? (
                    <Badge variant="destructive" className="gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {result.risk_flags.length}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-green-600">0</Badge>
                  )}
                </TableCell>
                <TableCell className="max-w-[200px]">
                  <p className="text-sm text-muted-foreground truncate">
                    {result.clinical_interpretation || 'Sin interpretación'}
                  </p>
                </TableCell>
                <TableCell>
                  {format(new Date(result.completed_at), "dd MMM yyyy", { locale: es })}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigate(`/evaluation/siercp?result=${result.id}`)}
                      title="Ver detalle"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(result.id)}
                        className="text-destructive hover:text-destructive"
                        title="Eliminar resultado"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar resultado de calibración?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente el resultado de calibración.
              El usuario podrá volver a realizar la evaluación.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
