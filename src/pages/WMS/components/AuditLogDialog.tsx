import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Shield, User, Calendar, FileText, Trash2, Edit, Plus } from "lucide-react";

interface AuditLogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface AuditLog {
  id: string;
  producto_id: string;
  accion: string;
  datos_anteriores: any;
  datos_nuevos: any;
  usuario_id: string;
  fecha_accion: string;
  motivo: string | null;
  created_at: string;
  direccion_ip: any;
  user_agent: string | null;
}

export const AuditLogDialog = ({ open, onOpenChange }: AuditLogDialogProps) => {
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const { data: auditLogs, isLoading } = useQuery({
    queryKey: ['audit-logs-productos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_log_productos')
        .select('*')
        .order('fecha_accion', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data || [];
    },
    enabled: open
  });

  const getActionIcon = (accion: string) => {
    switch (accion) {
      case 'crear':
        return <Plus className="h-4 w-4 text-green-500" />;
      case 'actualizar':
        return <Edit className="h-4 w-4 text-blue-500" />;
      case 'eliminar':
        return <Trash2 className="h-4 w-4 text-red-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActionBadgeVariant = (accion: string) => {
    switch (accion) {
      case 'crear':
        return 'default';
      case 'actualizar':
        return 'secondary';
      case 'eliminar':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-500" />
            Log de Auditoría de Productos
          </DialogTitle>
          <DialogDescription>
            Registro de todas las acciones realizadas sobre los productos del inventario
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[60vh]">
          {/* Lista de logs */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Actividad Reciente</h3>
            <ScrollArea className="h-full">
              <div className="space-y-3">
                {isLoading ? (
                  <div className="text-center py-4">Cargando logs...</div>
                ) : auditLogs?.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    No hay registros de auditoría
                  </div>
                ) : (
                  auditLogs?.map((log) => (
                    <Card 
                      key={log.id} 
                      className={`cursor-pointer transition-colors hover:bg-accent ${
                        selectedLog?.id === log.id ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => setSelectedLog(log)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getActionIcon(log.accion)}
                            <Badge variant={getActionBadgeVariant(log.accion)}>
                              {log.accion.toUpperCase()}
                            </Badge>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(log.fecha_accion), {
                              addSuffix: true,
                              locale: es
                            })}
                          </span>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <User className="h-3 w-3" />
                            <span>Usuario ID: {log.usuario_id}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <FileText className="h-3 w-3" />
                            <span className="truncate">
                              {(log.datos_anteriores as any)?.nombre || 'Producto'}
                            </span>
                          </div>

                          {log.motivo && (
                            <p className="text-xs text-muted-foreground mt-2">
                              {log.motivo}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Detalles del log seleccionado */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Detalles de la Acción</h3>
            {selectedLog ? (
              <ScrollArea className="h-full">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {getActionIcon(selectedLog.accion)}
                      Acción: {selectedLog.accion.toUpperCase()}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Usuario</label>
                        <p className="text-sm">ID: {selectedLog.usuario_id}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Fecha</label>
                        <p className="text-sm">
                          {new Date(selectedLog.fecha_accion).toLocaleString('es-ES')}
                        </p>
                      </div>
                    </div>

                    {selectedLog.motivo && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Motivo</label>
                        <p className="text-sm">{selectedLog.motivo}</p>
                      </div>
                    )}

                    {selectedLog.datos_anteriores && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Datos Anteriores</label>
                        <div className="bg-muted p-3 rounded-md">
                          <pre className="text-xs overflow-auto">
                            {JSON.stringify(selectedLog.datos_anteriores, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}

                    {selectedLog.datos_nuevos && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Datos Nuevos</label>
                        <div className="bg-muted p-3 rounded-md">
                          <pre className="text-xs overflow-auto">
                            {JSON.stringify(selectedLog.datos_nuevos, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </ScrollArea>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Selecciona una acción para ver los detalles
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};