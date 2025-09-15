import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Shield, User, Eye, Edit, Settings, AlertTriangle, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import type { Role } from '@/types/roleTypes';

interface RolePermissionMatrix {
  role: Role;
  permissions: {
    canViewDashboard: boolean;
    canViewLeads: boolean;
    canEditLeads: boolean;
    canManageUsers: boolean;
  };
  description: string;
  icon: React.ReactNode;
}

const EXPECTED_PERMISSIONS: RolePermissionMatrix[] = [
  {
    role: 'admin',
    permissions: { canViewDashboard: true, canViewLeads: true, canEditLeads: true, canManageUsers: true },
    description: 'Acceso completo al sistema',
    icon: <Settings className="h-4 w-4" />
  },
  {
    role: 'owner',
    permissions: { canViewDashboard: true, canViewLeads: true, canEditLeads: true, canManageUsers: true },
    description: 'Propietario con acceso completo',
    icon: <Shield className="h-4 w-4" />
  },
  {
    role: 'supply_admin',
    permissions: { canViewDashboard: true, canViewLeads: true, canEditLeads: true, canManageUsers: false },
    description: 'Administrador de supply con permisos de edición',
    icon: <User className="h-4 w-4" />
  },
  {
    role: 'supply_lead',
    permissions: { canViewDashboard: true, canViewLeads: true, canEditLeads: true, canManageUsers: false },
    description: 'Líder de supply con permisos de edición',
    icon: <Edit className="h-4 w-4" />
  },
  {
    role: 'ejecutivo_ventas',
    permissions: { canViewDashboard: false, canViewLeads: true, canEditLeads: true, canManageUsers: false },
    description: 'Ejecutivo de ventas - solo leads',
    icon: <User className="h-4 w-4" />
  },
  {
    role: 'supply',
    permissions: { canViewDashboard: false, canViewLeads: true, canEditLeads: false, canManageUsers: false },
    description: 'Supply básico - solo visualización',
    icon: <Eye className="h-4 w-4" />
  }
];

const PermissionValidator: React.FC = () => {
  const { user, userRole, permissions } = useAuth();
  const [validationResults, setValidationResults] = useState<{
    isValid: boolean;
    mismatches: string[];
    expectedRole?: RolePermissionMatrix;
  } | null>(null);

  useEffect(() => {
    if (userRole && permissions) {
      validatePermissions();
    }
  }, [userRole, permissions]);

  const validatePermissions = () => {
    const expectedRole = EXPECTED_PERMISSIONS.find(r => r.role === userRole);
    
    if (!expectedRole) {
      setValidationResults({
        isValid: false,
        mismatches: [`Rol desconocido: ${userRole}`],
      });
      return;
    }

    const mismatches: string[] = [];
    
    // Comparar cada permiso
    Object.entries(expectedRole.permissions).forEach(([permission, expected]) => {
      const actual = permissions[permission as keyof typeof permissions];
      if (actual !== expected) {
        mismatches.push(
          `${permission}: esperado ${expected}, actual ${actual}`
        );
      }
    });

    setValidationResults({
      isValid: mismatches.length === 0,
      mismatches,
      expectedRole
    });
  };

  const getPermissionIcon = (hasPermission: boolean) => {
    return hasPermission ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <AlertTriangle className="h-4 w-4 text-gray-400" />
    );
  };

  const getValidationBadge = () => {
    if (!validationResults) return null;
    
    return (
      <Badge 
        variant={validationResults.isValid ? "default" : "destructive"}
        className="ml-2"
      >
        {validationResults.isValid ? "Válido" : "Inconsistente"}
      </Badge>
    );
  };

  if (!user || !userRole) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Validador de Permisos
          </CardTitle>
          <CardDescription>Usuario no autenticado</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Validador de Permisos
          {getValidationBadge()}
        </CardTitle>
        <CardDescription>
          Validación de permisos para el rol actual: {userRole}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Información del usuario actual */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <User className="h-4 w-4" />
            <span className="font-medium">Usuario Actual</span>
          </div>
          <div className="text-sm space-y-1">
            <div>Email: {user.email}</div>
            <div>Rol: {userRole}</div>
          </div>
        </div>

        <Separator />

        {/* Permisos actuales */}
        <div>
          <h4 className="font-medium mb-3">Permisos Actuales</h4>
          <div className="grid grid-cols-2 gap-3">
            {permissions && Object.entries(permissions).map(([permission, hasPermission]) => (
              <div key={permission} className="flex items-center gap-2 p-2 border rounded">
                {getPermissionIcon(hasPermission)}
                <span className="text-sm">{permission}</span>
                <Badge variant={hasPermission ? "default" : "outline"} className="ml-auto">
                  {hasPermission ? "Sí" : "No"}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Resultados de validación */}
        {validationResults && (
          <>
            <Separator />
            <div>
              <h4 className="font-medium mb-3">Validación de Permisos</h4>
              
              {validationResults.isValid ? (
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-green-800">Los permisos coinciden con lo esperado para el rol {userRole}</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <span className="text-red-800">Se encontraron inconsistencias en los permisos</span>
                  </div>
                  <div className="space-y-1">
                    {validationResults.mismatches.map((mismatch, index) => (
                      <div key={index} className="text-sm text-red-600 pl-4">
                        • {mismatch}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {validationResults.expectedRole && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    {validationResults.expectedRole.icon}
                    <span className="font-medium">Permisos Esperados</span>
                  </div>
                  <div className="text-sm text-blue-800">
                    {validationResults.expectedRole.description}
                  </div>
                  <div className="mt-2 space-y-1 text-sm">
                    {Object.entries(validationResults.expectedRole.permissions).map(([permission, expected]) => (
                      <div key={permission} className="flex justify-between">
                        <span>{permission}:</span>
                        <Badge variant={expected ? "default" : "outline"}>
                          {expected ? "Sí" : "No"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Matriz completa de permisos */}
        <Separator />
        <div>
          <h4 className="font-medium mb-3">Matriz de Permisos por Rol</h4>
          <div className="space-y-2">
            {EXPECTED_PERMISSIONS.map((roleMatrix) => (
              <div 
                key={roleMatrix.role}
                className={`p-3 border rounded-lg ${
                  roleMatrix.role === userRole ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {roleMatrix.icon}
                  <span className="font-medium capitalize">{roleMatrix.role}</span>
                  {roleMatrix.role === userRole && (
                    <Badge variant="default">Actual</Badge>
                  )}
                </div>
                <div className="text-xs text-gray-600 mb-2">{roleMatrix.description}</div>
                <div className="flex gap-2 flex-wrap">
                  {Object.entries(roleMatrix.permissions).map(([permission, hasPermission]) => (
                    <Badge 
                      key={permission} 
                      variant={hasPermission ? "default" : "outline"}
                      className="text-xs"
                    >
                      {permission}: {hasPermission ? "✓" : "✗"}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PermissionValidator;