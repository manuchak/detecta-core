
import React from 'react';
import { Permission } from '@/types/roleTypes';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { InfoIcon } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PermissionItem } from './PermissionItem';
import { getPermissionTypeIcon } from '@/utils/permissionUtils';
import * as LucideIcons from 'lucide-react';

interface PermissionTypeGroupProps {
  type: string;
  permissions: Permission[];
  onPermissionChange: (id: string, allowed: boolean) => void; // Fixed: changed from number to string
}

export const PermissionTypeGroup = ({ type, permissions, onPermissionChange }: PermissionTypeGroupProps) => {
  // Get the proper icon component from Lucide
  const iconName = getPermissionTypeIcon(type);
  // @ts-ignore - Dynamic icon component
  const IconComponent = LucideIcons[iconName.charAt(0).toUpperCase() + iconName.slice(1)];

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

  const getTypeTooltip = (type: string) => {
    switch(type.toLowerCase()) {
      case 'page':
        return 'Permisos para acceder a páginas del sistema';
      case 'action':
        return 'Permisos para realizar acciones específicas';
      case 'feature':
        return 'Permisos para usar funcionalidades del sistema';
      default:
        return `Permisos de tipo ${type}`;
    }
  };

  return (
    <div className="mb-6 bg-white rounded-xl p-0 border border-border/30 shadow-sm overflow-hidden">
      <div className="px-4 py-3 bg-muted/20 border-b border-border/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center">
            <IconComponent className="h-4 w-4" />
          </div>
          <Badge variant="outline" className="bg-accent text-accent-foreground font-medium px-3 py-0.5 text-xs">
            {getTypeLabel(type)}
          </Badge>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help ml-1" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">{getTypeTooltip(type)}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Badge variant="outline" className="bg-muted/50 text-muted-foreground">
          {permissions.length} {permissions.length === 1 ? 'permiso' : 'permisos'}
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
            {permissions.map(permission => (
              <PermissionItem 
                key={permission.id}
                permission={permission} 
                onPermissionChange={onPermissionChange} 
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
