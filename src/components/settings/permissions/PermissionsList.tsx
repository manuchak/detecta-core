
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Permission } from '@/types/roleTypes';
import { Check, X } from 'lucide-react';

interface PermissionsListProps {
  type: string;
  typePermissions: Permission[];
  onPermissionChange: (id: number, allowed: boolean) => void;
}

export const PermissionsList = ({ 
  type, 
  typePermissions, 
  onPermissionChange 
}: PermissionsListProps) => {
  return (
    <div key={type} className="mb-8 bg-white rounded-lg p-4 border border-border/30 shadow-sm">
      <div className="flex items-center mb-4 gap-2">
        <Badge variant="outline" className="bg-accent text-accent-foreground font-medium px-3 py-0.5 text-xs">
          {type}
        </Badge>
        <h3 className="text-base font-medium">Permisos</h3>
      </div>
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="font-medium">Identificador</TableHead>
              <TableHead className="font-medium">Estado</TableHead>
              <TableHead className="text-right font-medium">Activar/Desactivar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {typePermissions.map((permission) => (
              <TableRow key={permission.id} className="hover:bg-muted/30">
                <TableCell className="font-medium">{permission.permission_id}</TableCell>
                <TableCell>
                  {permission.allowed ? (
                    <div className="flex items-center gap-1.5">
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-200 font-medium">
                        <Check className="h-3.5 w-3.5 mr-1" />
                        Permitido
                      </Badge>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className="text-red-600 border-red-200">
                        <X className="h-3.5 w-3.5 mr-1" />
                        Denegado
                      </Badge>
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Switch
                    checked={permission.allowed}
                    onCheckedChange={(checked) => 
                      onPermissionChange(permission.id, checked)
                    }
                    className="data-[state=checked]:bg-green-600"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
