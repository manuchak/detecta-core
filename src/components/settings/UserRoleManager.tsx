
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Search, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const UserRoleManager = () => {
  const { users, roles, isLoading, error, updateUserRole, verifyUserEmail } = useRoles();
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      window.location.reload();
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setIsRefreshing(false);
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
      case 'coordinador_operaciones':
      case 'jefe_seguridad':
        return 'bg-amber-500 hover:bg-amber-600';
      case 'analista_seguridad':
      case 'supply_lead':
        return 'bg-orange-500 hover:bg-orange-600';
      case 'supply':
      case 'soporte':
      case 'bi':
      case 'monitoring':
      case 'instalador':
        return 'bg-blue-500 hover:bg-blue-600';
      case 'pending':
        return 'bg-yellow-500 hover:bg-yellow-600';
      case 'unverified':
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  const getRoleDisplayName = (role: string) => {
    const roleNames: Record<string, string> = {
      'owner': 'Propietario',
      'admin': 'Administrador',
      'supply_admin': 'Admin Suministros',
      'coordinador_operaciones': 'Coordinador Ops',
      'jefe_seguridad': 'Jefe de Seguridad',
      'analista_seguridad': 'Analista Seguridad',
      'supply_lead': 'Lead Supply',
      'ejecutivo_ventas': 'Ejecutivo Ventas',
      'custodio': 'Custodio',
      'bi': 'Business Intelligence',
      'monitoring_supervisor': 'Supervisor Monitoreo',
      'monitoring': 'Monitoreo',
      'supply': 'Suministros',
      'instalador': 'Instalador',
      'soporte': 'Soporte',
      'pending': 'Pendiente',
      'unverified': 'No Verificado'
    };
    return roleNames[role] || role;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Cargando usuarios...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p><strong>Error al cargar usuarios:</strong></p>
                <p className="text-sm">{error instanceof Error ? error.message : 'Error desconocido'}</p>
                <div className="text-xs text-gray-600 mt-2">
                  <p>Posibles causas:</p>
                  <ul className="list-disc list-inside">
                    <li>No tienes permisos de administrador</li>
                    <li>Problema de conexión con la base de datos</li>
                    <li>La función de seguridad no está configurada correctamente</li>
                  </ul>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                >
                  {isRefreshing ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Reintentar
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Administración de Usuarios y Roles</CardTitle>
            <CardDescription>
              Gestione los roles y permisos de los usuarios del sistema
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Actualizar
          </Button>
        </div>
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
        {!users || users.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p>No se encontraron usuarios registrados.</p>
                <div className="text-sm text-gray-600">
                  <p>Usuarios esperados: brenda.jimenez@detectasecurity.io, marbelli.casillas@detectasecurity.io</p>
                  <p>Verifica que:</p>
                  <ul className="list-disc list-inside mt-1">
                    <li>Los usuarios hayan confirmado su email</li>
                    <li>Tengas permisos de administrador</li>
                    <li>La función de base de datos esté funcionando correctamente</li>
                  </ul>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        ) : (
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
                          <Badge className={getRoleBadgeColor(user.role)}>
                            {getRoleDisplayName(user.role)}
                          </Badge>
                          <Select
                            defaultValue={user.role}
                            onValueChange={(value) => handleRoleChange(user.id, value as Role)}
                          >
                            <SelectTrigger className="w-[180px]">
                              <SelectValue placeholder="Seleccionar rol" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.isArray(roles) && roles.map((role) => (
                                <SelectItem key={role} value={role}>
                                  {getRoleDisplayName(role)}
                                </SelectItem>
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
        )}
        
        {users && users.length > 0 && (
          <div className="mt-4 text-sm text-muted-foreground">
            Mostrando {filteredUsers?.length || 0} de {users.length} usuarios
          </div>
        )}
      </CardContent>
    </Card>
  );
};
