
import { usePermissions } from '@/hooks/usePermissions';
import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserRoleManager } from '@/components/settings/UserRoleManager';
import { PermissionsManager } from '@/components/settings/PermissionsManager';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';

const Settings = () => {
  const { isAdmin, userRole, isLoading } = usePermissions();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user has admin access
    const checkAccess = async () => {
      if (!isLoading) {
        // Grant access by default if userRole is owner or admin
        const hasAdminAccess = isAdmin || userRole === 'owner';
        setHasAccess(hasAdminAccess);
        
        if (!hasAdminAccess && userRole !== null) {
          toast({
            title: "Acceso denegado",
            description: "No tiene permisos suficientes para acceder a esta página.",
            variant: "destructive",
          });
          
          // Redirect non-admin users after a short delay
          const timer = setTimeout(() => {
            navigate('/dashboard');
          }, 3000);
          return () => clearTimeout(timer);
        }
      }
    };

    checkAccess();
  }, [userRole, isAdmin, navigate, isLoading, toast]);

  if (isLoading || hasAccess === null) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <div className="text-muted-foreground">
            Comprobando permisos...
          </div>
        </div>
      </div>
    );
  }

  if (hasAccess === false) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Acceso denegado</AlertTitle>
          <AlertDescription>
            No tiene permisos suficientes para acceder a esta página. Será redirigido al panel principal.
          </AlertDescription>
        </Alert>
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
