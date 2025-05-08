
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
    <div key={type} className="mb-6">
      <h3 className="text-lg font-medium mb-2 flex items-center">
        <Badge variant="outline" className="mr-2">{type}</Badge>
        Permisos
      </h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Identificador</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {typePermissions.map((permission) => (
            <TableRow key={permission.id}>
              <TableCell>{permission.permission_id}</TableCell>
              <TableCell>
                {permission.allowed ? (
                  <Badge className="bg-green-500">Permitido</Badge>
                ) : (
                  <Badge variant="outline" className="text-red-500">
                    Denegado
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                <Switch
                  checked={permission.allowed}
                  onCheckedChange={(checked) => 
                    onPermissionChange(permission.id, checked)
                  }
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
