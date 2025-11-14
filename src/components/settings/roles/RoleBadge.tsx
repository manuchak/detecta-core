
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Role } from '@/types/roleTypes';

export const getRoleBadgeColor = (role: string) => {
  switch (role) {
    case 'owner':
      return 'bg-purple-500 hover:bg-purple-600';
    case 'admin':
      return 'bg-red-500 hover:bg-red-600';
    case 'supply_admin':
    case 'supply_lead':
    case 'monitoring_supervisor':
      return 'bg-amber-500 hover:bg-amber-600';
    case 'planificador':
      return 'bg-green-500 hover:bg-green-600';
    case 'supply':
    case 'soporte':
    case 'bi':
    case 'monitoring':
      return 'bg-blue-500 hover:bg-blue-600';
    case 'pending':
      return 'bg-yellow-500 hover:bg-yellow-600';
    case 'unverified':
    default:
      return 'bg-gray-500 hover:bg-gray-600';
  }
};

interface RoleBadgeProps {
  role: Role;
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role }) => {
  return (
    <Badge className={getRoleBadgeColor(role)}>
      {role}
    </Badge>
  );
};
