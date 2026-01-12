
import React, { useState, useEffect } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/components/ui/use-toast";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from "@/components/ui/input";
import { Loader2 } from 'lucide-react';
import { Navigate } from 'react-router-dom';

const AssignRole = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState('owner');
  const [availableRoles, setAvailableRoles] = useState<string[]>([
    'owner', 'admin', 'supply_admin', 'coordinador_operaciones', 
    'jefe_seguridad', 'analista_seguridad', 'supply_lead', 'ejecutivo_ventas',
    'custodio', 'bi', 'monitoring_supervisor', 'monitoring', 'supply', 
    'instalador', 'soporte', 'pending', 'unverified'
  ]);

  const getRoleDisplayName = (role: string) => {
    const roleNames: Record<string, string> = {
      'owner': 'Propietario',
      'admin': 'Administrador',
      'supply_admin': 'Admin Suministros',
      'coordinador_operaciones': 'Coordinador Operaciones',
      'jefe_seguridad': 'Jefe de Seguridad',
      'analista_seguridad': 'Analista de Seguridad',
      'supply_lead': 'Lead de Supply',
      'ejecutivo_ventas': 'Ejecutivo de Ventas',
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

  useEffect(() => {
    // If user is logged in, pre-fill the user ID
    if (user?.id) {
      setUserId(user.id);
    }
  }, [user]);

  const assignRole = async () => {
    if (!userId) {
      toast({
        title: "Error",
        description: "Por favor ingresa un ID de usuario",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Get the JWT token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("No hay sesión activa");
      }

      // Call the Edge Function to assign the role
      const response = await fetch('https://beefjsdgrdeiymzxwxru.supabase.co/functions/v1/assign-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          user_id: userId,
          role: selectedRole
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || "Error al asignar rol");
      }
      
      toast({
        title: "Éxito",
        description: `Rol '${selectedRole}' asignado correctamente. Por favor cierra sesión y vuelve a iniciar para ver los cambios.`,
      });
      
      // Role will be updated when user signs out and back in
      
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al asignar rol",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Asignar Rol de Usuario</CardTitle>
          <CardDescription>
            Asigna un rol a un usuario para darle acceso a funcionalidades específicas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">ID de Usuario</label>
            <Input 
              value={userId} 
              onChange={(e) => setUserId(e.target.value)}
              placeholder="UUID del usuario"
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Rol a Asignar</label>
            <Select
              value={selectedRole}
              onValueChange={setSelectedRole}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar rol" />
              </SelectTrigger>
              <SelectContent>
                {availableRoles.map((role) => (
                  <SelectItem key={role} value={role}>
                    {getRoleDisplayName(role)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button
            className="w-full"
            onClick={assignRole}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Asignando...
              </>
            ) : (
              'Asignar Rol'
            )}
          </Button>
          
          <p className="text-xs text-muted-foreground mt-4">
            Nota: Después de asignar un rol, el usuario deberá cerrar sesión y volver a iniciarla
            para que los cambios surtan efecto.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AssignRole;
