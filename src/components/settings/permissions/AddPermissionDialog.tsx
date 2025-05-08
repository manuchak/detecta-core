
import React from 'react';
import { Role } from '@/types/roleTypes';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

interface AddPermissionDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  newPermission: {
    role: Role;
    permissionType: string;
    permissionId: string;
    allowed: boolean;
  };
  onNewPermissionChange: (field: string, value: string | boolean | Role) => void;
  onAddPermission: () => void;
  availableRoles: Role[] | undefined;
}

export const AddPermissionDialog = ({
  isOpen,
  onOpenChange,
  newPermission,
  onNewPermissionChange,
  onAddPermission,
  availableRoles = [],
}: AddPermissionDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="flex items-center gap-1">
          <PlusCircle className="h-4 w-4" />
          Agregar Permiso
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agregar Nuevo Permiso</DialogTitle>
          <DialogDescription>
            Complete la información para crear un nuevo permiso
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="role" className="text-right">
              Rol
            </Label>
            <Select
              value={newPermission.role}
              onValueChange={(value) => 
                onNewPermissionChange('role', value as Role)
              }
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Seleccionar rol" />
              </SelectTrigger>
              <SelectContent>
                {availableRoles.map((role) => (
                  <SelectItem key={role} value={role}>{role}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="permissionType" className="text-right">
              Tipo
            </Label>
            <Input
              id="permissionType"
              placeholder="page, action, feature"
              className="col-span-3"
              value={newPermission.permissionType}
              onChange={(e) => 
                onNewPermissionChange('permissionType', e.target.value)
              }
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="permissionId" className="text-right">
              Identificador
            </Label>
            <Input
              id="permissionId"
              placeholder="settings, create_user"
              className="col-span-3"
              value={newPermission.permissionId}
              onChange={(e) => 
                onNewPermissionChange('permissionId', e.target.value)
              }
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="allowed" className="text-right">
              Permitido
            </Label>
            <div className="col-span-3">
              <Switch
                id="allowed"
                checked={newPermission.allowed}
                onCheckedChange={(checked) => 
                  onNewPermissionChange('allowed', checked)
                }
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onAddPermission}>Guardar Permiso</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
