
import React from 'react';
import { Role, Permission } from '@/types/roleTypes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PermissionToggle } from './PermissionToggle';
import { PlusCircle, Crown, ShieldCheck, Users, UserCheck, Shield } from 'lucide-react';

interface PermissionsPanelProps {
  selectedRole: Role;
  permissions: Permission[];
  onPermissionToggle: (id: string, allowed: boolean) => void;
  onAddPermission: () => void;
}

export const PermissionsPanel = ({ 
  selectedRole, 
  permissions, 
  onPermissionToggle, 
  onAddPermission 
}: PermissionsPanelProps) => {
  const getRoleInfo = (role: Role) => {
    switch (role) {
      case 'owner':
        return { 
          label: 'Propietario', 
          icon: Crown, 
          description: 'Acceso total al sistema',
          color: 'bg-purple-100 text-purple-800 border-purple-200'
        };
      case 'admin':
        return { 
          label: 'Administrador', 
          icon: ShieldCheck, 
          description: 'Gestión completa de usuarios y configuración',
          color: 'bg-red-100 text-red-800 border-red-200'
        };
      case 'supply_admin':
        return { 
          label: 'Admin Suministros', 
          icon: UserCheck, 
          description: 'Gestión de cadena de suministros',
          color: 'bg-amber-100 text-amber-800 border-amber-200'
        };
      case 'coordinador_operaciones':
        return { 
          label: 'Coordinador Operaciones', 
          icon: UserCheck, 
          description: 'Coordinación de operaciones y servicios',
          color: 'bg-orange-100 text-orange-800 border-orange-200'
        };
      case 'jefe_seguridad':
        return { 
          label: 'Jefe de Seguridad', 
          icon: Shield, 
          description: 'Supervisión completa de seguridad',
          color: 'bg-red-100 text-red-800 border-red-200'
        };
      case 'analista_seguridad':
        return { 
          label: 'Analista de Seguridad', 
          icon: UserCheck, 
          description: 'Análisis y aprobaciones de seguridad',
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200'
        };
      case 'supply_lead':
        return { 
          label: 'Lead de Supply', 
          icon: UserCheck, 
          description: 'Gestión de leads y suministros',
          color: 'bg-green-100 text-green-800 border-green-200'
        };
      case 'ejecutivo_ventas':
        return { 
          label: 'Ejecutivo de Ventas', 
          icon: UserCheck, 
          description: 'Creación y gestión de servicios y leads',
          color: 'bg-indigo-100 text-indigo-800 border-indigo-200'
        };
      case 'custodio':
        return { 
          label: 'Custodio', 
          icon: Users, 
          description: 'Portal de evaluaciones e información personal',
          color: 'bg-teal-100 text-teal-800 border-teal-200'
        };
      case 'instalador':
        return { 
          label: 'Instalador', 
          icon: Users, 
          description: 'Control y registro de instalaciones',
          color: 'bg-cyan-100 text-cyan-800 border-cyan-200'
        };
      case 'bi':
        return { 
          label: 'Business Intelligence', 
          icon: Users, 
          description: 'Acceso a reportes y análisis',
          color: 'bg-blue-100 text-blue-800 border-blue-200'
        };
      case 'monitoring_supervisor':
        return { 
          label: 'Supervisor Monitoreo', 
          icon: UserCheck, 
          description: 'Supervisión de operaciones de monitoreo',
          color: 'bg-amber-100 text-amber-800 border-amber-200'
        };
      case 'monitoring':
        return { 
          label: 'Monitoreo', 
          icon: Users, 
          description: 'Operaciones de monitoreo básico',
          color: 'bg-blue-100 text-blue-800 border-blue-200'
        };
      case 'supply':
        return { 
          label: 'Suministros', 
          icon: Users, 
          description: 'Gestión básica de suministros',
          color: 'bg-blue-100 text-blue-800 border-blue-200'
        };
      case 'soporte':
        return { 
          label: 'Soporte', 
          icon: Users, 
          description: 'Asistencia técnica y atención al cliente',
          color: 'bg-blue-100 text-blue-800 border-blue-200'
        };
      case 'pending':
        return { 
          label: 'Pendiente', 
          icon: Users, 
          description: 'Usuario pendiente de asignación de rol',
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200'
        };
      case 'unverified':
        return { 
          label: 'No Verificado', 
          icon: Users, 
          description: 'Usuario sin verificar',
          color: 'bg-gray-100 text-gray-800 border-gray-200'
        };
      default:
        return { 
          label: selectedRole, 
          icon: Users, 
          description: 'Rol del sistema',
          color: 'bg-gray-100 text-gray-800 border-gray-200'
        };
    }
  };

  const roleInfo = getRoleInfo(selectedRole);
  const IconComponent = roleInfo.icon;

  // Agrupar permisos por tipo
  const groupedPermissions = permissions.reduce((acc, permission) => {
    const type = permission.permission_type;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  const getTypeLabel = (type: string) => {
    const labels = {
      'page': 'Páginas',
      'action': 'Acciones',
      'module': 'Módulos',
      'admin': 'Administración',
      'feature': 'Funciones',
      'report': 'Reportes',
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      {/* Header del Rol */}
      <Card className="border-border/40">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`h-12 w-12 rounded-lg ${roleInfo.color} flex items-center justify-center`}>
                <IconComponent className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  {roleInfo.label}
                  <Badge variant="outline" className={roleInfo.color}>
                    {selectedRole}
                  </Badge>
                </CardTitle>
                <p className="text-sm text-muted-foreground">{roleInfo.description}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{permissions.length}</div>
              <div className="text-sm text-muted-foreground">permisos</div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Botón Añadir Permiso */}
      <div className="flex justify-end">
        <Button onClick={onAddPermission} className="flex items-center gap-2">
          <PlusCircle className="h-4 w-4" />
          Añadir Permiso
        </Button>
      </div>

      {/* Lista de Permisos Agrupados */}
      {Object.keys(groupedPermissions).length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <ShieldCheck className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No hay permisos configurados</h3>
            <p className="text-muted-foreground mb-6">
              Este rol no tiene permisos asignados. Añada permisos para configurar el acceso.
            </p>
            <Button onClick={onAddPermission} className="flex items-center gap-2">
              <PlusCircle className="h-4 w-4" />
              Añadir Primer Permiso
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedPermissions).map(([type, typePermissions]) => (
            <Card key={type} className="border-border/40">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  {getTypeLabel(type)}
                  <Badge variant="secondary" className="text-xs">
                    {typePermissions.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {typePermissions.map((permission) => (
                  <PermissionToggle
                    key={permission.id}
                    permission={permission}
                    onToggle={onPermissionToggle}
                  />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
