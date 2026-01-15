import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShieldAlert } from 'lucide-react';
import { usePersonalProveedorArmados, type VerificacionLicencia } from '@/hooks/usePersonalProveedorArmados';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ExternalArmedVerificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proveedorId: string;
  proveedorNombre: string;
  servicioId: string;
  onConfirm: (personalData: {
    personalId: string;
    nombreCompleto: string;
    licenciaPortacion?: string;
    verificacionData: VerificacionLicencia;
  }) => void;
}

export const ExternalArmedVerificationModal: React.FC<ExternalArmedVerificationModalProps> = ({
  open,
  onOpenChange,
  proveedorId,
  proveedorNombre,
  servicioId,
  onConfirm
}) => {
  const { getPersonalByProveedor, createPersonal } = usePersonalProveedorArmados();
  const { isPlanificador, isAdmin, userId, loading: roleLoading } = useUserRole();
  const [selectedPersonalId, setSelectedPersonalId] = useState<string>('');
  const [showNewPersonalInput, setShowNewPersonalInput] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [loading, setLoading] = useState(false);

  const personalDelProveedor = getPersonalByProveedor(proveedorId);
  const canModify = isPlanificador() || isAdmin();

  useEffect(() => {
    if (!open) {
      setSelectedPersonalId('');
      setShowNewPersonalInput(false);
      setNuevoNombre('');
    }
  }, [open]);

  const handleConfirm = async () => {
    if (!selectedPersonalId || !userId) return;

    if (!canModify) {
      toast.error('No tienes permisos para asignar personal. Se requiere rol de Planificador o Administrador.');
      return;
    }

    const personal = personalDelProveedor.find(p => p.id === selectedPersonalId);
    if (!personal) return;

    setLoading(true);
    try {
      // Registrar asignación en auditoría
      await supabase.from('asignacion_personal_externo_audit').insert({
        personal_id: personal.id,
        proveedor_id: proveedorId,
        servicio_id: servicioId,
        accion: 'asignado',
        nombre_completo: personal.nombre_completo,
        realizado_por: userId,
        metadata: {
          proveedor: proveedorNombre,
          servicio: servicioId
        }
      });

      await onConfirm({
        personalId: personal.id,
        nombreCompleto: personal.nombre_completo,
        verificacionData: { valida: true }
      });
      
      toast.success('Personal asignado exitosamente');
      onOpenChange(false);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al asignar personal');
    } finally {
      setLoading(false);
    }
  };

  const handleCrearYAsignar = async () => {
    if (!nuevoNombre.trim()) {
      toast.error('Ingrese el nombre del elemento');
      return;
    }

    if (!canModify) {
      toast.error('No tienes permisos para crear personal. Se requiere rol de Planificador o Administrador.');
      return;
    }

    if (!userId) {
      toast.error('Usuario no autenticado');
      return;
    }

    setLoading(true);
    try {
      const nuevoPersonal = await createPersonal({
        proveedor_id: proveedorId,
        nombre_completo: nuevoNombre.trim(),
        estado_verificacion: 'verificado',
        disponible_para_servicios: true,
        activo: true
      });

      // Registrar asignación en auditoría
      await supabase.from('asignacion_personal_externo_audit').insert({
        personal_id: nuevoPersonal.id,
        proveedor_id: proveedorId,
        servicio_id: servicioId,
        accion: 'asignado',
        nombre_completo: nuevoPersonal.nombre_completo,
        realizado_por: userId,
        metadata: {
          proveedor: proveedorNombre,
          servicio: servicioId,
          recien_creado: true
        }
      });

      await onConfirm({
        personalId: nuevoPersonal.id,
        nombreCompleto: nuevoPersonal.nombre_completo,
        verificacionData: { valida: true }
      });

      toast.success(`Personal ${nuevoNombre} agregado y asignado`);
      onOpenChange(false);
    } catch (error) {
      console.error('Error:', error);
      // El hook createPersonal ya maneja el error de permisos
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Asignar Personal de {proveedorNombre}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!roleLoading && !canModify && (
            <Alert variant="destructive">
              <ShieldAlert className="h-4 w-4" />
              <AlertDescription>
                No tienes permisos para asignar personal. Se requiere rol de <strong>Planificador</strong> o <strong>Administrador</strong>.
              </AlertDescription>
            </Alert>
          )}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Personal Registrado
            </label>
            <Select value={selectedPersonalId} onValueChange={setSelectedPersonalId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar elemento..." />
              </SelectTrigger>
              <SelectContent>
                {personalDelProveedor.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground text-sm">
                    No hay personal registrado
                  </div>
                ) : (
                  personalDelProveedor.map((personal) => (
                    <SelectItem key={personal.id} value={personal.id}>
                      {personal.nombre_completo}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">O</span>
            </div>
          </div>

          {!showNewPersonalInput ? (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowNewPersonalInput(true)}
              disabled={!canModify || roleLoading}
            >
              + Agregar Nuevo Elemento
            </Button>
          ) : (
            <Card className="border-dashed">
              <CardContent className="pt-6 space-y-3">
                <Input
                  placeholder="Nombre completo del elemento *"
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && nuevoNombre.trim()) {
                      handleCrearYAsignar();
                    }
                  }}
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowNewPersonalInput(false);
                      setNuevoNombre('');
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleCrearYAsignar}
                    disabled={!nuevoNombre.trim() || loading}
                    className="flex-1"
                  >
                    Guardar y Asignar
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  ℹ️ Solo necesitamos el nombre para auditoría. {proveedorNombre} es responsable de su documentación.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedPersonalId || loading || !canModify || roleLoading}
          >
            {loading ? 'Asignando...' : 'Confirmar Asignación'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};