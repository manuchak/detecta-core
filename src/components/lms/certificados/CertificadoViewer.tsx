import { Certificado } from "@/hooks/useLMSCertificados";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Award, Printer, X } from "lucide-react";
import { useRef } from "react";

interface CertificadoViewerProps {
  certificado: Certificado | null;
  open: boolean;
  onClose: () => void;
}

export const CertificadoViewer = ({ certificado, open, onClose }: CertificadoViewerProps) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!certificado) return null;

  const { datos_certificado } = certificado;

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Certificado - ${datos_certificado.titulo_curso}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Georgia', serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              background: white;
            }
            .certificate {
              width: 800px;
              padding: 60px;
              border: 8px double #1a365d;
              background: linear-gradient(135deg, #fefefe 0%, #f8f9fa 100%);
              text-align: center;
            }
            .header { margin-bottom: 30px; }
            .header h1 {
              font-size: 32px;
              color: #1a365d;
              letter-spacing: 2px;
              margin-bottom: 10px;
            }
            .divider {
              width: 200px;
              height: 2px;
              background: linear-gradient(90deg, transparent, #1a365d, transparent);
              margin: 20px auto;
            }
            .subtitle {
              font-size: 14px;
              color: #666;
              margin-bottom: 20px;
            }
            .name {
              font-size: 36px;
              color: #1a365d;
              font-style: italic;
              margin: 20px 0;
            }
            .description {
              font-size: 16px;
              color: #444;
              margin: 15px 0;
            }
            .course {
              font-size: 24px;
              color: #2d3748;
              margin: 20px 0;
              font-weight: bold;
            }
            .details {
              font-size: 14px;
              color: #666;
              margin: 20px 0;
              line-height: 1.8;
            }
            .date {
              font-size: 14px;
              color: #666;
              margin-top: 30px;
            }
            .verification {
              font-size: 12px;
              color: #888;
              margin-top: 40px;
              font-family: monospace;
            }
            .seal {
              margin-top: 30px;
            }
            .seal-icon {
              width: 60px;
              height: 60px;
              border: 2px solid #1a365d;
              border-radius: 50%;
              margin: 0 auto;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 24px;
            }
          </style>
        </head>
        <body>
          <div class="certificate">
            <div class="header">
              <h1>CERTIFICADO DE FINALIZACIÓN</h1>
            </div>
            <div class="divider"></div>
            <p class="subtitle">Se certifica que</p>
            <h2 class="name">${datos_certificado.nombre_usuario}</h2>
            <p class="description">ha completado satisfactoriamente el curso</p>
            <h3 class="course">"${datos_certificado.titulo_curso}"</h3>
            <p class="details">
              Con una calificación de <strong>${datos_certificado.calificacion}%</strong><br>
              Duración del curso: ${datos_certificado.duracion_curso} minutos
            </p>
            <p class="date">
              Fecha de finalización: ${datos_certificado.fecha_completado}
            </p>
            <div class="seal">
              <div class="seal-icon">🏆</div>
            </div>
            <p class="verification">
              Código de verificación: ${certificado.codigo_verificacion}
            </p>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Certificado
          </DialogTitle>
        </DialogHeader>

        <div ref={printRef} className="p-8 bg-gradient-to-br from-slate-50 to-white border-8 border-double border-slate-300 rounded-lg">
          <div className="text-center space-y-6">
            <div>
              <h1 className="text-3xl font-serif text-slate-800 tracking-wider">
                CERTIFICADO DE FINALIZACIÓN
              </h1>
              <div className="w-48 h-0.5 bg-gradient-to-r from-transparent via-slate-400 to-transparent mx-auto mt-4" />
            </div>

            <p className="text-sm text-muted-foreground">Se certifica que</p>

            <h2 className="text-4xl font-serif italic text-slate-800">
              {datos_certificado.nombre_usuario}
            </h2>

            <p className="text-muted-foreground">ha completado satisfactoriamente el curso</p>

            <h3 className="text-2xl font-semibold text-slate-700">
              "{datos_certificado.titulo_curso}"
            </h3>

            <div className="text-sm text-muted-foreground space-y-1">
              <p>Con una calificación de <strong>{datos_certificado.calificacion}%</strong></p>
              <p>Duración del curso: {datos_certificado.duracion_curso} minutos</p>
            </div>

            <p className="text-sm text-muted-foreground pt-4">
              Fecha de finalización: {datos_certificado.fecha_completado}
            </p>

            <div className="pt-6">
              <div className="w-16 h-16 mx-auto border-2 border-slate-400 rounded-full flex items-center justify-center">
                <Award className="h-8 w-8 text-slate-600" />
              </div>
            </div>

            <p className="text-xs text-muted-foreground font-mono pt-4">
              Código de verificación: {certificado.codigo_verificacion}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Cerrar
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
