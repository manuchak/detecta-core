
import React, { useState } from 'react';
import { useRoles } from '@/hooks/useRoles';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Search, PlusCircle, Edit, Trash, Save } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Role } from '@/types/roleTypes';

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

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-500 hover:bg-purple-600';
      case 'admin':
        return 'bg-red-500 hover:bg-red-600';
      case 'supply_admin':
      case 'monitoring_supervisor':
        return 'bg-amber-500 hover:bg-amber-600';
      case 'supply':
      case 'soporte':
      case 'bi':
      case 'monitoring':
        return 'bg-blue-500 hover:bg-blue-600';
      case 'pending':
        return 'bg-yellow-500 hover:bg-yellow-600';
      case 'unverified':
      default:
        return 'bg-gray-500 hover:bg-gray-600';
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
        <div className="flex justify-between items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar roles"
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button 
            onClick={handleCreateRole}
            className="ml-4"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Nuevo Rol
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre del Rol</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRoles && filteredRoles.length > 0 ? (
                filteredRoles.map((role) => (
                  <TableRow key={role}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge className={getRoleBadgeColor(role)}>{role}</Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditRole(role)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {/* Only allow deleting custom roles, not system roles */}
                        {!['admin', 'owner', 'unverified', 'pending'].includes(role) && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-destructive"
                            onClick={() => handleDeleteRole(role)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={2} className="text-center">
                    No hay roles que coincidan con la búsqueda
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Role Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {currentRole.id ? 'Editar Rol' : 'Crear Nuevo Rol'}
              </DialogTitle>
              <DialogDescription>
                {currentRole.id 
                  ? 'Modifique el nombre del rol existente.'
                  : 'Ingrese un nombre único para el nuevo rol.'
                }
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="role-name" className="text-sm font-medium">
                  Nombre del Rol
                </label>
                <Input
                  id="role-name"
                  value={currentRole.name}
                  onChange={(e) => setCurrentRole(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ingrese nombre del rol"
                  disabled={currentRole.id && ['admin', 'owner', 'unverified', 'pending'].includes(currentRole.id)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveRole} disabled={!currentRole.name.trim()}>
                <Save className="h-4 w-4 mr-2" />
                Guardar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Role Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Eliminar Rol</DialogTitle>
              <DialogDescription>
                ¿Está seguro que desea eliminar el rol "{roleToDelete}"? Esta acción no se puede deshacer.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleConfirmDelete}>
                Eliminar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default RoleManager;
