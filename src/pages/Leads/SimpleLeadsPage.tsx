import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { LeadsListPage } from "./LeadsListPage";

const SimpleLeadsPage = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    console.log('🎯 SimpleLeadsPage - Inicializando...');
    
    // Verificar usuario actual de manera simple
    supabase.auth.getUser().then(({ data, error }) => {
      if (error) {
        console.error('Error getting user:', error);
        setLoading(false);
        return;
      }

      console.log('✅ User data:', data.user?.email);
      setUser(data.user);
      
      if (data.user) {
        // Obtener rol del usuario
        supabase.rpc('get_current_user_role').then(({ data: roleData, error: roleError }) => {
          if (roleError) {
            console.error('Error getting role:', roleError);
          } else {
            console.log('✅ Fetched user role:', roleData);
            setUserRole(roleData);
          }
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });
  }, []);

  // Roles permitidos para ver leads
  const allowedRoles = ['admin', 'owner', 'supply_admin', 'ejecutivo_ventas'];
  const hasAccess = userRole && allowedRoles.includes(userRole);

  if (loading) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Verificando permisos...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">No autenticado</h2>
              <p>Debes iniciar sesión para ver esta página</p>
              <Button onClick={() => window.location.href = '/auth/login'} className="mt-4">
                Ir a Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Acceso Restringido</h2>
              <p className="text-muted-foreground mb-2">
                No tienes permisos para acceder a la gestión de candidatos.
              </p>
              <p className="text-sm text-muted-foreground">
                Tu rol '{userRole}' no incluye permisos para ver candidatos.
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Roles permitidos: {allowedRoles.join(', ')}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Si tiene acceso, mostrar la interfaz
  return (
    <div>
      {!showAdvanced ? (
        <div className="p-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Gestión de Candidatos - Control de Acceso</span>
                <Button 
                  onClick={() => setShowAdvanced(true)}
                  className="text-sm"
                >
                  🚀 Ir a Versión Completa
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <p><strong>✅ Usuario autenticado:</strong> {user.email}</p>
                  <p><strong>🎯 Rol verificado:</strong> {userRole}</p>
                  <p><strong>🔧 Estado:</strong> Acceso autorizado al sistema completo</p>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-blue-800 mb-2">🎯 Sistema Supply Robusto Disponible</h3>
                  <p className="text-blue-700 text-sm mb-3">
                    Tienes acceso a la versión completa con todas las funcionalidades:
                  </p>
                  <ul className="text-blue-700 text-sm space-y-1 list-disc list-inside">
                    <li>Dashboard de métricas en tiempo real</li>
                    <li>Filtros avanzados y búsqueda inteligente</li>
                    <li>Asignación masiva de candidatos</li>
                    <li>Gestión completa de leads con permisos</li>
                    <li>Sistema de notificaciones y workflow</li>
                  </ul>
                </div>
                
                <div className="flex gap-4 pt-4">
                  <Button onClick={() => setShowAdvanced(true)}>
                    🚀 Acceder al Sistema Completo
                  </Button>
                  <Button variant="outline" onClick={() => window.location.reload()}>
                    🔄 Recargar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        // Mostrar la versión completa
        <LeadsListPage />
      )}
    </div>
  );
};

export default SimpleLeadsPage;