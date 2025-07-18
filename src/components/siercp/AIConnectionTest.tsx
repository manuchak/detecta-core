import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff, Brain, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useSIERCPAI } from "@/hooks/useSIERCPAI";

const AIConnectionTest = () => {
  const { loading, connected, validateConnection } = useSIERCPAI();
  const [testStarted, setTestStarted] = useState(false);

  const handleTest = async () => {
    setTestStarted(true);
    await validateConnection();
  };

  const getConnectionStatus = () => {
    if (!testStarted) {
      return {
        icon: Brain,
        color: "bg-gray-500",
        text: "No probado",
        variant: "secondary" as const
      };
    }
    
    if (loading) {
      return {
        icon: Loader2,
        color: "bg-blue-500",
        text: "Probando...",
        variant: "secondary" as const
      };
    }
    
    if (connected === true) {
      return {
        icon: CheckCircle,
        color: "bg-green-500",
        text: "Conectado",
        variant: "default" as const
      };
    }
    
    if (connected === false) {
      return {
        icon: AlertCircle,
        color: "bg-red-500",
        text: "Desconectado",
        variant: "destructive" as const
      };
    }

    return {
      icon: Brain,
      color: "bg-gray-500",
      text: "Desconocido",
      variant: "secondary" as const
    };
  };

  const status = getConnectionStatus();
  const StatusIcon = status.icon;

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-600" />
          Estado de ChatGPT AI
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Conexión API:</span>
          <Badge variant={status.variant} className="flex items-center gap-1">
            <StatusIcon className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            {status.text}
          </Badge>
        </div>

        <div className="space-y-2">
          <Button 
            onClick={handleTest}
            disabled={loading}
            className="w-full"
            variant="outline"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Probando conexión...
              </>
            ) : (
              <>
                <Wifi className="h-4 w-4 mr-2" />
                Probar Conexión
              </>
            )}
          </Button>

          {connected === true && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-800 text-sm">
                <CheckCircle className="h-4 w-4" />
                <span className="font-medium">¡Conexión activa!</span>
              </div>
              <p className="text-xs text-green-600 mt-1">
                ChatGPT está listo para asistir en el proceso de evaluación SIERCP
              </p>
            </div>
          )}

          {connected === false && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-800 text-sm">
                <WifiOff className="h-4 w-4" />
                <span className="font-medium">Sin conexión</span>
              </div>
              <p className="text-xs text-red-600 mt-1">
                Verifica que la clave API de OpenAI esté configurada correctamente
              </p>
            </div>
          )}
        </div>

        <div className="pt-4 border-t">
          <h4 className="font-medium text-sm mb-2">Funciones disponibles con AI:</h4>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Análisis inteligente de respuestas</li>
            <li>• Identificación de patrones de riesgo</li>
            <li>• Generación de insights clínicos</li>
            <li>• Recomendaciones personalizadas</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIConnectionTest;