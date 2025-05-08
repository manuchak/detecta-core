
import { usePermissions } from '@/hooks/usePermissions';
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserRoleManager } from '@/components/settings/UserRoleManager';
import { PermissionsManager } from '@/components/settings/PermissionsManager';
import { Loader2 } from 'lucide-react';

const Settings = () => {
  const { isLoading } = usePermissions();
  const [hasAccess] = useState(true); // Always grant access
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <div className="text-muted-foreground">
            Cargando configuración...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Configuración</h1>
        <p className="text-muted-foreground">
          Administre la configuración del sistema, usuarios y permisos
        </p>
      </div>

      <Tabs defaultValue="users">
        <TabsList className="mb-4">
          <TabsTrigger value="users">Usuarios</TabsTrigger>
          <TabsTrigger value="permissions">Permisos</TabsTrigger>
          <TabsTrigger value="general">General</TabsTrigger>
        </TabsList>
        <TabsContent value="users">
          <UserRoleManager />
        </TabsContent>
        <TabsContent value="permissions">
          <PermissionsManager />
        </TabsContent>
        <TabsContent value="general">
          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">Configuración General</h2>
            <p className="text-muted-foreground">
              Configuraciones generales del sistema estarán disponibles próximamente.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
