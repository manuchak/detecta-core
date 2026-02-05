import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Building2, MapPin, FileText, Loader2 } from 'lucide-react';
import { useUpdateClienteNombre, useClienteImpact, ClienteEnRutas } from '@/hooks/useClientesEnRutas';
import { useAuth } from '@/contexts/AuthContext';
import { NOMBRE_COMERCIAL_EDIT_ROLES } from '@/constants/accessControl';

interface QuickClienteEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cliente: ClienteEnRutas | null;
  onSuccess?: () => void;
}

export function QuickClienteEditModal({
  open,
  onOpenChange,
  cliente,
  onSuccess
}: QuickClienteEditModalProps) {
  const { userRole } = useAuth();
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [confirmacion, setConfirmacion] = useState(false);
  
  const updateNombre = useUpdateClienteNombre();
  const { data: impacto, isLoading: loadingImpacto } = useClienteImpact(cliente?.nombre || '');

  // Verificar permisos
  const tienePermiso = userRole && NOMBRE_COMERCIAL_EDIT_ROLES.includes(userRole as any);

  // Resetear estado al abrir
  useEffect(() => {
    if (open && cliente) {
      setNuevoNombre(cliente.nombre);
      setConfirmacion(false);
    }
  }, [open, cliente]);

  const nombreModificado = cliente && nuevoNombre.trim() !== cliente.nombre;
  const tieneImpacto = (impacto?.rutas || 0) > 0 || (impacto?.servicios || 0) > 0;
  const requiereConfirmacion = nombreModificado && tieneImpacto;
  const puedeGuardar = nombreModificado && nuevoNombre.trim().length > 0 && 
    (!requiereConfirmacion || confirmacion);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!cliente?.id || !puedeGuardar) return;

    try {
      await updateNombre.mutateAsync({
        clienteId: cliente.id,
        nuevoNombre: nuevoNombre.trim(),
        nombreAnterior: cliente.nombre
      });
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      // Error ya manejado en el hook
    }
  };

  if (!tienePermiso) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Acceso Denegado</DialogTitle>
            <DialogDescription>
              No tienes permisos para editar nombres comerciales de clientes.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  if (!cliente) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Editar Nombre Comercial
          </DialogTitle>
          <DialogDescription>
            Modifica el nombre comercial del cliente. Este cambio afecta cómo se busca y
            muestra el cliente en el sistema.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Información actual */}
          <div className="rounded-lg border p-4 bg-muted/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Cliente actual</span>
              <div className="flex gap-2">
                {cliente.es_cliente_maestro ? (
                  <Badge variant="outline" className="text-success border-success/30">
                    Registrado
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-warning border-warning/30">
                    Solo en rutas
                  </Badge>
                )}
              </div>
            </div>
            <p className="text-lg font-semibold">{cliente.nombre}</p>
            {cliente.razon_social && (
              <p className="text-sm text-muted-foreground">
                Razón social: {cliente.razon_social}
              </p>
            )}
          </div>

          {/* Input de nuevo nombre */}
          <div className="space-y-2">
            <Label htmlFor="nuevoNombre">Nuevo nombre comercial</Label>
            <Input
              id="nuevoNombre"
              value={nuevoNombre}
              onChange={(e) => setNuevoNombre(e.target.value)}
              placeholder="Ingresa el nuevo nombre..."
              className={nombreModificado ? 'border-warning focus:ring-warning' : ''}
            />
          </div>

          {/* Análisis de impacto */}
          {nombreModificado && (
            <div className="space-y-3">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    {loadingImpacto ? (
                      <Loader2 className="h-4 w-4 animate-spin inline" />
                    ) : (
                      `${impacto?.rutas || 0} rutas`
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    {loadingImpacto ? (
                      <Loader2 className="h-4 w-4 animate-spin inline" />
                    ) : (
                      `${impacto?.servicios || 0} servicios (90d)`
                    )}
                  </span>
                </div>
              </div>

              {tieneImpacto && (
                <Alert variant="destructive" className="border-warning bg-warning/10">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  <AlertTitle className="text-warning">Advertencia de Impacto</AlertTitle>
                  <AlertDescription className="text-warning/90">
                    Este cliente tiene rutas y/o servicios asociados. Cambiar el nombre
                    <strong> NO actualizará automáticamente</strong> las referencias existentes
                    en rutas ni en el historial de servicios. Las búsquedas por el nombre
                    anterior podrían no encontrar este cliente.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Checkbox de confirmación */}
          {requiereConfirmacion && (
            <div className="flex items-start gap-3 p-3 rounded-lg border border-warning/50 bg-warning/5">
              <Checkbox
                id="confirmacion"
                checked={confirmacion}
                onCheckedChange={(checked) => setConfirmacion(checked === true)}
                className="mt-0.5"
              />
              <Label htmlFor="confirmacion" className="text-sm cursor-pointer leading-relaxed">
                Entiendo que este cambio puede afectar búsquedas y reportes históricos.
                Confirmo que deseo proceder con la modificación.
              </Label>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!puedeGuardar || updateNombre.isPending || !cliente.es_cliente_maestro}
              className={requiereConfirmacion && confirmacion ? 'bg-warning hover:bg-warning/90' : ''}
            >
              {updateNombre.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar Cambios'
              )}
            </Button>
          </DialogFooter>

          {!cliente.es_cliente_maestro && (
            <p className="text-xs text-muted-foreground text-center">
              Este cliente solo existe en rutas. Primero debe registrarse en el sistema
              para poder editar su nombre.
            </p>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
