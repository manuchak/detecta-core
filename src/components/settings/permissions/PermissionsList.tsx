
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
import { Check, X, ShieldCheck } from 'lucide-react';

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
    <div key={type} className="mb-6 bg-white rounded-xl p-0 border border-border/30 shadow-sm overflow-hidden">
      <div className="px-4 py-3 bg-muted/20 border-b border-border/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <Badge variant="outline" className="bg-accent text-accent-foreground font-medium px-3 py-0.5 text-xs">
            {type}
          </Badge>
          <h3 className="text-sm font-medium">Permisos</h3>
        </div>
        <Badge variant="outline" className="bg-muted/50 text-muted-foreground">
          {typePermissions.length} {typePermissions.length === 1 ? 'permiso' : 'permisos'}
        </Badge>
      </div>
      <div className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/10 hover:bg-transparent">
              <TableHead className="font-medium text-xs">Identificador</TableHead>
              <TableHead className="font-medium text-xs">Estado</TableHead>
              <TableHead className="text-right font-medium text-xs w-[140px]">Activar/Desactivar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {typePermissions.map((permission) => (
              <TableRow key={permission.id} className="hover:bg-muted/10 border-t border-border/20">
                <TableCell className="font-medium text-sm py-3">
                  <div className="flex flex-col">
                    <span>{permission.permission_id}</span>
                    <span className="text-xs text-muted-foreground mt-0.5">ID: {permission.id}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {permission.allowed ? (
                    <div className="flex items-center gap-1.5">
                      <Badge className="bg-green-50 text-green-700 hover:bg-green-100 font-medium shadow-sm">
                        <Check className="h-3.5 w-3.5 mr-1" />
                        Permitido
                      </Badge>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className="text-red-600 border-red-100 bg-red-50 shadow-sm">
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
                    className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
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
