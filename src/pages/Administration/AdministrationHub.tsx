import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Database, GitBranch } from "lucide-react";
import DuplicateCleanupManager from "@/components/maintenance/DuplicateCleanupManager";
import { VersionControlManager } from "@/components/version-control/VersionControlManager";

const AdministrationHub = () => {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Administración</h1>
          <p className="text-muted-foreground">
            Herramientas de administración y mantenimiento del sistema
          </p>
        </div>
      </div>

      <Tabs defaultValue="database" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="database" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Limpieza de BDD
          </TabsTrigger>
          <TabsTrigger value="versions" className="flex items-center gap-2">
            <GitBranch className="h-4 w-4" />
            Control de Versiones
          </TabsTrigger>
        </TabsList>

        <TabsContent value="database" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Limpieza de Duplicados en Base de Datos</CardTitle>
              <CardDescription>
                Identifica y limpia registros duplicados en la base de datos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DuplicateCleanupManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="versions" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Control de Versiones del Sistema</CardTitle>
              <CardDescription>
                Gestiona versiones, cambios y features del sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <VersionControlManager />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdministrationHub;
