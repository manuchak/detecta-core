
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit, Trash } from 'lucide-react';
import { Role } from '@/types/roleTypes';
import { RoleBadge } from './RoleBadge';

interface RolesTableProps {
  filteredRoles: Role[] | undefined;
  handleEditRole: (role: Role) => void;
  handleDeleteRole: (role: Role) => void;
}

export const RolesTable: React.FC<RolesTableProps> = ({
  filteredRoles,
  handleEditRole,
  handleDeleteRole
}) => {
  const isSystemRole = (role: string) => ['admin', 'owner', 'unverified', 'pending'].includes(role);

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre del Rol</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredRoles && filteredRoles.length > 0 ? (
            filteredRoles.map((role) => (
              <TableRow key={role}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <RoleBadge role={role} />
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEditRole(role)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    {/* Only allow deleting custom roles, not system roles */}
                    {!isSystemRole(role) && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-destructive"
                        onClick={() => handleDeleteRole(role)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={2} className="text-center">
                No hay roles que coincidan con la búsqueda
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
