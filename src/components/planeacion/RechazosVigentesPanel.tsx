/**
 * RechazosVigentesPanel - Management panel for active custodian rejection penalties
 * Shows a table of all active rejections with the ability to lift them
 */

import { useState } from 'react';
import { ShieldOff, Ban, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRechazosVigentesDetallados, useSuspenderRechazo, useRechazosHistorial, type RechazadoDetalle } from '@/hooks/useCustodioRechazos';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface RechazosVigentesPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inclujeArmado?: boolean;
}

export function RechazosVigentesPanel({ open, onOpenChange, inclujeArmado }: RechazosVigentesPanelProps) {
  const { data: rechazados = [], isLoading } = useRechazosVigentesDetallados({ inclujeArmado });
  const { data: historial = [], isLoading: isLoadingHistorial } = useRechazosHistorial();
  const suspenderRechazo = useSuspenderRechazo();
  const [confirmTarget, setConfirmTarget] = useState<RechazadoDetalle | null>(null);

  const handleConfirmSuspend = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent AlertDialogAction auto-close
    if (!confirmTarget) return;
    try {
      await suspenderRechazo.mutateAsync({
        rechazoId: confirmTarget.id,
        custodioNombre: confirmTarget.nombre,
      });
    } finally {
      setConfirmTarget(null);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ban className="h-5 w-5 text-destructive" />
              Rechazos Vigentes
              {rechazados.length > 0 && (
                <Badge variant="secondary" className="ml-1">{rechazados.length}</Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              Custodios con penalidad activa. Puedes levantar la penalidad para que vuelvan a aparecer en la lista de disponibles.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="vigentes" className="mt-2">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="vigentes">
                Vigentes
                {rechazados.length > 0 && (
                  <Badge variant="secondary" className="ml-1.5 h-4 text-[10px] px-1">{rechazados.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="historial">
                Historial (30d)
                {historial.length > 0 && (
                  <Badge variant="outline" className="ml-1.5 h-4 text-[10px] px-1">{historial.length}</Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="vigentes">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : rechazados.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay rechazos vigentes
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Custodio</TableHead>
                      <TableHead>Motivo</TableHead>
                      <TableHead>Vigencia</TableHead>
                      <TableHead>Reportado por</TableHead>
                      <TableHead className="w-[100px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rechazados.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.nombre}</TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                          {r.motivo || '—'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {format(new Date(r.vigencia_hasta), "d 'de' MMM", { locale: es })}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {r.reportado_por_nombre || '—'}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1 text-destructive hover:text-destructive hover:bg-destructive/10 h-7 px-2"
                            onClick={() => setConfirmTarget(r)}
                            disabled={suspenderRechazo.isPending}
                          >
                            <ShieldOff className="h-3.5 w-3.5" />
                            Levantar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="historial">
              {isLoadingHistorial ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : historial.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Sin rechazos expirados en los últimos 30 días
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Custodio</TableHead>
                      <TableHead>Motivo</TableHead>
                      <TableHead>Expiró</TableHead>
                      <TableHead>Reportado por</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historial.map((r) => (
                      <TableRow key={r.id} className="opacity-70">
                        <TableCell className="font-medium">{r.nombre}</TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                          {r.motivo || '—'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {format(new Date(r.vigencia_hasta), "d 'de' MMM", { locale: es })}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {r.reportado_por_nombre || '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Confirmation dialog */}
      <AlertDialog open={!!confirmTarget} onOpenChange={(open) => !open && setConfirmTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Levantar penalidad de rechazo</AlertDialogTitle>
            <AlertDialogDescription>
              Vas a levantar la penalidad de <strong>{confirmTarget?.nombre}</strong>. 
              Aparecerá de nuevo en la lista de custodios disponibles de forma inmediata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmSuspend}
              disabled={suspenderRechazo.isPending}
            >
              {suspenderRechazo.isPending ? 'Levantando...' : 'Confirmar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
