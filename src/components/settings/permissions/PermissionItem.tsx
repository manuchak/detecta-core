
import React from 'react';
import { Permission } from '@/types/roleTypes';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Check, X, Info } from 'lucide-react';
import { getFriendlyPermissionName, getPermissionDescription } from '@/utils/permissionUtils';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface PermissionItemProps {
  permission: Permission;
  onPermissionChange: (id: string, allowed: boolean) => void; // Fixed: changed from number to string
}

export const PermissionItem = ({ permission, onPermissionChange }: PermissionItemProps) => {
  const friendlyName = getFriendlyPermissionName(permission.permission_id);
  const description = getPermissionDescription(permission.permission_type, permission.permission_id);

  // Handler para cambiar el estado del permiso - Fixed: using string ID
  const handleTogglePermission = () => {
    onPermissionChange(permission.id, !permission.allowed);
  };

  return (
    <tr className="hover:bg-muted/20 border-t border-border/20">
      <td className="p-4 text-sm font-medium">
        <div className="flex flex-col">
          <div className="flex items-center gap-1">
            <span className="font-medium text-sm">
              {friendlyName}
            </span>
            {description && (
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p className="max-w-[250px] text-xs">{description}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground mt-0.5 font-mono">
              {permission.permission_id}
            </span>
            <Badge variant="outline" className="text-xs bg-muted/30 text-muted-foreground">
              {permission.permission_type}
            </Badge>
          </div>
        </div>
      </td>
      <td className="p-4 text-center">
        {permission.allowed ? (
          <div className="flex items-center justify-center">
            <Badge className="bg-green-100 text-green-700 hover:bg-green-100 font-medium">
              <Check className="h-3.5 w-3.5 mr-1" />
              Permitido
            </Badge>
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <Badge variant="outline" className="text-red-600 border-red-100 bg-red-50">
              <X className="h-3.5 w-3.5 mr-1" />
              Denegado
            </Badge>
          </div>
        )}
      </td>
      <td className="p-4 text-right">
        <Switch
          checked={permission.allowed}
          onCheckedChange={handleTogglePermission}
          className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
        />
      </td>
    </tr>
  );
};
