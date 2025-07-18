
import React, { useState } from "react";
import ApiCredentials from "@/components/settings/ApiCredentials";
import { PermissionsManager } from "@/components/settings/PermissionsManager";
import { QuickSkillsPanel } from "@/components/settings/QuickSkillsPanel";
import { RoleManager } from "@/components/settings/roles/RoleManager";
import { WhatsAppManager } from "@/components/settings/WhatsAppManager";
import AIConnectionTest from "@/components/siercp/AIConnectionTest";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Settings = () => {
  const [activeTab, setActiveTab] = useState("ia");

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Configuración</h1>
      </div>
      
      <Tabs
        defaultValue={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="mb-6">
          <TabsTrigger value="roles">Roles y Usuarios</TabsTrigger>
          <TabsTrigger value="permissions">Permisos Avanzados</TabsTrigger>
          <TabsTrigger value="whatsapp">Bot WhatsApp</TabsTrigger>
          <TabsTrigger value="ia">Inteligencia Artificial</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
        </TabsList>

        <TabsContent value="roles" className="space-y-6">
          <RoleManager />
        </TabsContent>

        <TabsContent value="permissions">
          <PermissionsManager />
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
      </Tabs>
    </div>
  );
};

export default Settings;
