
import React from 'react';
import { Role } from '@/types/roleTypes';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Users, Shield, LucideIcon } from 'lucide-react';

interface RoleInfo {
  label: string;
  icon: LucideIcon;
  description: string;
  color: string;
}

interface RoleTabsListProps {
  roles: Role[] | undefined;
  activeTab: string;
  onTabChange: (value: string) => void;
  children: React.ReactNode;
  getPermissionCount?: (role: Role) => number;
  getRoleInfo?: (role: Role) => RoleInfo;
}

export const RoleTabsList = ({ 
  roles, 
  activeTab, 
  onTabChange,
  children,
  getPermissionCount,
  getRoleInfo
}: RoleTabsListProps) => {
  
  const defaultRoleInfo = (role: string): RoleInfo => {
    switch (role) {
      case 'owner':
        return {
          label: 'Propietario',
          icon: Shield,
          description: 'Acceso total',
          color: 'bg-purple-100 text-purple-800 hover:bg-purple-200'
        };
      case 'admin':
        return {
          label: 'Administrador',
          icon: Shield,
          description: 'Gestión completa',
          color: 'bg-red-100 text-red-800 hover:bg-red-200'
        };
      case 'supply_admin':
        return {
          label: 'Admin Suministros',
          icon: Users,
          description: 'Gestión suministros',
          color: 'bg-amber-100 text-amber-800 hover:bg-amber-200'
        };
      case 'monitoring_supervisor':
        return {
          label: 'Supervisor',
          icon: Users,
          description: 'Supervisión',
          color: 'bg-amber-100 text-amber-800 hover:bg-amber-200'
        };
      case 'supply':
        return {
          label: 'Suministros',
          icon: Users,
          description: 'Operaciones',
          color: 'bg-blue-100 text-blue-800 hover:bg-blue-200'
        };
      case 'soporte':
        return {
          label: 'Soporte',
          icon: Users,
          description: 'Asistencia',
          color: 'bg-blue-100 text-blue-800 hover:bg-blue-200'
        };
      case 'bi':
        return {
          label: 'BI',
          icon: Users,
          description: 'Análisis',
          color: 'bg-blue-100 text-blue-800 hover:bg-blue-200'
        };
      case 'monitoring':
        return {
          label: 'Monitoreo',
          icon: Users,
          description: 'Operaciones',
          color: 'bg-blue-100 text-blue-800 hover:bg-blue-200'
        };
      case 'pending':
        return {
          label: 'Pendiente',
          icon: Users,
          description: 'Sin asignar',
          color: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
        };
      case 'unverified':
        return {
          label: 'Sin verificar',
          icon: Users,
          description: 'No verificado',
          color: 'bg-gray-100 text-gray-800 hover:bg-gray-200'
        };
      default:
        return {
          label: role,
          icon: Users,
          description: 'Rol del sistema',
          color: 'bg-gray-100 text-gray-800 hover:bg-gray-200'
        };
    }
  };

  const getInfo = getRoleInfo || defaultRoleInfo;

  return (
    <Tabs defaultValue={activeTab} value={activeTab} onValueChange={onTabChange} className="w-full">
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <span>Seleccionar Rol para Configurar</span>
        </h3>
        <p className="text-muted-foreground text-sm mb-4">
          Elija un rol para ver y modificar sus permisos específicos
        </p>
      </div>
      
      <div className="bg-white border border-border/30 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 bg-gradient-to-r from-muted/20 to-muted/10 border-b border-border/30">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 bg-muted/50 p-1.5 rounded-xl">
            {Array.isArray(roles) && roles.slice(0, 5).map((role) => {
              const roleInfo = getInfo(role);
              const IconComponent = roleInfo.icon;
              
              return (
                <TabsTrigger 
                  key={role} 
                  value={role}
                  className="data-[state=active]:shadow-sm data-[state=active]:bg-background data-[state=active]:border-2 data-[state=active]:border-primary/30 flex flex-col items-center justify-center gap-1.5 py-3 px-2 transition-all hover:scale-105"
                >
                  <div className="flex items-center gap-2">
                    <IconComponent className="h-4 w-4" />
                    <Badge variant="outline" className={`${roleInfo.color} font-medium px-2 py-0.5 text-xs truncate max-w-[100px]`}>
                      {roleInfo.label}
                    </Badge>
                  </div>
                  {getPermissionCount && (
                    <div className="flex items-center gap-1">
                      <span className="text-xs bg-muted/80 rounded-full px-1.5 py-0.5 font-medium">
                        {getPermissionCount(role)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        perm.
                      </span>
                    </div>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>
        
        <div className="p-6">
          {children}
        </div>
      </div>
    </Tabs>
  );
};
