import { Certificado } from "@/hooks/useLMSCertificados";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Award, Download, ExternalLink, Copy, Check } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useState } from "react";
import { toast } from "sonner";

interface CertificadoCardProps {
  certificado: Certificado;
  onView?: () => void;
}

export const CertificadoCard = ({ certificado, onView }: CertificadoCardProps) => {
  const [copied, setCopied] = useState(false);
  const { datos_certificado } = certificado;

  const handleCopyCodigo = async () => {
    try {
      await navigator.clipboard.writeText(certificado.codigo_verificacion);
      setCopied(true);
      toast.success('Código copiado al portapapeles');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Error al copiar');
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-0">
        <div className="bg-gradient-to-r from-primary/20 to-primary/5 p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary/20 rounded-lg">
              <Award className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate">
                {datos_certificado.titulo_curso}
              </h3>
              <p className="text-sm text-muted-foreground">
                {format(new Date(certificado.fecha_emision), "d 'de' MMMM, yyyy", { locale: es })}
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Calificación</span>
            <span className="font-medium">{datos_certificado.calificacion}%</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Código</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-1 font-mono text-xs"
              onClick={handleCopyCodigo}
            >
              {certificado.codigo_verificacion}
              {copied ? (
                <Check className="h-3 w-3 ml-1 text-green-500" />
              ) : (
                <Copy className="h-3 w-3 ml-1" />
              )}
            </Button>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={onView}
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              Ver
            </Button>
            {certificado.pdf_url && (
              <Button
                variant="default"
                size="sm"
                className="flex-1"
                asChild
              >
                <a href={certificado.pdf_url} download>
                  <Download className="h-4 w-4 mr-1" />
                  Descargar
                </a>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
