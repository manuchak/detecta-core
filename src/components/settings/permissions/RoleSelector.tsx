
import React from 'react';
import { Role } from '@/types/roleTypes';
import { RoleCard } from './RoleCard';

interface RoleSelectorProps {
  roles: Role[];
  selectedRole: Role | null;
  onRoleSelect: (role: Role) => void;
  getPermissionCount: (role: Role) => number;
}

export const RoleSelector = ({ 
  roles, 
  selectedRole, 
  onRoleSelect, 
  getPermissionCount 
}: RoleSelectorProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
          <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
        </div>
        <div>
          <h3 className="font-semibold text-lg">Seleccionar Rol para Configurar</h3>
          <p className="text-sm text-muted-foreground">
            Elija un rol para ver y modificar sus permisos específicos
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {roles.map((role) => (
          <RoleCard
            key={role}
            role={role}
            isSelected={selectedRole === role}
            permissionCount={getPermissionCount(role)}
            onClick={() => onRoleSelect(role)}
          />
        ))}
      </div>
    </div>
  );
};
