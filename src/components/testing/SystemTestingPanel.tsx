import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, XCircle, AlertCircle, Play, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface TestResult {
  test: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: any;
}

interface SystemTestingPanelProps {
  isAdminOnly?: boolean;
}

const SystemTestingPanel: React.FC<SystemTestingPanelProps> = ({ isAdminOnly = true }) => {
  const { user, userRole, permissions } = useAuth();
  const { toast } = useToast();
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);

  // Solo mostrar para admins si isAdminOnly es true
  if (isAdminOnly && userRole !== 'admin' && userRole !== 'owner') {
    return null;
  }

  const runTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    const results: TestResult[] = [];

    try {
      // Test 1: RPC Function - get_users_with_roles_secure
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_users_with_roles_secure');
        
        if (rpcError) {
          results.push({
            test: 'RPC: get_users_with_roles_secure',
            status: 'error',
            message: `Error al ejecutar RPC: ${rpcError.message}`,
            details: rpcError
          });
        } else {
          results.push({
            test: 'RPC: get_users_with_roles_secure',
            status: 'success',
            message: `RPC ejecutado correctamente. ${rpcData?.length || 0} usuarios encontrados`,
            details: rpcData
          });
        }
      } catch (error) {
        results.push({
          test: 'RPC: get_users_with_roles_secure',
          status: 'error',
          message: `Error de red: ${error}`,
          details: error
        });
      }

      // Test 2: Current User Permissions
      const expectedPermissions = ['canViewDashboard', 'canViewLeads', 'canEditLeads', 'canManageUsers'];
      const currentPermissions = Object.entries(permissions || {})
        .filter(([_, value]) => value)
        .map(([key, _]) => key);

      results.push({
        test: 'Permisos del Usuario Actual',
        status: currentPermissions.length > 0 ? 'success' : 'warning',
        message: `Rol: ${userRole}, Permisos activos: ${currentPermissions.length}`,
        details: { userRole, permissions, currentPermissions }
      });

      // Test 3: Auth Context State
      results.push({
        test: 'Estado de Autenticación',
        status: user && userRole ? 'success' : 'error',
        message: user && userRole ? 'Usuario autenticado correctamente' : 'Estado de autenticación incompleto',
        details: { 
          hasUser: !!user, 
          userEmail: user?.email, 
          userRole,
          hasPermissions: !!permissions 
        }
      });

      // Test 4: Database Connection
      try {
        const { data: dbTest, error: dbError } = await supabase
          .from('user_roles')
          .select('count', { count: 'exact', head: true });

        if (dbError) {
          results.push({
            test: 'Conexión a Base de Datos',
            status: 'error',
            message: `Error de conexión: ${dbError.message}`,
            details: dbError
          });
        } else {
          results.push({
            test: 'Conexión a Base de Datos',
            status: 'success',
            message: 'Conexión exitosa a la base de datos',
            details: { count: dbTest }
          });
        }
      } catch (error) {
        results.push({
          test: 'Conexión a Base de Datos',
          status: 'error',
          message: `Error de red: ${error}`,
          details: error
        });
      }

      // Test 5: Role Validation
      const validRoles = ['admin', 'owner', 'supply_admin', 'supply_lead', 'ejecutivo_ventas', 'supply'];
      const isValidRole = validRoles.includes(userRole || '');
      
      results.push({
        test: 'Validación de Rol',
        status: isValidRole ? 'success' : 'error',
        message: isValidRole ? `Rol válido: ${userRole}` : `Rol inválido o faltante: ${userRole}`,
        details: { userRole, validRoles, isValidRole }
      });

    } catch (globalError) {
      results.push({
        test: 'Test Global',
        status: 'error',
        message: `Error global en testing: ${globalError}`,
        details: globalError
      });
    }

    setTestResults(results);
    setIsRunning(false);

    // Toast summary
    const errorCount = results.filter(r => r.status === 'error').length;
    const successCount = results.filter(r => r.status === 'success').length;
    
    toast({
      title: "Testing Completado",
      description: `${successCount} éxitos, ${errorCount} errores`,
      variant: errorCount > 0 ? "destructive" : "default"
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'success':
        return 'default';
      case 'error':
        return 'destructive';
      case 'warning':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Play className="h-5 w-5" />
          Sistema de Testing
        </CardTitle>
        <CardDescription>
          Panel de validación para funciones críticas del sistema de autenticación y permisos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Usuario: {user?.email} | Rol: {userRole}
          </div>
          <Button 
            onClick={runTests} 
            disabled={isRunning}
            className="flex items-center gap-2"
          >
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Ejecutando...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Ejecutar Tests
              </>
            )}
          </Button>
        </div>

        {testResults.length > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <h4 className="font-medium">Resultados de Tests</h4>
              {testResults.map((result, index) => (
                <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                  {getStatusIcon(result.status)}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{result.test}</span>
                      <Badge variant={getStatusVariant(result.status)}>
                        {result.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{result.message}</p>
                    {result.details && (
                      <details className="text-xs">
                        <summary className="cursor-pointer text-gray-500">Ver detalles</summary>
                        <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-auto">
                          {JSON.stringify(result.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default SystemTestingPanel;