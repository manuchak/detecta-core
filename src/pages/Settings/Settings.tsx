
import React, { useState } from "react";
import ApiCredentials from "@/components/settings/ApiCredentials";
import { UserRoleManager } from "@/components/settings/UserRoleManager";
import { PermissionsManager } from "@/components/settings/PermissionsManager";
import { SkillsManager } from "@/components/settings/SkillsManager";
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
          <TabsTrigger value="roles">Roles de Usuario</TabsTrigger>
          <TabsTrigger value="skills">Skills de Usuario</TabsTrigger>
          <TabsTrigger value="permissions">Permisos</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
        </TabsList>

        <TabsContent value="roles">
          <UserRoleManager />
        </TabsContent>

        <TabsContent value="skills">
          <SkillsManager />
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
