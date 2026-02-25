import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Award, Download, CheckCircle, Loader2, Trophy, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { CertificadoPlantillaContent } from "@/types/lms";
import { CertificatePDFDocument, type CertificatePDFData } from "./pdf/CertificatePDFDocument";
import { loadImageAsBase64 } from "@/components/pdf/utils";

interface CertificadoPlantillaViewerProps {
  content: CertificadoPlantillaContent;
  inscripcionId?: string;
  cursoTitulo?: string;
  onComplete?: () => void;
}

export function CertificadoPlantillaViewer({
  content,
  inscripcionId,
  cursoTitulo,
  onComplete,
}: CertificadoPlantillaViewerProps) {
  const [userName, setUserName] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [marked, setMarked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fechaCompletado, setFechaCompletado] = useState('');
  const [codigoVerificacion, setCodigoVerificacion] = useState('');
  const [plantillaNombre, setPlantillaNombre] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const uid = user?.id;

        let nombre = user?.email?.split('@')[0] ?? 'Usuario';
        if (uid) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, nombre_completo')
            .eq('id', uid)
            .maybeSingle();
          if (profile) {
            nombre = (profile as any).display_name || (profile as any).nombre_completo || nombre;
          }
        }
        setUserName(nombre);

        const fecha = new Date().toLocaleDateString('es-MX', {
          year: 'numeric', month: 'long', day: 'numeric',
        });
        setFechaCompletado(fecha);
        setCodigoVerificacion(inscripcionId?.slice(0, 8).toUpperCase() ?? 'N/A');

        // Load plantilla name
        const { data: plantillaData } = await supabase
          .from('lms_certificados_plantillas')
          .select('nombre')
          .eq('id', content.plantilla_id)
          .single();
        setPlantillaNombre(plantillaData?.nombre ?? content.plantilla_nombre ?? 'Constancia');
      } catch (err) {
        console.error('Error loading certificate data:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [content.plantilla_id, inscripcionId]);

  const titulo = cursoTitulo || content.plantilla_nombre || 'Curso';

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const { pdf } = await import('@react-pdf/renderer');

      let logoBase64: string | null = null;
      try {
        logoBase64 = await loadImageAsBase64('/lovable-uploads/detecta-logo.png');
      } catch { /* logo optional */ }

      const pdfData: CertificatePDFData = {
        nombreUsuario: userName,
        tituloCurso: titulo,
        calificacion: 100,
        fechaCompletado,
        codigoVerificacion,
        logoBase64,
      };

      const blob = await pdf(<CertificatePDFDocument {...pdfData} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificado-${userName.replace(/\s+/g, '-').toLowerCase()}.pdf`;
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

  const handleMarkComplete = () => {
    setMarked(true);
    onComplete?.();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 gap-3 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm">Cargando certificado...</span>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Congratulations banner */}
      <div className="text-center py-4">
        <div className="inline-flex items-center gap-2 mb-2">
          <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
          <span className="text-lg font-semibold text-foreground">¡Felicidades!</span>
          <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
        </div>
        <p className="text-sm text-muted-foreground">
          Has completado exitosamente este módulo
        </p>
      </div>

      {/* Certificate card */}
      <div className="relative mx-auto max-w-2xl">
        {/* Outer golden glow */}
        <div className="absolute -inset-1 bg-gradient-to-br from-amber-200/40 via-yellow-100/30 to-amber-200/40 rounded-2xl blur-sm" />

        {/* Certificate body */}
        <div className="relative bg-gradient-to-br from-amber-50/80 via-white to-amber-50/60 border-2 border-amber-300/60 rounded-xl p-8 shadow-lg">
          {/* Inner decorative border */}
          <div className="border border-amber-200/50 rounded-lg p-6 text-center space-y-5">

            {/* Trophy icon */}
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

            {/* Certifies */}
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              Se certifica que
            </p>

            {/* Student name */}
            <h3 className="text-3xl font-serif italic text-foreground">
              {userName}
            </h3>

            {/* Course */}
            <div>
              <p className="text-sm text-muted-foreground">
                ha completado satisfactoriamente el curso
              </p>
              <p className="text-lg font-semibold text-foreground mt-1">
                «{titulo}»
              </p>
            </div>

            {/* Details row */}
            <div className="flex items-center justify-center gap-6 text-sm">
              <div className="text-center">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Calificación</span>
                <span className="font-bold text-lg text-amber-600">100%</span>
              </div>
              <div className="w-px h-8 bg-amber-300/50" />
              <div className="text-center">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Fecha</span>
                <span className="font-medium text-foreground">{fechaCompletado}</span>
              </div>
            </div>

            {/* Seal */}
            <div className="flex justify-center">
              <div className="w-14 h-14 rounded-full border-2 border-amber-400 flex items-center justify-center">
                <div className="w-10 h-10 rounded-full border border-amber-300 flex items-center justify-center">
                  <Award className="h-5 w-5 text-amber-500" />
                </div>
              </div>
            </div>

            {/* Verification code */}
            <p className="text-[10px] text-muted-foreground font-mono tracking-widest">
              Código: {codigoVerificacion}
            </p>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-center gap-3">
        {marked && (
          <Badge className="gap-1 bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="h-3 w-3" />
            Visto
          </Badge>
        )}
        <Button size="sm" variant="outline" onClick={handleDownload} disabled={downloading}>
          {downloading ? (
            <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-1.5" />
          )}
          Descargar PDF
        </Button>
        {!marked && (
          <Button size="sm" onClick={handleMarkComplete}>
            <CheckCircle className="h-4 w-4 mr-1.5" />
            Marcar como visto
          </Button>
        )}
      </div>
    </div>
  );
}
