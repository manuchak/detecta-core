
import React from 'react';
import { Role } from '@/types/roleTypes';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Crown, 
  ShieldCheck, 
  Users, 
  UserCheck, 
  Lock,
  Briefcase,
  Shield
} from 'lucide-react';

interface RoleCardProps {
  role: Role;
  isSelected: boolean;
  permissionCount: number;
  onClick: () => void;
}

export const RoleCard = ({ role, isSelected, permissionCount, onClick }: RoleCardProps) => {
  const getRoleInfo = (role: Role) => {
    switch (role) {
      case 'owner':
        return { 
          label: 'Propietario', 
          icon: Crown, 
          description: 'Acceso total al sistema',
          color: 'bg-purple-100 text-purple-800 border-purple-200',
          iconColor: 'text-purple-600'
        };
      case 'admin':
        return { 
          label: 'Administrador', 
          icon: ShieldCheck, 
          description: 'Gestión completa de usuarios y configuración',
          color: 'bg-red-100 text-red-800 border-red-200',
          iconColor: 'text-red-600'
        };
      case 'supply_admin':
        return { 
          label: 'Admin Suministros', 
          icon: UserCheck, 
          description: 'Gestión de cadena de suministros',
          color: 'bg-amber-100 text-amber-800 border-amber-200',
          iconColor: 'text-amber-600'
        };
      case 'coordinador_operaciones':
        return { 
          label: 'Coordinador Operaciones', 
          icon: UserCheck, 
          description: 'Coordinación de operaciones y servicios',
          color: 'bg-orange-100 text-orange-800 border-orange-200',
          iconColor: 'text-orange-600'
        };
      case 'jefe_seguridad':
        return { 
          label: 'Jefe de Seguridad', 
          icon: Shield, 
          description: 'Supervisión completa de seguridad',
          color: 'bg-red-100 text-red-800 border-red-200',
          iconColor: 'text-red-600'
        };
      case 'analista_seguridad':
        return { 
          label: 'Analista de Seguridad', 
          icon: UserCheck, 
          description: 'Análisis y aprobaciones de seguridad',
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          iconColor: 'text-yellow-600'
        };
      case 'supply_lead':
        return { 
          label: 'Lead de Supply', 
          icon: UserCheck, 
          description: 'Gestión de leads y suministros',
          color: 'bg-green-100 text-green-800 border-green-200',
          iconColor: 'text-green-600'
        };
      case 'ejecutivo_ventas':
        return { 
          label: 'Ejecutivo de Ventas', 
          icon: Briefcase, 
          description: 'Creación y gestión de servicios y leads',
          color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
          iconColor: 'text-indigo-600'
        };
      case 'custodio':
        return { 
          label: 'Custodio', 
          icon: Users, 
          description: 'Portal de evaluaciones e información personal',
          color: 'bg-teal-100 text-teal-800 border-teal-200',
          iconColor: 'text-teal-600'
        };
      case 'instalador':
        return { 
          label: 'Instalador', 
          icon: Users, 
          description: 'Control y registro de instalaciones',
          color: 'bg-cyan-100 text-cyan-800 border-cyan-200',
          iconColor: 'text-cyan-600'
        };
      case 'bi':
        return { 
          label: 'Business Intelligence', 
          icon: Users, 
          description: 'Acceso a reportes y análisis',
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          iconColor: 'text-blue-600'
        };
      case 'monitoring_supervisor':
        return { 
          label: 'Supervisor Monitoreo', 
          icon: Lock, 
          description: 'Supervisión de operaciones de monitoreo',
          color: 'bg-amber-100 text-amber-800 border-amber-200',
          iconColor: 'text-amber-600'
        };
      case 'monitoring':
        return { 
          label: 'Monitoreo', 
          icon: Users, 
          description: 'Operaciones de monitoreo básico',
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          iconColor: 'text-blue-600'
        };
      case 'supply':
        return { 
          label: 'Suministros', 
          icon: Users, 
          description: 'Gestión básica de suministros',
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          iconColor: 'text-blue-600'
        };
      case 'soporte':
        return { 
          label: 'Soporte', 
          icon: Users, 
          description: 'Asistencia técnica y atención al cliente',
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          iconColor: 'text-blue-600'
        };
      case 'pending':
        return { 
          label: 'Pendiente', 
          icon: Users, 
          description: 'Usuario pendiente de asignación de rol',
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          iconColor: 'text-yellow-600'
        };
      case 'unverified':
        return { 
          label: 'No Verificado', 
          icon: Users, 
          description: 'Usuario sin verificar',
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          iconColor: 'text-gray-600'
        };
      default:
        return { 
          label: role, 
          icon: Users, 
          description: 'Rol del sistema',
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          iconColor: 'text-gray-600'
        };
    }
  };

  const roleInfo = getRoleInfo(role);
  const IconComponent = roleInfo.icon;

  return (
    <Card 
      className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
        isSelected 
          ? 'ring-2 ring-primary shadow-lg bg-primary/5' 
          : 'hover:shadow-sm'
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`h-10 w-10 rounded-lg ${roleInfo.color} flex items-center justify-center`}>
            <IconComponent className={`h-5 w-5 ${roleInfo.iconColor}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-sm truncate">{roleInfo.label}</h3>
              {isSelected && (
                <Badge variant="default" className="text-xs">
                  Seleccionado
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
              {roleInfo.description}
            </p>
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-xs">
                {role}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {permissionCount} permiso{permissionCount !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
