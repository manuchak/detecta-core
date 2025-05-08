import React, { useState } from 'react';
import { useRoles, UserWithRole, Role } from '@/hooks/useRoles';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const UserRoleManager = () => {
  const { users, roles, isLoading, error, updateUserRole, verifyUserEmail } = useRoles();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = users?.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.display_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRoleChange = (userId: string, newRole: Role) => {
    updateUserRole.mutate({ userId, role: newRole });
  };

  const handleVerifyEmail = (userId: string) => {
    verifyUserEmail.mutate({ userId });
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
        <CardTitle>Administración de Usuarios y Roles</CardTitle>
        <CardDescription>
          Gestione los roles y permisos de los usuarios del sistema
        </CardDescription>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por email o nombre"
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Creado</TableHead>
                <TableHead>Último acceso</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers && filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{user.display_name}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge className={getRoleBadgeColor(user.role)}>{user.role}</Badge>
                        <Select
                          defaultValue={user.role}
                          onValueChange={(value) => handleRoleChange(user.id, value as Role)}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Seleccionar rol" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.isArray(roles) && roles.map((role) => (
                              <SelectItem key={role} value={role}>{role}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.created_at ? 
                        format(new Date(user.created_at), 'PPp', { locale: es }) : 
                        'N/A'}
                    </TableCell>
                    <TableCell>
                      {user.last_login ? 
                        format(new Date(user.last_login), 'PPp', { locale: es }) : 
                        'Nunca'}
                    </TableCell>
                    <TableCell className="text-right">
                      {user.role === 'unverified' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1"
                          onClick={() => handleVerifyEmail(user.id)}
                        >
                          <CheckCircle className="h-4 w-4" />
                          Verificar Email
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    No hay usuarios que coincidan con la búsqueda
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
