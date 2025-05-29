
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
import { Check, X, ShieldCheck, File, Folder, Key } from 'lucide-react';

interface PermissionsListProps {
  type: string;
  typePermissions: Permission[];
  onPermissionChange: (id: string, allowed: boolean) => void; // Fixed: changed from number to string
}

export const PermissionsList = ({ 
  type, 
  typePermissions, 
  onPermissionChange 
}: PermissionsListProps) => {

  // Función para obtener icono según el tipo de permiso
  const getPermissionIcon = (type: string) => {
    switch(type.toLowerCase()) {
      case 'page':
      case 'pages':
      case 'pagina':
      case 'paginas':
        return <File className="h-4 w-4 text-blue-600" />;
      case 'admin':
      case 'administration':
        return <Key className="h-4 w-4 text-red-600" />;
      case 'module':
      case 'modules':
      case 'modulo':
      case 'modulos':
        return <Folder className="h-4 w-4 text-amber-600" />;
      default:
        return <ShieldCheck className="h-4 w-4 text-primary" />;
    }
  };

  // Función para formatear el identificador del permiso
  const formatPermissionId = (permissionId: string): string => {
    // Reemplazar guiones bajos y barras por espacios
    const formatted = permissionId
      .replace(/_/g, ' ')
      .replace(/\//g, ' / ')
      .replace(/\./g, ' • ');
    
    // Convertir primera letra de cada palabra a mayúscula
    return formatted
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Función para obtener la descripción según el tipo de permiso
  const getPermissionDescription = (type: string, permissionId: string) => {
    if (type.toLowerCase().includes('page') || type.toLowerCase().includes('pagina')) {
      return `Acceso a la página ${formatPermissionId(permissionId)}`;
    } else if (type.toLowerCase().includes('admin')) {
      return `Administrar ${formatPermissionId(permissionId)}`;
    } else if (type.toLowerCase().includes('action') || permissionId.includes('crear') || permissionId.includes('editar') || permissionId.includes('eliminar')) {
      return `Realizar acción: ${formatPermissionId(permissionId)}`;
    }
    return `Permiso: ${formatPermissionId(permissionId)}`;
  };

  const getTypeLabel = (type: string) => {
    switch(type.toLowerCase()) {
      case 'page':
      case 'pages':
        return 'Páginas';
      case 'action':
      case 'actions':
        return 'Acciones';
      case 'admin':
      case 'administration':
        return 'Administración';
      case 'module':
      case 'modules':
        return 'Módulos';
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  return (
    <div key={type} className="mb-6 bg-white rounded-xl p-0 border border-border/30 shadow-sm overflow-hidden">
      <div className="px-4 py-3 bg-muted/20 border-b border-border/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getPermissionIcon(type)}
          <Badge variant="outline" className="bg-accent text-accent-foreground font-medium px-3 py-0.5 text-xs">
            {getTypeLabel(type)}
          </Badge>
        </div>
        <Badge variant="outline" className="bg-muted/50 text-muted-foreground">
          {typePermissions.length} {typePermissions.length === 1 ? 'permiso' : 'permisos'}
        </Badge>
      </div>
      <div className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/10 hover:bg-transparent">
              <TableHead className="font-medium text-xs">Acceso/Funcionalidad</TableHead>
              <TableHead className="font-medium text-xs w-[140px] text-center">Estado</TableHead>
              <TableHead className="text-right font-medium text-xs w-[120px]">Habilitar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {typePermissions.map((permission) => (
              <TableRow key={permission.id} className="hover:bg-muted/10 border-t border-border/20">
                <TableCell className="py-3">
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">
                      {formatPermissionId(permission.permission_id)}
                    </span>
                    <span className="text-xs text-muted-foreground mt-0.5">
                      {getPermissionDescription(permission.permission_type, permission.permission_id)}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  {permission.allowed ? (
                    <div className="flex items-center justify-center">
                      <Badge className="bg-green-50 text-green-700 hover:bg-green-100 font-medium shadow-sm">
                        <Check className="h-3.5 w-3.5 mr-1" />
                        Permitido
                      </Badge>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
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
                      onPermissionChange(permission.id, checked) // Fixed: using string ID
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
