
import React from 'react';
import { Role } from '@/types/roleTypes';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Users, Shield } from 'lucide-react';

interface RoleTabsListProps {
  roles: Role[] | undefined;
  activeTab: string;
  onTabChange: (value: string) => void;
  children: React.ReactNode;
  getPermissionCount?: (role: Role) => number;
}

export const RoleTabsList = ({ 
  roles, 
  activeTab, 
  onTabChange,
  children,
  getPermissionCount
}: RoleTabsListProps) => {
  
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
      case 'admin':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      case 'supply_admin':
      case 'monitoring_supervisor':
        return 'bg-amber-100 text-amber-800 hover:bg-amber-200';
      case 'supply':
      case 'soporte':
      case 'bi':
      case 'monitoring':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case 'unverified':
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'owner':
        return 'Propietario';
      case 'admin':
        return 'Administrador';
      case 'supply_admin':
        return 'Admin Suministros';
      case 'monitoring_supervisor':
        return 'Supervisor';
      case 'supply':
        return 'Suministros';
      case 'soporte':
        return 'Soporte';
      case 'bi':
        return 'BI';
      case 'monitoring':
        return 'Monitoreo';
      case 'pending':
        return 'Pendiente';
      case 'unverified':
        return 'Sin verificar';
      default:
        return role;
    }
  };

  return (
    <Tabs defaultValue={activeTab} value={activeTab} onValueChange={onTabChange} className="w-full">
      <div className="mb-4">
        <h3 className="text-lg font-medium mb-2 flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <span>Roles y Permisos</span>
        </h3>
        <p className="text-muted-foreground text-sm mb-3">
          Seleccione un rol para configurar el acceso a las diferentes áreas del sistema
        </p>
      </div>
      <div className="bg-white border border-border/30 rounded-xl p-4 shadow-sm">
        <TabsList className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 bg-muted/50 p-1.5 rounded-xl mb-6">
          {Array.isArray(roles) && roles.slice(0, 5).map((role) => (
            <TabsTrigger 
              key={role} 
              value={role}
              className="data-[state=active]:shadow-sm data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-primary/70 flex items-center justify-center gap-2 py-2.5 transition-all"
            >
              <Badge variant="outline" className={`${getRoleBadgeColor(role)} font-medium px-2.5 py-0.5 truncate`}>
                {getRoleLabel(role)}
              </Badge>
              {getPermissionCount && (
                <span className="ml-1 text-xs bg-muted/80 rounded-full px-1.5 py-0.5">
                  {getPermissionCount(role)}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
        {children}
      </div>
    </Tabs>
  );
};

