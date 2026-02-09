import React from "react";
import ApiCredentials from "@/components/settings/ApiCredentials";
import { PermissionsManager } from "@/components/settings/PermissionsManager";
import { QuickSkillsPanel } from "@/components/settings/QuickSkillsPanel";
import { RoleManager } from "@/components/settings/roles/RoleManager";
import { WhatsAppManager } from "@/components/settings/WhatsAppManager";
import { SandboxSettings } from "@/components/settings/SandboxSettings";
import { KapsoConfig } from "@/components/settings/KapsoConfig";
import AIConnectionTest from "@/components/siercp/AIConnectionTest";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useSearchParams } from "react-router-dom";

const Settings = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'ia';
  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value }, { replace: true });
  };
  const { userRole } = useAuth();
  
  const canAccessSandbox = userRole === 'admin' || userRole === 'owner';

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Configuración</h1>
      </div>
      
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full"
      >
        <TabsList className="mb-6 flex-wrap">
          <TabsTrigger value="roles">Roles y Usuarios</TabsTrigger>
          <TabsTrigger value="permissions">Permisos Avanzados</TabsTrigger>
          <TabsTrigger value="kapso">WhatsApp Kapso</TabsTrigger>
          <TabsTrigger value="whatsapp">Bot WhatsApp (Legacy)</TabsTrigger>
          <TabsTrigger value="ia">Inteligencia Artificial</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
          {canAccessSandbox && (
            <TabsTrigger value="entorno">Entorno</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="roles" className="space-y-6">
          <RoleManager />
        </TabsContent>

        <TabsContent value="permissions">
          <PermissionsManager />
        </TabsContent>

        <TabsContent value="kapso">
          <KapsoConfig />
        </TabsContent>

        <TabsContent value="whatsapp">
          <WhatsAppManager />
        </TabsContent>

        <TabsContent value="ia" className="space-y-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold mb-2">Configuración de IA</h2>
              <p className="text-muted-foreground">
                Configurar y probar la conexión con servicios de inteligencia artificial para asistir en las evaluaciones SIERCP.
              </p>
            </div>
            <AIConnectionTest />
          </div>
        </TabsContent>

        <TabsContent value="api">
          <ApiCredentials />
        </TabsContent>

        {canAccessSandbox && (
          <TabsContent value="entorno">
            <SandboxSettings />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default Settings;
