import { useState } from "react";
import { Certificado } from "@/hooks/useLMSCertificados";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Award, Download, X, Trophy, Loader2, Star } from "lucide-react";
import { CertificatePDFDocument, type CertificatePDFData } from "../pdf/CertificatePDFDocument";
import { loadImageAsBase64 } from "@/components/pdf/utils";
import { toast } from "sonner";

interface CertificadoViewerProps {
  certificado: Certificado | null;
  open: boolean;
  onClose: () => void;
}

export const CertificadoViewer = ({ certificado, open, onClose }: CertificadoViewerProps) => {
  const [downloading, setDownloading] = useState(false);

  if (!certificado) return null;

  const { datos_certificado } = certificado;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const { pdf } = await import('@react-pdf/renderer');

      let logoBase64: string | null = null;
      try {
        logoBase64 = await loadImageAsBase64('/detecta-logo-full.png');
      } catch { /* optional */ }

      const pdfData: CertificatePDFData = {
        nombreUsuario: datos_certificado.nombre_usuario,
        tituloCurso: datos_certificado.titulo_curso,
        calificacion: datos_certificado.calificacion,
        fechaCompletado: datos_certificado.fecha_completado,
        codigoVerificacion: certificado.codigo_verificacion,
        duracionCurso: datos_certificado.duracion_curso,
        logoBase64,
      };

      const blob = await pdf(<CertificatePDFDocument {...pdfData} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificado-${datos_certificado.nombre_usuario.replace(/\s+/g, '-').toLowerCase()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Certificado descargado');
    } catch (err) {
      console.error('Error generating PDF:', err);
      toast.error('Error al generar el PDF');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-amber-500" />
            Certificado
          </DialogTitle>
        </DialogHeader>

        {/* Certificate visual */}
        <div className="relative mx-auto w-full">
          {/* Golden glow */}
          <div className="absolute -inset-1 bg-gradient-to-br from-amber-200/40 via-yellow-100/30 to-amber-200/40 rounded-2xl blur-sm" />

          <div className="relative bg-gradient-to-br from-amber-50/80 via-white to-amber-50/60 border-2 border-amber-300/60 rounded-xl p-8 shadow-lg">
            <div className="border border-amber-200/50 rounded-lg p-6 text-center space-y-5">

              {/* Trophy */}
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-md">
                  <Trophy className="h-8 w-8 text-white" />
                </div>
              </div>

              {/* Title */}
              <div>
                <h2 className="text-xl font-bold tracking-widest text-foreground uppercase">
                  Certificado de Finalización
                </h2>
                <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent mx-auto mt-3" />
              </div>

              <p className="text-xs text-muted-foreground uppercase tracking-wider">Se certifica que</p>

              <h3 className="text-3xl font-serif italic text-foreground">
                {datos_certificado.nombre_usuario}
              </h3>

              <div>
                <p className="text-sm text-muted-foreground">ha completado satisfactoriamente el curso</p>
                <p className="text-lg font-semibold text-foreground mt-1">
                  «{datos_certificado.titulo_curso}»
                </p>
              </div>

              {/* Details */}
              <div className="flex items-center justify-center gap-6 text-sm">
                <div className="text-center">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Calificación</span>
                  <span className="font-bold text-lg text-amber-600">{datos_certificado.calificacion}%</span>
                </div>
                <div className="w-px h-8 bg-amber-300/50" />
                <div className="text-center">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Fecha</span>
                  <span className="font-medium text-foreground">{datos_certificado.fecha_completado}</span>
                </div>
                {datos_certificado.duracion_curso > 0 && (
                  <>
                    <div className="w-px h-8 bg-amber-300/50" />
                    <div className="text-center">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Duración</span>
                      <span className="font-medium text-foreground">{datos_certificado.duracion_curso} min</span>
                    </div>
                  </>
                )}
              </div>

              {/* Seal */}
              <div className="flex justify-center">
                <div className="w-14 h-14 rounded-full border-2 border-amber-400 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full border border-amber-300 flex items-center justify-center">
                    <Award className="h-5 w-5 text-amber-500" />
                  </div>
                </div>
              </div>

              <p className="text-[10px] text-muted-foreground font-mono tracking-widest">
                Código: {certificado.codigo_verificacion}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Cerrar
          </Button>
          <Button onClick={handleDownload} disabled={downloading}>
            {downloading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Descargar PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
