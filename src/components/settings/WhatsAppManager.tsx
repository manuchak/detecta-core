import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { 
  Smartphone, 
  QrCode, 
  Wifi, 
  WifiOff, 
  MessageSquare, 
  Settings, 
  Clock,
  RefreshCw,
  Phone,
  CheckCircle,
  XCircle,
  AlertTriangle
} from "lucide-react";
import { toast } from "sonner";

interface WhatsAppConfig {
  id: string;
  phone_number: string | null;
  is_active: boolean;
  connection_status: string;
  welcome_message: string;
  business_hours_start: string;
  business_hours_end: string;
  auto_reply_enabled: boolean;
  last_connected_at: string | null;
  qr_code: string | null;
}

export const WhatsAppManager = () => {
  const [config, setConfig] = useState<WhatsAppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [qrVisible, setQrVisible] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [businessHoursStart, setBusinessHoursStart] = useState("09:00");
  const [businessHoursEnd, setBusinessHoursEnd] = useState("18:00");
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(true);

  useEffect(() => {
    loadConfiguration();
  }, []);

  // Poll for connection status updates when QR is visible
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (qrVisible && config?.connection_status === 'connecting') {
      interval = setInterval(() => {
        loadConfiguration();
      }, 2000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [qrVisible, config?.connection_status]);

  const loadConfiguration = async () => {
    try {
      console.log('=== Loading WhatsApp Configuration ===');
      const { data, error } = await supabase
        .from('whatsapp_configurations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      console.log('Database query result:', { data, error });

      if (error) {
        console.error('Database error:', error);
        toast.error(`Error de base de datos: ${error.message}`);
        return;
      }

      if (data) {
        console.log('Configuration loaded:', data);
        setConfig(data);
        setPhoneNumber(data.phone_number || "");
        setWelcomeMessage(data.welcome_message || "Hola! Gracias por contactarnos. ¿En qué podemos ayudarte?");
        setBusinessHoursStart(data.business_hours_start || "09:00");
        setBusinessHoursEnd(data.business_hours_end || "18:00");
        setAutoReplyEnabled(data.auto_reply_enabled ?? true);
        
        // Mostrar QR si existe
        if (data.qr_code) {
          console.log('QR code found in configuration');
          setQrVisible(true);
        }
      } else {
        console.log('No configuration found in database');
        setConfig(null);
      }
    } catch (error) {
      console.error('Error loading WhatsApp configuration:', error);
      toast.error(`Error al cargar la configuración: ${error.message || 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  const generateQRCode = async () => {
    if (!phoneNumber.trim()) {
      toast.error('Por favor ingresa un número de teléfono');
      return;
    }

    console.log('=== Generating QR Code ===');
    console.log('Phone number:', phoneNumber);
    
    setGenerating(true);
    try {
      console.log('Calling WhatsApp bot function...');
      const { data, error } = await supabase.functions.invoke('whatsapp-bot', {
        body: { 
          action: 'generate_qr',
          phone_number: phoneNumber 
        }
      });

      console.log('Function response:', { data, error });

      if (error) {
        console.error('Function error:', error);
        throw error;
      }

      if (data?.error) {
        console.error('Function returned error:', data.error);
        throw new Error(data.error);
      }

      console.log('QR generation successful:', data);
      toast.success('Código QR generado. Escanéalo con WhatsApp Web.');
      setQrVisible(true);
      await loadConfiguration();
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast.error(`Error al generar código QR: ${error.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const saveConfiguration = async () => {
    console.log('=== Saving Configuration ===');
    setSaving(true);
    try {
      const configData = {
        phone_number: phoneNumber,
        is_active: config?.is_active ?? true,
        connection_status: config?.connection_status ?? 'disconnected',
        welcome_message: welcomeMessage,
        business_hours_start: businessHoursStart,
        business_hours_end: businessHoursEnd,
        auto_reply_enabled: autoReplyEnabled,
        last_connected_at: config?.last_connected_at,
        qr_code: config?.qr_code
      };

      console.log('Saving configuration data:', configData);

      const { data, error } = await supabase
        .from('whatsapp_configurations')
        .upsert(configData, { 
          onConflict: 'phone_number',
          ignoreDuplicates: false 
        })
        .select()
        .single();

      if (error) {
        console.error('Save error:', error);
        toast.error(`Error al guardar: ${error.message}`);
        return;
      }

      setConfig(data);
      console.log('Configuration saved successfully:', data);
      toast.success('Configuración guardada exitosamente ✅');
    } catch (error) {
      console.error('Error saving configuration:', error);
      toast.error(`Error al guardar la configuración: ${error.message || 'Error desconocido'}`);
    } finally {
      setSaving(false);
    }
  };

  const disconnectWhatsApp = async () => {
    try {
      const { error } = await supabase.functions.invoke('whatsapp-bot', {
        body: { action: 'disconnect' }
      });

      if (error) throw error;

      toast.success('WhatsApp desconectado');
      await loadConfiguration();
    } catch (error) {
      console.error('Error disconnecting WhatsApp:', error);
      toast.error('Error al desconectar WhatsApp');
    }
  };

  const getStatusBadge = () => {
    if (!config) return null;

    const status = config.connection_status;
    const statusConfig = {
      connected: { color: "default", icon: CheckCircle, text: "Conectado" },
      disconnected: { color: "secondary", icon: XCircle, text: "Desconectado" },
      connecting: { color: "secondary", icon: RefreshCw, text: "Conectando..." },
      error: { color: "destructive", icon: AlertTriangle, text: "Error" }
    };

    const currentStatus = statusConfig[status as keyof typeof statusConfig] || statusConfig.disconnected;
    const Icon = currentStatus.icon;

    return (
      <Badge variant={currentStatus.color as any} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {currentStatus.text}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Bot de WhatsApp</h2>
          <p className="text-muted-foreground">
            Configura y administra el bot de WhatsApp para atención al cliente
          </p>
        </div>
        {getStatusBadge()}
      </div>

      <Tabs defaultValue="connection" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="connection">Conexión</TabsTrigger>
          <TabsTrigger value="messages">Mensajes</TabsTrigger>
          <TabsTrigger value="templates">Plantillas</TabsTrigger>
          <TabsTrigger value="settings">Configuración</TabsTrigger>
        </TabsList>

        <TabsContent value="connection" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="w-5 h-5" />
                Configuración de Conexión
              </CardTitle>
              <CardDescription>
                Configura el número de WhatsApp que se usará para el bot
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Número de Teléfono</Label>
                <div className="flex gap-2">
                  <Input
                    id="phone"
                    placeholder="+52 55 1234 5678"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    disabled={config?.connection_status === 'connected'}
                  />
                  <Button
                    onClick={generateQRCode}
                    disabled={generating || config?.connection_status === 'connected'}
                    variant="outline"
                  >
                    {generating ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <QrCode className="w-4 h-4" />
                    )}
                    Generar QR
                  </Button>
                </div>
              </div>

              {config?.qr_code && (
                <Alert className="border-blue-200 bg-blue-50">
                  <QrCode className="h-4 w-4 text-blue-600" />
                  <AlertDescription>
                    <div className="space-y-4">
                      <div className="text-center">
                        <h4 className="font-semibold text-blue-800 mb-2">
                          Código QR Generado
                        </h4>
                        <p className="text-blue-700">
                          Escanea este código QR con WhatsApp Web para conectar el bot.
                        </p>
                      </div>
                      
                      <div className="flex justify-center">
                        <div className="p-6 bg-white rounded-xl border-2 border-blue-200 shadow-lg">
                          <img 
                            src={`data:image/svg+xml;base64,${config.qr_code}`} 
                            alt="Código QR para WhatsApp" 
                            className="w-56 h-56 block"
                            onLoad={() => console.log('QR image loaded successfully')}
                            onError={(e) => {
                              console.error('Error loading QR image:', e);
                              console.log('QR data length:', config.qr_code?.length);
                              console.log('QR data preview:', config.qr_code?.substring(0, 100));
                            }}
                          />
                        </div>
                      </div>

                      <div className="text-center space-y-2">
                        {config.connection_status === 'connecting' && (
                          <div className="flex items-center justify-center gap-2 text-blue-600">
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span className="font-medium">Esperando conexión...</span>
                          </div>
                        )}
                        {config.connection_status === 'disconnected' && (
                          <div className="text-orange-600">
                            <span className="font-medium">Listo para escanear</span>
                          </div>
                        )}
                      </div>

                      <div className="text-xs text-blue-600 text-center">
                        <p>1. Abre WhatsApp en tu teléfono</p>
                        <p>2. Ve a Menú → WhatsApp Web</p>
                        <p>3. Escanea este código QR</p>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {config?.connection_status === 'connected' && (
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-green-800">WhatsApp conectado exitosamente</span>
                  </div>
                  <Button
                    onClick={disconnectWhatsApp}
                    variant="outline"
                    size="sm"
                  >
                    Desconectar
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Mensajes Automáticos
              </CardTitle>
              <CardDescription>
                Configura los mensajes que enviará el bot automáticamente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="welcome">Mensaje de Bienvenida</Label>
                <Textarea
                  id="welcome"
                  placeholder="Mensaje que se enviará cuando alguien inicie una conversación"
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="auto-reply"
                  checked={autoReplyEnabled}
                  onCheckedChange={setAutoReplyEnabled}
                />
                <Label htmlFor="auto-reply">Habilitar respuestas automáticas</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Plantillas de Respuesta</CardTitle>
              <CardDescription>
                Gestiona las plantillas de respuesta rápida para el bot
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Las plantillas de respuesta se cargarán aquí próximamente...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Horarios de Atención
              </CardTitle>
              <CardDescription>
                Define los horarios en que el bot estará activo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start-time">Hora de Inicio</Label>
                  <Input
                    id="start-time"
                    type="time"
                    value={businessHoursStart}
                    onChange={(e) => setBusinessHoursStart(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-time">Hora de Fin</Label>
                  <Input
                    id="end-time"
                    type="time"
                    value={businessHoursEnd}
                    onChange={(e) => setBusinessHoursEnd(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Separator />

      <div className="flex justify-end">
        <Button onClick={saveConfiguration} disabled={saving}>
          {saving ? (
            <RefreshCw className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Settings className="w-4 h-4 mr-2" />
          )}
          Guardar Configuración
        </Button>
      </div>
    </div>
  );
};