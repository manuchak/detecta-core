
import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import ApiCredentials from "@/components/settings/ApiCredentials";
import { UserRoleManager } from "@/components/settings/UserRoleManager";
import { PermissionsManager } from "@/components/settings/PermissionsManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";

const Settings = () => {
  const [activeTab, setActiveTab] = useState("roles");
  const { userRole } = useAuth();
  const isAdmin = userRole === 'admin' || userRole === 'owner';

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Configuración</h1>
        
        {isAdmin && (
          <Link
            to="/admin/landing"
            className="inline-flex items-center text-sm font-medium text-primary hover:underline"
          >
            Administrar Landing Page <ExternalLink className="ml-1 h-4 w-4" />
          </Link>
        )}
      </div>
      
      <Tabs
        defaultValue={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="mb-6">
          <TabsTrigger value="roles">Roles de Usuario</TabsTrigger>
          <TabsTrigger value="permissions">Permisos</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
        </TabsList>

        <TabsContent value="roles">
          <UserRoleManager />
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
