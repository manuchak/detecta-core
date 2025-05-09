
import React, { useState } from 'react';
import { useRoles } from '@/hooks/useRoles';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Role } from '@/types/roleTypes';
import { RoleSearch } from './RoleSearch';
import { RolesTable } from './RolesTable';
import { RoleDialog } from './RoleDialog';
import { DeleteRoleDialog } from './DeleteRoleDialog';

export const RoleManager = () => {
  const { roles, isLoading, error, createRole, updateRole, deleteRole } = useRoles();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState<{ id?: string, name: string, description: string }>({
    name: '',
    description: ''
  });
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const { toast } = useToast();

  // Filter roles based on search term
  const filteredRoles = roles?.filter(role => 
    role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateRole = () => {
    setCurrentRole({ name: '', description: '' });
    setIsDialogOpen(true);
  };

  const handleEditRole = (role: Role) => {
    setCurrentRole({ 
      id: role,
      name: role, 
      description: '' // In a real app, you would fetch the description from the database
    });
    setIsDialogOpen(true);
  };

  const handleDeleteRole = (role: Role) => {
    setRoleToDelete(role);
    setIsDeleteDialogOpen(true);
  };

  const handleSaveRole = () => {
    try {
      if (currentRole.id) {
        // Update existing role
        updateRole.mutate({
          oldRole: currentRole.id as Role,
          newRole: currentRole.name as Role
        });
      } else {
        // Create new role
        createRole.mutate({
          role: currentRole.name as Role
        });
      }
      setIsDialogOpen(false);
      
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar el rol",
        variant: "destructive",
      });
    }
  };

  const handleConfirmDelete = () => {
    if (roleToDelete) {
      deleteRole.mutate({ role: roleToDelete });
      setIsDeleteDialogOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-destructive p-4 border border-destructive rounded-md">
        Error: {error instanceof Error ? error.message : 'Unknown error'}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Administración de Roles</CardTitle>
        <CardDescription>
          Gestione los roles disponibles en el sistema
        </CardDescription>
        <RoleSearch 
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onCreateRole={handleCreateRole}
        />
      </CardHeader>
      <CardContent>
        <RolesTable 
          filteredRoles={filteredRoles}
          handleEditRole={handleEditRole}
          handleDeleteRole={handleDeleteRole}
        />

        {/* Role Create/Edit Dialog */}
        <RoleDialog 
          isOpen={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          currentRole={currentRole}
          onSave={handleSaveRole}
          setCurrentRole={setCurrentRole}
        />

        {/* Role Delete Confirmation Dialog */}
        <DeleteRoleDialog 
          isOpen={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          roleToDelete={roleToDelete}
          onConfirmDelete={handleConfirmDelete}
        />
      </CardContent>
    </Card>
  );
};

export default RoleManager;
