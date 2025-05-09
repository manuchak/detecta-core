
import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Copy, CheckCircle, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ApiCredential {
  service_name: string;
  user: string;
  password: string;
  connection_string: string;
}

export const ApiCredentialsManager: React.FC = () => {
  const { toast } = useToast();
  const [serviceName, setServiceName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [credentials, setCredentials] = useState<ApiCredential | null>(null);
  const [showCredentials, setShowCredentials] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCreateApiAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!serviceName.trim()) {
      toast({
        title: "Error",
        description: "Por favor proporciona un nombre para el servicio",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-readonly-access', {
        body: { serviceName: serviceName.trim() }
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setCredentials(data);
      setShowCredentials(true);
      setServiceName('');
      
    } catch (error) {
      console.error('Error creating API access:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudieron crear las credenciales",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
        toast({
          title: "Error",
          description: "No se pudo copiar al portapapeles",
          variant: "destructive",
        });
      });
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
        <form onSubmit={handleCreateApiAccess}>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="service-name">Nombre del Servicio</Label>
              <Input
                id="service-name"
                placeholder="Nombre del servicio o integración"
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                disabled={isLoading}
              />
            </div>
            
            <Alert variant="default" className="bg-muted/50 border-muted">
              <AlertTitle>Información de Acceso</AlertTitle>
              <AlertDescription>
                Las credenciales generadas tendrán acceso de solo lectura a la tabla de servicios de custodia.
                Estas credenciales son sensibles y deben compartirse de manera segura.
              </AlertDescription>
            </Alert>
          </div>
          
          <Button 
            type="submit" 
            className="mt-4 w-full" 
            disabled={isLoading || !serviceName.trim()}
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
                  <Input value={credentials.password} readOnly type="password" />
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => copyToClipboard(credentials.password, 'password')}
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
                  <Input value={credentials.connection_string} readOnly />
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => copyToClipboard(credentials.connection_string, 'connection_string')}
                  >
                    {copiedField === 'connection_string' ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              
              <Alert variant="destructive" className="bg-destructive/10">
                <AlertTitle>¡Importante!</AlertTitle>
                <AlertDescription className="text-sm">
                  Esta será la única vez que podrás ver la contraseña. Asegúrate de guardarla en un lugar seguro. Si la pierdes, 
                  tendrás que generar nuevas credenciales.
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
