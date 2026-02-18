import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Award, Download, CheckCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { CertificadoPlantillaContent } from "@/types/lms";

interface CertificadoPlantillaViewerProps {
  content: CertificadoPlantillaContent;
  inscripcionId?: string;
  cursoTitulo?: string;
  onComplete?: () => void;
}

interface PlantillaData {
  plantilla_html: string;
  estilos_css?: string;
  nombre: string;
}

function substituteVariables(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
}

export function CertificadoPlantillaViewer({
  content,
  inscripcionId,
  cursoTitulo,
  onComplete,
}: CertificadoPlantillaViewerProps) {
  const certRef = useRef<HTMLDivElement>(null);
  const [plantilla, setPlantilla] = useState<PlantillaData | null>(null);
  const [renderedHtml, setRenderedHtml] = useState<string>('');
  const [userName, setUserName] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [marked, setMarked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // Obtener datos del usuario actual
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

        // Cargar plantilla
        const { data: plantillaData, error } = await supabase
          .from('lms_certificados_plantillas')
          .select('nombre, plantilla_html, estilos_css')
          .eq('id', content.plantilla_id)
          .single();

        if (error || !plantillaData) {
          toast.error('No se encontró la plantilla de certificado');
          return;
        }

        setPlantilla(plantillaData as PlantillaData);

        // Sustituir variables
        const vars: Record<string, string> = {
          nombre_usuario: nombre,
          titulo_curso: cursoTitulo || content.plantilla_nombre || 'Curso',
          fecha_completado: new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' }),
          calificacion: '100',
          duracion_curso: '',
          codigo_verificacion: inscripcionId?.slice(0, 8).toUpperCase() ?? 'N/A',
          ...content.personalizar_variables,
        };

        const html = substituteVariables((plantillaData as PlantillaData).plantilla_html, vars);
        setRenderedHtml(html);
      } catch (err) {
        console.error('Error loading certificate template:', err);
        toast.error('Error al cargar la plantilla');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [content.plantilla_id, cursoTitulo, inscripcionId]);

  const handleDownload = async () => {
    if (!certRef.current) return;
    setDownloading(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const canvas = await html2canvas(certRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [canvas.width / 2, canvas.height / 2],
      });

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
      pdf.save(`certificado-${userName.replace(/\s+/g, '-').toLowerCase()}.pdf`);
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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Award className="h-5 w-5 text-amber-500" />
          <span className="font-medium text-sm">Constancia: {plantilla?.nombre ?? content.plantilla_nombre}</span>
        </div>
        <div className="flex items-center gap-2">
          {marked && (
            <Badge className="gap-1 bg-green-100 text-green-800 border-green-200">
              <CheckCircle className="h-3 w-3" />
              Visto
            </Badge>
          )}
          <Button size="sm" variant="outline" onClick={handleDownload} disabled={downloading || !renderedHtml}>
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

      {/* Certificate preview */}
      {renderedHtml ? (
        <>
          {plantilla?.estilos_css && (
            <style dangerouslySetInnerHTML={{ __html: plantilla.estilos_css }} />
          )}
          <div
            ref={certRef}
            className="border rounded-xl overflow-hidden shadow-sm bg-white"
            dangerouslySetInnerHTML={{ __html: renderedHtml }}
          />
        </>
      ) : (
        <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
          No se pudo renderizar la plantilla.
        </div>
      )}
    </div>
  );
}
