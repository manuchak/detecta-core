
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { AlertCircle, CheckCircle, Info, RefreshCw } from 'lucide-react';

const SUPABASE_URL = "https://yydzzeljaewsfhmilnhm.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5ZHp6ZWxqYWV3c2ZobWlsbmhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2OTc1MjIsImV4cCI6MjA2MzI3MzUyMn0.iP9UG12mKESneZq7XwY6vHvqRGH3hq3D1Hu0qneu8B8";

interface DiagnosticResult {
  step: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: any;
}

export const LeadsDebug = () => {
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostics = async () => {
    setIsRunning(true);
    setDiagnostics([]);
    const results: DiagnosticResult[] = [];

    try {
      // 1. Verificar configuración de Supabase
      results.push({
        step: '1. Configuración Supabase',
        status: 'success',
        message: 'Cliente Supabase configurado correctamente',
        details: {
          url: SUPABASE_URL,
          hasKey: !!SUPABASE_KEY
        }
      });

      // 2. Verificar autenticación
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError) {
          results.push({
            step: '2. Autenticación',
            status: 'error',
            message: `Error de autenticación: ${authError.message}`,
            details: authError
          });
        } else if (!user) {
          results.push({
            step: '2. Autenticación',
            status: 'warning',
            message: 'Usuario no autenticado',
            details: null
          });
        } else {
          results.push({
            step: '2. Autenticación',
            status: 'success',
            message: `Usuario autenticado: ${user.email}`,
            details: {
              id: user.id,
              email: user.email,
              emailConfirmed: user.email_confirmed_at !== null
            }
          });
        }
      } catch (error) {
        results.push({
          step: '2. Autenticación',
          status: 'error',
          message: `Excepción en autenticación: ${error}`,
          details: error
        });
      }

      // 3. Verificar roles
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: roleData, error: roleError } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id);
          
          if (roleError) {
            results.push({
              step: '3. Roles de usuario',
              status: 'error',
              message: `Error al obtener roles: ${roleError.message}`,
              details: roleError
            });
          } else {
            results.push({
              step: '3. Roles de usuario',
              status: 'success',
              message: `Roles encontrados: ${roleData?.length || 0}`,
              details: roleData
            });
          }
        }
      } catch (error) {
        results.push({
          step: '3. Roles de usuario',
          status: 'error',
          message: `Excepción al obtener roles: ${error}`,
          details: error
        });
      }

      // 4. Verificar tabla leads
      try {
        const { data: tableCheck, error: tableError } = await supabase
          .from('leads')
          .select('count', { count: 'exact', head: true });
        
        if (tableError) {
          results.push({
            step: '4. Tabla leads',
            status: 'error',
            message: `Error al acceder a tabla leads: ${tableError.message}`,
            details: tableError
          });
        } else {
          results.push({
            step: '4. Tabla leads',
            status: 'success',
            message: `Tabla leads accesible`,
            details: { count: tableCheck }
          });
        }
      } catch (error) {
        results.push({
          step: '4. Tabla leads',
          status: 'error',
          message: `Excepción al acceder a tabla leads: ${error}`,
          details: error
        });
      }

      // 5. Consulta de muestra
      try {
        const { data: sampleData, error: sampleError } = await supabase
          .from('leads')
          .select('*')
          .limit(3);
        
        if (sampleError) {
          results.push({
            step: '5. Consulta de muestra',
            status: 'error',
            message: `Error en consulta de muestra: ${sampleError.message}`,
            details: sampleError
          });
        } else {
          results.push({
            step: '5. Consulta de muestra',
            status: 'success',
            message: `Consulta exitosa, ${sampleData?.length || 0} registros`,
            details: sampleData
          });
        }
      } catch (error) {
        results.push({
          step: '5. Consulta de muestra',
          status: 'error',
          message: `Excepción en consulta de muestra: ${error}`,
          details: error
        });
      }

      // 6. Verificar conectividad básica
      try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
          method: 'HEAD',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
          }
        });
        
        results.push({
          step: '6. Conectividad HTTP',
          status: response.ok ? 'success' : 'error',
          message: response.ok ? 'Conexión HTTP exitosa' : `Error HTTP: ${response.status}`,
          details: {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries())
          }
        });
      } catch (error) {
        results.push({
          step: '6. Conectividad HTTP',
          status: 'error',
          message: `Error de conectividad: ${error}`,
          details: error
        });
      }

    } catch (globalError) {
      results.push({
        step: 'Error Global',
        status: 'error',
        message: `Error global en diagnóstico: ${globalError}`,
        details: globalError
      });
    }

    setDiagnostics(results);
    setIsRunning(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      default:
        return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      success: 'bg-green-100 text-green-800',
      error: 'bg-red-100 text-red-800',
      warning: 'bg-yellow-100 text-yellow-800'
    };
    
    return (
      <Badge className={variants[status as keyof typeof variants] || 'bg-blue-100 text-blue-800'}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Diagnóstico de Leads</h1>
          <p className="text-muted-foreground">
            Herramienta de diagnóstico para identificar problemas de carga de leads
          </p>
        </div>
        <Button onClick={runDiagnostics} disabled={isRunning}>
          {isRunning ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Ejecutando...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Ejecutar Diagnóstico
            </>
          )}
        </Button>
      </div>

      {diagnostics.length > 0 && (
        <div className="space-y-4">
          {diagnostics.map((result, index) => (
            <Card key={index}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(result.status)}
                    <CardTitle className="text-lg">{result.step}</CardTitle>
                  </div>
                  {getStatusBadge(result.status)}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 mb-3">{result.message}</p>
                {result.details && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-sm font-medium text-gray-600 hover:text-gray-800">
                      Ver detalles técnicos
                    </summary>
                    <pre className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-auto">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  </details>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {diagnostics.length === 0 && !isRunning && (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-500">
              Haz clic en "Ejecutar Diagnóstico" para identificar problemas con la carga de leads
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LeadsDebug;
