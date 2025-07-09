
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
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
import { Loader2 } from 'lucide-react';

interface UserWithRole {
  user_id: string;
  email: string;
  role: string;
  created_at: string;
}

export const UserRoleManager = () => {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const { toast } = useToast();

  const availableRoles = [
    'owner',
    'admin', 
    'supply_admin',
    'coordinador_operaciones',
    'jefe_seguridad',
    'analista_seguridad',
    'supply_lead',
    'ejecutivo_ventas',
    'custodio',
    'bi',
    'monitoring_supervisor',
    'monitoring',
    'supply',
    'instalador',
    'soporte',
    'pending',
    'unverified'
  ];

  const getRoleDisplayName = (role: string) => {
    const roleNames: Record<string, string> = {
      'owner': 'Propietario',
      'admin': 'Administrador',
      'supply_admin': 'Admin Suministros',
      'coordinador_operaciones': 'Coordinador Operaciones',
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

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_users_with_roles_for_admin');
      
      if (error) {
        console.error('Error fetching users:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los usuarios",
          variant: "destructive",
        });
        return;
      }

      setUsers(data || []);
    } catch (error) {
      console.error('Error in fetchUsers:', error);
      toast({
        title: "Error",
        description: "Error al cargar usuarios",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (email: string, newRole: string) => {
    try {
      setUpdating(email);
      
      const { data, error } = await supabase.rpc('update_user_role_by_email', {
        p_email: email,
        p_new_role: newRole
      });

      if (error) {
        console.error('Error updating role:', error);
        toast({
          title: "Error",
          description: `Error al actualizar rol: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Éxito",
        description: `Rol actualizado para ${email}`,
      });

      // Recargar usuarios
      await fetchUsers();
    } catch (error) {
      console.error('Error in updateUserRole:', error);
      toast({
        title: "Error",
        description: "Error al actualizar el rol",
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Cargando usuarios...</span>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestión de Roles de Usuario</CardTitle>
        <CardDescription>
          Actualiza los roles de los usuarios para dar acceso a diferentes funcionalidades
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Rol Actual</TableHead>
                <TableHead>Nuevo Rol</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.user_id}>
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {getRoleDisplayName(user.role)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Select
                      disabled={updating === user.email}
                      onValueChange={(value) => updateUserRole(user.email, value)}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Seleccionar nuevo rol" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableRoles.map((role) => (
                          <SelectItem key={role} value={role}>
                            {getRoleDisplayName(role)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {updating === user.email && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Roles recomendados para acceso a Leads e Instaladores:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li><strong>supply_admin:</strong> Acceso completo a gestión de leads</li>
            <li><strong>coordinador_operaciones:</strong> Acceso a leads e instaladores</li>
            <li><strong>admin:</strong> Acceso completo a todo el sistema</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
