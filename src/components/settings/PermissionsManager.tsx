
import React, { useState } from 'react';
import { useRoles, Role } from '@/hooks/useRoles';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, PlusCircle } from 'lucide-react';

export const PermissionsManager = () => {
  const { roles, permissions, isLoading, updatePermission, addPermission } = useRoles();
  const [activeTab, setActiveTab] = useState<string>('admin');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newPermission, setNewPermission] = useState({
    role: 'admin' as Role,
    permissionType: '',
    permissionId: '',
    allowed: true
  });

  const handlePermissionChange = (id: number, allowed: boolean) => {
    updatePermission.mutate({ id, allowed });
  };

  const handleAddPermission = () => {
    addPermission.mutate({
      role: newPermission.role,
      permissionType: newPermission.permissionType,
      permissionId: newPermission.permissionId,
      allowed: newPermission.allowed
    });
    setIsDialogOpen(false);
    setNewPermission({
      role: 'admin' as Role,
      permissionType: '',
      permissionId: '',
      allowed: true
    });
  };

  const groupPermissionsByType = (rolePermissions: any[] = []) => {
    const grouped: Record<string, any[]> = {};
    
    rolePermissions.forEach(permission => {
      const type = permission.permission_type;
      if (!grouped[type]) {
        grouped[type] = [];
      }
      grouped[type].push(permission);
    });
    
    return grouped;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Gestión de Permisos</CardTitle>
          <CardDescription>
            Configure los permisos para cada rol en el sistema
          </CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="flex items-center gap-1">
              <PlusCircle className="h-4 w-4" />
              Agregar Permiso
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar Nuevo Permiso</DialogTitle>
              <DialogDescription>
                Complete la información para crear un nuevo permiso
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="role" className="text-right">
                  Rol
                </Label>
                <Select
                  value={newPermission.role}
                  onValueChange={(value) => 
                    setNewPermission({ ...newPermission, role: value as Role })
                  }
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Seleccionar rol" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles?.map((role) => (
                      <SelectItem key={role} value={role}>{role}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="permissionType" className="text-right">
                  Tipo
                </Label>
                <Input
                  id="permissionType"
                  placeholder="page, action, feature"
                  className="col-span-3"
                  value={newPermission.permissionType}
                  onChange={(e) => 
                    setNewPermission({ ...newPermission, permissionType: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="permissionId" className="text-right">
                  Identificador
                </Label>
                <Input
                  id="permissionId"
                  placeholder="settings, create_user"
                  className="col-span-3"
                  value={newPermission.permissionId}
                  onChange={(e) => 
                    setNewPermission({ ...newPermission, permissionId: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="allowed" className="text-right">
                  Permitido
                </Label>
                <div className="col-span-3">
                  <Switch
                    id="allowed"
                    checked={newPermission.allowed}
                    onCheckedChange={(checked) => 
                      setNewPermission({ ...newPermission, allowed: checked })
                    }
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddPermission}>Guardar Permiso</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="admin" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-5 mb-4">
            {roles?.slice(0, 5).map((role) => (
              <TabsTrigger key={role} value={role}>{role}</TabsTrigger>
            ))}
          </TabsList>
          {roles?.map((role) => (
            <TabsContent key={role} value={role}>
              {permissions && permissions[role] ? (
                Object.entries(groupPermissionsByType(permissions[role])).map(([type, typePermissions]) => (
                  <div key={type} className="mb-6">
                    <h3 className="text-lg font-medium mb-2 flex items-center">
                      <Badge variant="outline" className="mr-2">{type}</Badge>
                      Permisos
                    </h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Identificador</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {typePermissions.map((permission) => (
                          <TableRow key={permission.id}>
                            <TableCell>{permission.permission_id}</TableCell>
                            <TableCell>
                              {permission.allowed ? (
                                <Badge className="bg-green-500">Permitido</Badge>
                              ) : (
                                <Badge variant="outline" className="text-red-500">
                                  Denegado
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <Switch
                                checked={permission.allowed}
                                onCheckedChange={(checked) => 
                                  handlePermissionChange(permission.id, checked)
                                }
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ))
              ) : (
                <div className="text-center p-4 border rounded-md">
                  No hay permisos configurados para este rol.
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};
