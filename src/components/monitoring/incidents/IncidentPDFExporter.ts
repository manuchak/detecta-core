import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { IncidenteOperativo, EntradaCronologia } from '@/hooks/useIncidentesOperativos';
import type { ServicioVinculado } from '@/hooks/useServicioLookup';
import { loadImageAsBase64 } from '@/components/pdf';
import detectaLogoUrl from '@/assets/detecta-logo.png';

interface ExportData {
  incidente: IncidenteOperativo;
  cronologia: EntradaCronologia[];
  servicio?: ServicioVinculado;
}

/** Calculate response time between first detection and first action/notification */
function calcResponseTime(cronologia: EntradaCronologia[]): string {
  const sorted = [...cronologia].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  const detection = sorted.find(e => e.tipo_entrada === 'deteccion');
  const response = sorted.find(e => e.tipo_entrada === 'accion' || e.tipo_entrada === 'notificacion');
  if (!detection || !response) return 'N/D';
  const diffMs = new Date(response.timestamp).getTime() - new Date(detection.timestamp).getTime();
  if (diffMs < 0) return 'N/D';
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  const remainMins = mins % 60;
  return remainMins > 0 ? `${hrs}h ${remainMins}m` : `${hrs}h`;
}

export async function exportIncidentePDF({ incidente, cronologia, servicio }: ExportData) {
  // Dynamic import to keep bundle small
  const [{ pdf }, { IncidentPDFDocument }, { supabase }] = await Promise.all([
    import('@react-pdf/renderer'),
    import('./pdf/IncidentPDFDocument'),
    import('@/integrations/supabase/client'),
  ]);

  // Resolve creator name from profiles
  let reportadoPorNombre = '-';
  const incAny = incidente as any;
  if (incAny.reportado_por) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, email')
      .eq('id', incAny.reportado_por)
      .single();
    reportadoPorNombre = profile?.display_name || profile?.email || '-';
  } else if (incAny.firma_creacion_email) {
    reportadoPorNombre = incAny.firma_creacion_email;
  }

  const logoBase64 = await loadImageAsBase64(detectaLogoUrl);

  const imageCache = new Map<string, string | null>();
  await Promise.all(
    cronologia
      .filter(e => (e as any).imagen_url)
      .map(async (e) => {
        const url = (e as any).imagen_url;
        const data = await loadImageAsBase64(url);
        imageCache.set(url, data);
      })
  );

  const responseTime = calcResponseTime(cronologia);

  const doc = React.createElement(IncidentPDFDocument, {
    incidente, cronologia, servicio, logoBase64, imageCache, responseTime, reportadoPorNombre,
  });

  const blob = await (pdf as any)(doc).toBlob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `incidente-${incidente.id.slice(0, 8)}-${format(new Date(), 'yyyyMMdd', { locale: es })}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}
