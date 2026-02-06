import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Settings, 
  Copy, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  MessageCircle,
  ExternalLink
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const KapsoConfig = () => {
  const { toast } = useToast();
  const [testing, setTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'error'>('unknown');
  const [lastTestResult, setLastTestResult] = useState<string | null>(null);
  
  // URL del webhook para configurar en Kapso
  const webhookUrl = `https://yydzzeljaewsfhmilnhm.supabase.co/functions/v1/kapso-webhook-receiver`;
  
  const copyWebhookUrl = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      toast({
        title: 'URL copiada',
        description: 'La URL del webhook ha sido copiada al portapapeles'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo copiar la URL',
        variant: 'destructive'
      });
    }
  };
  
  const testConnection = async () => {
    setTesting(true);
    setLastTestResult(null);
    
    try {
      // Probar enviando un mensaje de prueba
      const { data, error } = await supabase.functions.invoke('kapso-send-message', {
        body: {
          to: '5215512345678', // Número de prueba
          type: 'text',
          text: 'Test de conexión Kapso - Detecta',
          context: {
            tipo_notificacion: 'test_connection'
          }
        }
      });
      
      if (error) {
        const errorMsg = error.message || String(error);
        
        // Si el error es por la regla de 24 horas de WhatsApp, las credenciales son válidas
        if (errorMsg.includes('WHATSAPP_24H_RULE') || errorMsg.includes('24-hour') || errorMsg.includes('template')) {
          setConnectionStatus('connected');
          setLastTestResult(
            `✅ Conexión exitosa - Credenciales válidas.\n` +
            `⚠️ Nota: Para enviar mensajes se requieren templates aprobados por WhatsApp (regla de 24 horas).`
          );
          toast({
            title: 'Conexión exitosa',
            description: 'Las credenciales de Kapso son válidas. Se requieren templates para mensajería.'
          });
          return;
        }
        
        throw error;
      }
      
      if (data.success) {
        setConnectionStatus('connected');
        setLastTestResult(`✅ Conexión exitosa. Message ID: ${data.message_id}`);
        toast({
          title: 'Conexión exitosa',
          description: 'La integración con Kapso está funcionando correctamente'
        });
      } else {
        const errorMsg = data.error || 'Error desconocido';
        
        // También verificar en la respuesta de data
        if (errorMsg.includes('WHATSAPP_24H_RULE') || errorMsg.includes('24-hour') || errorMsg.includes('template')) {
          setConnectionStatus('connected');
          setLastTestResult(
            `✅ Conexión exitosa - Credenciales válidas.\n` +
            `⚠️ Nota: Para enviar mensajes se requieren templates aprobados por WhatsApp.`
          );
          toast({
            title: 'Conexión exitosa',
            description: 'Las credenciales de Kapso son válidas.'
          });
          return;
        }
        
        throw new Error(errorMsg);
      }
    } catch (error: any) {
      console.error('Error probando conexión:', error);
      const errorMsg = error.message || String(error);
      
      // Última verificación para la regla de 24 horas
      if (errorMsg.includes('WHATSAPP_24H_RULE') || errorMsg.includes('24-hour') || errorMsg.includes('template')) {
        setConnectionStatus('connected');
        setLastTestResult(
          `✅ Conexión exitosa - Credenciales válidas.\n` +
          `⚠️ Nota: Para enviar mensajes se requieren templates aprobados por WhatsApp.`
        );
        toast({
          title: 'Conexión exitosa',
          description: 'Las credenciales de Kapso son válidas.'
        });
        return;
      }
      
      setConnectionStatus('error');
      setLastTestResult(`❌ Error: ${errorMsg}`);
      toast({
        title: 'Error de conexión',
        description: errorMsg,
        variant: 'destructive'
      });
    } finally {
      setTesting(false);
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Estado de conexión */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Integración Kapso WhatsApp
          </CardTitle>
          <CardDescription>
            Configuración de la API oficial de WhatsApp Cloud via Kapso
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              {connectionStatus === 'connected' && (
                <CheckCircle2 className="w-5 h-5 text-success" />
              )}
              {connectionStatus === 'error' && (
                <AlertCircle className="w-5 h-5 text-destructive" />
              )}
              {connectionStatus === 'unknown' && (
                <Settings className="w-5 h-5 text-muted-foreground" />
              )}
              <div>
                <p className="font-medium">Estado de Conexión</p>
                <p className="text-sm text-muted-foreground">
                  {connectionStatus === 'connected' && 'Conectado y funcionando'}
                  {connectionStatus === 'error' && 'Error de conexión'}
                  {connectionStatus === 'unknown' && 'No verificado'}
                </p>
              </div>
            </div>
            <Badge 
              variant={
                connectionStatus === 'connected' ? 'default' : 
                connectionStatus === 'error' ? 'destructive' : 
                'secondary'
              }
            >
              {connectionStatus === 'connected' ? '✅ Conectado' : 
               connectionStatus === 'error' ? '❌ Error' : 
               '⚪ Sin verificar'}
            </Badge>
          </div>
          
          <Button 
            onClick={testConnection} 
            disabled={testing}
            className="w-full"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${testing ? 'animate-spin' : ''}`} />
            {testing ? 'Probando conexión...' : 'Probar Conexión'}
          </Button>
          
          {lastTestResult && (
            <Alert variant={connectionStatus === 'connected' ? 'default' : 'destructive'}>
              <AlertDescription className="font-mono text-sm">
                {lastTestResult}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
      
      {/* Configuración de Webhook */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configuración de Webhook
          </CardTitle>
          <CardDescription>
            URL para recibir mensajes entrantes desde Kapso
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Webhook URL</Label>
            <div className="flex gap-2">
              <Input 
                value={webhookUrl}
                readOnly
                className="font-mono text-sm"
              />
              <Button variant="outline" onClick={copyWebhookUrl}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Configura esta URL en el dashboard de Kapso para recibir mensajes entrantes
            </p>
          </div>
          
          <div className="space-y-2">
            <Label>Verify Token</Label>
            <Input 
              value="detecta_kapso_webhook"
              readOnly
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Token de verificación para el webhook (usa este valor en Kapso)
            </p>
          </div>
          
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => window.open('https://dashboard.kapso.ai', '_blank')}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Abrir Dashboard de Kapso
          </Button>
        </CardContent>
      </Card>
      
      {/* Información de la integración */}
      <Card>
        <CardHeader>
          <CardTitle>Funcionalidades Habilitadas</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-success" />
              Envío de mensajes de texto
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-success" />
              Envío de imágenes y documentos
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-success" />
              Mensajes interactivos con botones
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-success" />
              Recepción de mensajes (bidireccional)
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-success" />
              Confirmación de servicios via WhatsApp
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-success" />
              Creación automática de tickets
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-success" />
              Tracking de delivery (enviado/entregado/leído)
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default KapsoConfig;
