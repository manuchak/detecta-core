
import { usePermissions } from '@/hooks/usePermissions';
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserRoleManager } from '@/components/settings/UserRoleManager';
import { PermissionsManager } from '@/components/settings/PermissionsManager';
import { RoleManager } from '@/components/settings/roles/RoleManager';
import { Loader2, Settings2, Users2, ShieldCheck, Sliders, UserCircle } from 'lucide-react';

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
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Configuración del Sistema</h1>
        <p className="text-muted-foreground mt-1">
          Administre la configuración del sistema, usuarios y permisos
        </p>
      </div>

      <div className="bg-card border border-border/40 rounded-xl shadow-sm p-6">
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="mb-6 bg-muted/50 p-1 rounded-lg">
            <TabsTrigger value="users" className="flex gap-2 data-[state=active]:shadow-sm">
              <Users2 className="h-4 w-4" />
              <span>Usuarios</span>
            </TabsTrigger>
            <TabsTrigger value="roles" className="flex gap-2 data-[state=active]:shadow-sm">
              <UserCircle className="h-4 w-4" />
              <span>Roles</span>
            </TabsTrigger>
            <TabsTrigger value="permissions" className="flex gap-2 data-[state=active]:shadow-sm">
              <ShieldCheck className="h-4 w-4" />
              <span>Permisos</span>
            </TabsTrigger>
            <TabsTrigger value="general" className="flex gap-2 data-[state=active]:shadow-sm">
              <Settings2 className="h-4 w-4" />
              <span>General</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="users" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
            <UserRoleManager />
          </TabsContent>
          
          <TabsContent value="roles" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
            <RoleManager />
          </TabsContent>
          
          <TabsContent value="permissions" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
            <PermissionsManager />
          </TabsContent>
          
          <TabsContent value="general" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
            <div className="bg-white border rounded-lg p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-primary/10 p-3 rounded-full">
                  <Sliders className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold mb-1">Configuración General</h2>
                  <p className="text-muted-foreground">
                    Ajustes generales del sistema
                  </p>
                </div>
              </div>
              
              <div className="bg-muted/30 rounded-lg p-8 text-center">
                <p className="text-muted-foreground text-lg">
                  Las configuraciones generales del sistema estarán disponibles próximamente.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;
