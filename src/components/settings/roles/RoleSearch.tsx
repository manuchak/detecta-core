
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, PlusCircle } from 'lucide-react';

interface RoleSearchProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onCreateRole: () => void;
}

export const RoleSearch: React.FC<RoleSearchProps> = ({
  searchTerm,
  onSearchChange,
  onCreateRole
}) => {
  return (
    <div className="flex justify-between items-center">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar roles"
          className="pl-8"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <Button 
        onClick={onCreateRole}
        className="ml-4"
      >
        <PlusCircle className="h-4 w-4 mr-2" />
        Nuevo Rol
      </Button>
    </div>
  );
};
