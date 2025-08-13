import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, GitBranch, FileText, Wrench } from "lucide-react";
import { useVersionControl } from "@/hooks/useVersionControl";
import { VersionCard } from "./VersionCard";
import { VersionForm } from "./VersionForm";
import { ChangeLogTable } from "./ChangeLogTable";
import { SystemVersion } from "@/hooks/useVersionControl";

export const VersionControlManager = () => {
  const {
    versions,
    versionsLoading,
    getVersionChanges,
    createVersion,
    updateVersion,
  } = useVersionControl();

  const [showForm, setShowForm] = useState(false);
  const [editingVersion, setEditingVersion] = useState<SystemVersion | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<SystemVersion | null>(null);

  const currentVersion = versions?.find(v => v.status === 'released') || versions?.[0];
  const developmentVersions = versions?.filter(v => v.status !== 'released') || [];

  const handleCreateVersion = async (versionData: any) => {
    try {
      await createVersion.mutateAsync(versionData);
      setShowForm(false);
      setEditingVersion(null);
    } catch (error) {
      console.error('Error creating version:', error);
    }
  };

  const handleEditVersion = async (versionData: any) => {
    if (!editingVersion) return;
    
    try {
      await updateVersion.mutateAsync({ ...versionData, id: editingVersion.id });
      setShowForm(false);
      setEditingVersion(null);
    } catch (error) {
      console.error('Error updating version:', error);
    }
  };

  const handleViewDetails = (version: SystemVersion) => {
    setSelectedVersion(version);
  };

  const handleEdit = (version: SystemVersion) => {
    setEditingVersion(version);
    setShowForm(true);
  };

  if (versionsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Cargando versiones...</div>
      </div>
    );
  }

  if (showForm) {
    return (
      <VersionForm
        onSubmit={editingVersion ? handleEditVersion : handleCreateVersion}
        onCancel={() => {
          setShowForm(false);
          setEditingVersion(null);
        }}
        initialData={editingVersion || undefined}
        isLoading={createVersion.isPending || updateVersion.isPending}
      />
    );
  }

  if (selectedVersion) {
    return <VersionDetails version={selectedVersion} onBack={() => setSelectedVersion(null)} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Control de Versiones</h1>
          <p className="text-muted-foreground">
            Gestiona las versiones y cambios del sistema
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Versión
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="versions">Todas las Versiones</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Versión Actual */}
          {currentVersion && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GitBranch className="w-5 h-5" />
                  Versión Actual en Producción
                </CardTitle>
              </CardHeader>
              <CardContent>
                <VersionCard
                  version={currentVersion}
                  onViewDetails={handleViewDetails}
                  onEdit={handleEdit}
                />
              </CardContent>
            </Card>
          )}

          {/* Versiones en Desarrollo */}
          {developmentVersions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="w-5 h-5" />
                  Versiones en Desarrollo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {developmentVersions.map((version) => (
                    <VersionCard
                      key={version.id}
                      version={version}
                      onViewDetails={handleViewDetails}
                      onEdit={handleEdit}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="versions">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {versions?.map((version) => (
              <VersionCard
                key={version.id}
                version={version}
                onViewDetails={handleViewDetails}
                onEdit={handleEdit}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

interface VersionDetailsProps {
  version: SystemVersion;
  onBack: () => void;
}

const VersionDetails = ({ version, onBack }: VersionDetailsProps) => {
  const { getVersionChanges, getVersionFeatures } = useVersionControl();
  const { data: changes } = getVersionChanges(version.id);
  const { data: features } = getVersionFeatures(version.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          ← Volver
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="w-5 h-5" />
            {version.version_number}
            {version.version_name && ` (${version.version_name})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {version.description && (
              <p className="text-muted-foreground">{version.description}</p>
            )}
            {version.release_notes && (
              <div>
                <h4 className="font-semibold mb-2">Release Notes:</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {version.release_notes}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="changes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="changes">Cambios</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
        </TabsList>

        <TabsContent value="changes">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Registro de Cambios
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChangeLogTable changes={changes || []} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features">
          <Card>
            <CardHeader>
              <CardTitle>Features</CardTitle>
            </CardHeader>
            <CardContent>
              {features && features.length > 0 ? (
                <div className="space-y-2">
                  {features.map((feature) => (
                    <div key={feature.id} className="p-3 border rounded-lg">
                      <div className="font-medium">{feature.feature_name}</div>
                      {feature.feature_description && (
                        <div className="text-sm text-muted-foreground">
                          {feature.feature_description}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No hay features registradas para esta versión
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};