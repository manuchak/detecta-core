
import React from 'react';
import { Role } from '@/types/roleTypes';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

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
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-100 text-purple-800';
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'supply_admin':
      case 'monitoring_supervisor':
        return 'bg-amber-100 text-amber-800';
      case 'supply':
      case 'soporte':
      case 'bi':
      case 'monitoring':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'unverified':
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Agregar Nuevo Permiso</DialogTitle>
          <DialogDescription>
            Complete la información para crear un nuevo permiso en el sistema
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="role" className="text-right font-medium">
              Rol
            </Label>
            <div className="col-span-3">
              <Select
                value={newPermission.role}
                onValueChange={(value) => 
                  onNewPermissionChange('role', value as Role)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map((role) => (
                    <SelectItem key={role} value={role}>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`${getRoleBadgeColor(role)} px-2 py-0.5`}>
                          {role}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="permissionType" className="text-right font-medium">
              Tipo
            </Label>
            <div className="col-span-3">
              <Input
                id="permissionType"
                placeholder="page, action, feature, etc."
                className="w-full"
                value={newPermission.permissionType}
                onChange={(e) => 
                  onNewPermissionChange('permissionType', e.target.value)
                }
              />
              <p className="text-xs text-muted-foreground mt-1">
                Categoría del permiso (ej: page, action, feature)
              </p>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="permissionId" className="text-right font-medium">
              Identificador
            </Label>
            <div className="col-span-3">
              <Input
                id="permissionId"
                placeholder="settings, create_user, etc."
                className="w-full"
                value={newPermission.permissionId}
                onChange={(e) => 
                  onNewPermissionChange('permissionId', e.target.value)
                }
              />
              <p className="text-xs text-muted-foreground mt-1">
                Nombre único del permiso (ej: settings, create_user)
              </p>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="allowed" className="text-right font-medium">
              Estado
            </Label>
            <div className="col-span-3 flex items-center gap-4">
              <Switch
                id="allowed"
                checked={newPermission.allowed}
                onCheckedChange={(checked) => 
                  onNewPermissionChange('allowed', checked)
                }
                className="data-[state=checked]:bg-green-600"
              />
              <span className={newPermission.allowed ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                {newPermission.allowed ? "Permitido" : "Denegado"}
              </span>
            </div>
          </div>
        </div>
        <DialogFooter className="sm:justify-between">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={onAddPermission} className="px-6">
            Guardar Permiso
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
