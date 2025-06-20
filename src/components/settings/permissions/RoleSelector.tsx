
import React from 'react';
import { Role } from '@/types/roleTypes';
import { Badge } from '@/components/ui/badge';
import { 
  Crown, 
  ShieldCheck, 
  Users, 
  UserCheck, 
  Shield,
  Briefcase
} from 'lucide-react';

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
  const getRoleInfo = (role: Role) => {
    switch (role) {
      case 'owner':
        return { 
          label: 'Propietario', 
          icon: Crown, 
          color: 'bg-purple-50 border-purple-200 hover:bg-purple-100'
        };
      case 'admin':
        return { 
          label: 'Administrador', 
          icon: ShieldCheck, 
          color: 'bg-red-50 border-red-200 hover:bg-red-100'
        };
      case 'supply_admin':
        return { 
          label: 'Admin Supply', 
          icon: UserCheck, 
          color: 'bg-amber-50 border-amber-200 hover:bg-amber-100'
        };
      case 'coordinador_operaciones':
        return { 
          label: 'Coordinador Op.', 
          icon: UserCheck, 
          color: 'bg-orange-50 border-orange-200 hover:bg-orange-100'
        };
      case 'jefe_seguridad':
        return { 
          label: 'Jefe Seguridad', 
          icon: Shield, 
          color: 'bg-red-50 border-red-200 hover:bg-red-100'
        };
      case 'ejecutivo_ventas':
        return { 
          label: 'Ejecutivo Ventas', 
          icon: Briefcase, 
          color: 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100'
        };
      default:
        return { 
          label: role.replace(/_/g, ' '), 
          icon: Users, 
          color: 'bg-gray-50 border-gray-200 hover:bg-gray-100'
        };
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-gray-700 mb-3">Seleccionar Rol</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {roles.map((role) => {
          const roleInfo = getRoleInfo(role);
          const IconComponent = roleInfo.icon;
          const isSelected = selectedRole === role;
          const permissionCount = getPermissionCount(role);
          
          return (
            <button
              key={role}
              onClick={() => onRoleSelect(role)}
              className={`p-3 rounded-lg border-2 transition-all text-left ${
                isSelected 
                  ? 'border-primary bg-primary/5 shadow-sm' 
                  : `border-gray-200 hover:border-gray-300 ${roleInfo.color}`
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <IconComponent className={`h-4 w-4 ${
                  isSelected ? 'text-primary' : 'text-gray-600'
                }`} />
                <span className={`text-sm font-medium ${
                  isSelected ? 'text-primary' : 'text-gray-900'
                }`}>
                  {roleInfo.label}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-xs">
                  {role}
                </Badge>
                <span className="text-xs text-gray-500">
                  {permissionCount}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
