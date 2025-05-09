
import React from 'react';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getPermissionTypeIcon } from '@/utils/permissionUtils';
import * as LucideIcons from 'lucide-react';

interface PermissionTypeFilterProps {
  typeFilter: string;
  allPermissionTypes: string[];
  onTypeFilterChange: (type: string) => void;
}

export const PermissionTypeFilter = ({ 
  typeFilter, 
  allPermissionTypes, 
  onTypeFilterChange 
}: PermissionTypeFilterProps) => {
  const renderIconForType = (type: string) => {
    const iconName = getPermissionTypeIcon(type);
    // @ts-ignore - Dynamic icon component
    const IconComponent = LucideIcons[iconName.charAt(0).toUpperCase() + iconName.slice(1)];
    return <IconComponent className="h-4 w-4" />;
  };

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted-foreground">Filtrar por:</span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 gap-1 text-sm">
            {typeFilter === 'all' ? (
              'Todos los tipos'
            ) : (
              <div className="flex items-center gap-1.5">
                {renderIconForType(typeFilter)}
                <span>
                  {typeFilter.charAt(0).toUpperCase() + typeFilter.slice(1)}s
                </span>
              </div>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            className="flex items-center gap-2"
            onClick={() => onTypeFilterChange('all')}
          >
            <FileText className="h-4 w-4" />
            <span>Todos los tipos</span>
          </DropdownMenuItem>
          
          {allPermissionTypes.map(type => (
            <DropdownMenuItem
              key={type}
              className="flex items-center gap-2"
              onClick={() => onTypeFilterChange(type)}
            >
              {renderIconForType(type)}
              <span>{type.charAt(0).toUpperCase() + type.slice(1)}s</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
