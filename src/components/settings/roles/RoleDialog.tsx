
import React from 'react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Save } from 'lucide-react';

interface RoleDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  currentRole: {
    id?: string;
    name: string;
    description: string;
  };
  onSave: () => void;
  setCurrentRole: React.Dispatch<React.SetStateAction<{
    id?: string;
    name: string;
    description: string;
  }>>;
}

export const RoleDialog: React.FC<RoleDialogProps> = ({
  isOpen,
  onOpenChange,
  currentRole,
  onSave,
  setCurrentRole
}) => {
  const isSystemRole = currentRole.id && ['admin', 'owner', 'unverified', 'pending'].includes(currentRole.id);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {currentRole.id ? 'Editar Rol' : 'Crear Nuevo Rol'}
          </DialogTitle>
          <DialogDescription>
            {currentRole.id 
              ? 'Modifique el nombre del rol existente.'
              : 'Ingrese un nombre único para el nuevo rol.'
            }
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="role-name" className="text-sm font-medium">
              Nombre del Rol
            </label>
            <Input
              id="role-name"
              value={currentRole.name}
              onChange={(e) => setCurrentRole(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ingrese nombre del rol"
              disabled={isSystemRole}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={onSave} disabled={!currentRole.name.trim()}>
            <Save className="h-4 w-4 mr-2" />
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
