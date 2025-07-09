
import React, { useState } from "react";
import ApiCredentials from "@/components/settings/ApiCredentials";
import { PermissionsManager } from "@/components/settings/PermissionsManager";
import { QuickSkillsPanel } from "@/components/settings/QuickSkillsPanel";
import { RoleManager } from "@/components/settings/roles/RoleManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Settings = () => {
  const [activeTab, setActiveTab] = useState("roles");

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
          <TabsTrigger value="api">API</TabsTrigger>
        </TabsList>

        <TabsContent value="roles" className="space-y-6">
          <RoleManager />
        </TabsContent>

        <TabsContent value="permissions">
          <PermissionsManager />
        </TabsContent>

        <TabsContent value="api">
          <ApiCredentials />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
