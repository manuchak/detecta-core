import { useState } from "react";
import { useLMSVerificarCertificado } from "@/hooks/useLMSCertificados";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Award, CheckCircle, XCircle, Search, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function VerificarCertificado() {
  const [codigo, setCodigo] = useState("");
  const verificar = useLMSVerificarCertificado();

  const handleVerificar = () => {
    if (codigo.trim().length < 10) return;
    verificar.mutate(codigo.trim());
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto p-3 bg-primary/10 rounded-full w-fit mb-4">
            <Award className="h-8 w-8 text-primary" />
          </div>
          <CardTitle>Verificar Certificado</CardTitle>
          <CardDescription>
            Ingresa el código de verificación para validar la autenticidad del certificado
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="XXXX-XXXX-XXXX"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.toUpperCase())}
              className="font-mono text-center"
              maxLength={14}
            />
            <Button 
              onClick={handleVerificar} 
              disabled={codigo.length < 10 || verificar.isPending}
            >
              {verificar.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>

          {verificar.data && (
            <>
              {verificar.data.valido ? (
                <Alert className="border-green-500 bg-green-50 dark:bg-green-950/20">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    <div className="space-y-2">
                      <p className="font-semibold">✓ Certificado Válido</p>
                      <div className="text-sm space-y-1">
                        <p><strong>Nombre:</strong> {verificar.data.datos?.nombre_usuario}</p>
                        <p><strong>Curso:</strong> {verificar.data.curso}</p>
                        <p><strong>Calificación:</strong> {verificar.data.datos?.calificacion}%</p>
                        <p><strong>Fecha:</strong> {verificar.data.datos?.fecha_completado}</p>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    Certificado no encontrado. Verifica que el código sea correcto.
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}

          <p className="text-xs text-center text-muted-foreground">
            El código se encuentra en la parte inferior del certificado
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
