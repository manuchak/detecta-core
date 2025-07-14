
import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Copy, CheckCircle, Shield, Info } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Definición de interfaces
interface ApiCredential {
  service_name: string;
  user: string;
  password: string;
  connection_string: string;
  instructions?: string;
  important_note?: string;
}

interface ApiResponse {
  success: boolean;
  service_name?: string;
  user?: string;
  password?: string;
  connection_string?: string;
  instructions?: string;
  important_note?: string;
  error?: string;
}

export const ApiCredentialsManager: React.FC = () => {
  const { toast } = useToast();
  const [serviceName, setServiceName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [credentials, setCredentials] = useState<ApiCredential | null>(null);
  const [showCredentials, setShowCredentials] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [serviceNameError, setServiceNameError] = useState<string | null>(null);
  
  // Validar nombre de servicio
  const validateServiceName = (name: string): boolean => {
    if (!name.trim()) {
      setServiceNameError("El nombre del servicio no puede estar vacío");
      return false;
    }
    
    if (name.trim().length < 3) {
      setServiceNameError("El nombre del servicio debe tener al menos 3 caracteres");
      return false;
    }
    
    setServiceNameError(null);
    return true;
  };

  const handleCreateApiAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar entrada
    if (!validateServiceName(serviceName)) {
      return;
    }

    setIsLoading(true);
    
    try {
      // Llamar a la función edge para crear credenciales
      const { data, error } = await supabase.functions.invoke<ApiResponse>('create-readonly-access', {
        body: { serviceName: serviceName.trim() }
      });
      
      if (error) {
        throw new Error(`Error en la función edge: ${error.message}`);
      }
      
      if (!data || !data.success) {
        throw new Error(data?.error || 'Respuesta no válida del servidor');
      }
      
      // Guardar credenciales y mostrar diálogo
      setCredentials({
        service_name: data.service_name!,
        user: data.user!,
        password: data.password!,
        connection_string: data.connection_string!,
        instructions: data.instructions,
        important_note: data.important_note
      });
      
      setShowCredentials(true);
      setServiceName('');
      
    } catch (error) {
      console.error('Error al crear acceso API:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudieron crear las credenciales",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Función para copiar al portapapeles con manejo de errores
  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast({
        title: "Copiado",
        description: `${field === 'user' ? 'Usuario' : field === 'password' ? 'Contraseña' : 'Cadena de conexión'} copiado al portapapeles`,
      });
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Error al copiar:', err);
      toast({
        title: "Error",
        description: "No se pudo copiar al portapapeles. Intente copiar manualmente.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Credenciales API para Terceros
        </CardTitle>
        <CardDescription>
          Crea credenciales de acceso de solo lectura para la tabla de servicios de custodia
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleCreateApiAccess} className="space-y-4">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="service-name">Nombre del Servicio</Label>
              <Input
                id="service-name"
                placeholder="Nombre del servicio o integración (mín. 3 caracteres)"
                value={serviceName}
                onChange={(e) => {
                  setServiceName(e.target.value);
                  if (serviceNameError) validateServiceName(e.target.value);
                }}
                disabled={isLoading}
                className={serviceNameError ? "border-red-500" : ""}
              />
              {serviceNameError && (
                <p className="text-sm text-red-500">{serviceNameError}</p>
              )}
            </div>
            
            <Alert variant="default" className="bg-muted/50 border-muted">
              <Info className="h-4 w-4" />
              <AlertTitle>Información de Acceso</AlertTitle>
              <AlertDescription>
                Las credenciales generadas tendrán acceso de solo lectura a la tabla de servicios de custodia.
                Estas credenciales son sensibles y deben compartirse de manera segura con el equipo técnico correspondiente.
              </AlertDescription>
            </Alert>
          </div>
          
          <Button 
            type="submit" 
            className="mt-4 w-full" 
            disabled={isLoading || !serviceName.trim() || serviceName.trim().length < 3}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generando Credenciales...
              </>
            ) : (
              'Crear Credenciales de Acceso'
            )}
          </Button>
        </form>
      </CardContent>
      
      <Dialog open={showCredentials} onOpenChange={setShowCredentials}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Credenciales Generadas</DialogTitle>
            <DialogDescription>
              Guarda esta información de manera segura. La contraseña no podrá ser recuperada después.
            </DialogDescription>
          </DialogHeader>
          
          {credentials && (
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label>Usuario</Label>
                <div className="flex items-center gap-2">
                  <Input value={credentials.user} readOnly />
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => copyToClipboard(credentials.user, 'user')}
                    title="Copiar usuario"
                  >
                    {copiedField === 'user' ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label>Contraseña</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    value={credentials.password} 
                    readOnly 
                    type="password" 
                    className="font-mono"
                  />
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => copyToClipboard(credentials.password, 'password')}
                    title="Copiar contraseña"
                  >
                    {copiedField === 'password' ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label>Cadena de Conexión</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    value={credentials.connection_string} 
                    readOnly 
                    className="font-mono text-xs"
                  />
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => copyToClipboard(credentials.connection_string, 'connection_string')}
                    title="Copiar cadena de conexión"
                  >
                    {copiedField === 'connection_string' ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              
              {credentials.instructions && (
                <Alert variant="default" className="bg-blue-50 border-blue-200">
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    {credentials.instructions}
                  </AlertDescription>
                </Alert>
              )}
              
              <Alert variant="destructive" className="bg-destructive/10">
                <AlertTitle>¡Importante!</AlertTitle>
                <AlertDescription className="text-sm">
                  {credentials.important_note || 
                   "Esta será la única vez que podrás ver la contraseña. Asegúrate de guardarla en un lugar seguro. Si la pierdes, tendrás que generar nuevas credenciales."}
                </AlertDescription>
              </Alert>
            </div>
          )}
          
          <DialogFooter className="sm:justify-center">
            <Button 
              variant="default"
              onClick={() => setShowCredentials(false)}
            >
              Entendido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default ApiCredentialsManager;
