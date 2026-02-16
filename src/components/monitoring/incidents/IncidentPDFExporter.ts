import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { IncidenteOperativo, EntradaCronologia } from '@/hooks/useIncidentesOperativos';
import { TIPOS_INCIDENTE, SEVERIDADES, TIPOS_ENTRADA_CRONOLOGIA } from '@/hooks/useIncidentesOperativos';
import type { ServicioVinculado } from '@/hooks/useServicioLookup';
import detectaLogoUrl from '@/assets/detecta-logo.png';

const CORPORATE_RED = [235, 0, 0] as const;
const CORPORATE_BLACK = [25, 25, 25] as const;
const CORPORATE_GRAY = [100, 100, 100] as const;
const LIGHT_GRAY = [240, 240, 240] as const;
const WHITE = [255, 255, 255] as const;

const SEV_COLORS: Record<string, [number, number, number]> = {
  baja: [34, 197, 94],
  media: [234, 179, 8],
  alta: [249, 115, 22],
  critica: [239, 68, 68],
};

interface ExportData {
  incidente: IncidenteOperativo;
  cronologia: EntradaCronologia[];
  servicio?: ServicioVinculado;
}

/** Load an image URL as base64 data URL */
async function loadImageAsBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { mode: 'cors' });
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/** Calculate response time between first detection and first action/notification */
function calcResponseTime(cronologia: EntradaCronologia[]): string | null {
  const sorted = [...cronologia].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  const detection = sorted.find(e => e.tipo_entrada === 'deteccion');
  const response = sorted.find(e => e.tipo_entrada === 'accion' || e.tipo_entrada === 'notificacion');
  if (!detection || !response) return null;
  const diffMs = new Date(response.timestamp).getTime() - new Date(detection.timestamp).getTime();
  if (diffMs < 0) return null;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  const remainMins = mins % 60;
  return remainMins > 0 ? `${hrs}h ${remainMins}m` : `${hrs}h`;
}

export async function exportIncidentePDF({ incidente, cronologia, servicio }: ExportData) {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const marginLeft = 20;
  const marginRight = 20;
  const contentWidth = pageWidth - marginLeft - marginRight;
  let y = 25;

  // Load logo
  const logoBase64 = await loadImageAsBase64(detectaLogoUrl);

  // Pre-load timeline images
  const sortedCrono = [...cronologia].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  const imageCache = new Map<string, string | null>();
  await Promise.all(
    sortedCrono
      .filter(e => (e as any).imagen_url)
      .map(async (e) => {
        const url = (e as any).imagen_url;
        const data = await loadImageAsBase64(url);
        imageCache.set(url, data);
      })
  );

  const checkPage = (needed: number) => {
    if (y + needed > pageHeight - 20) {
      pdf.addPage();
      y = 25;
      addHeader();
    }
  };

  const addHeader = () => {
    pdf.setFillColor(...CORPORATE_RED);
    pdf.rect(0, 0, pageWidth, 16, 'F');

    // Logo
    if (logoBase64) {
      try {
        pdf.addImage(logoBase64, 'PNG', marginLeft, 2, 12, 12);
      } catch { /* skip if logo fails */ }
    }

    const textX = logoBase64 ? marginLeft + 15 : marginLeft;
    pdf.setTextColor(...WHITE);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text('REPORTE DE INCIDENTE OPERATIVO', textX, 11);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.text(`ID: ${incidente.id.slice(0, 8)}`, pageWidth - marginRight, 11, { align: 'right' });
    pdf.setTextColor(...CORPORATE_BLACK);
  };

  const addFooter = () => {
    const pageCount = pdf.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFontSize(7);
      pdf.setTextColor(...CORPORATE_GRAY);
      pdf.text('Documento confidencial - Solo para uso interno', marginLeft, pageHeight - 8);
      pdf.text(
        `Generado: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}  |  Pagina ${i} de ${pageCount}`,
        pageWidth - marginRight,
        pageHeight - 8,
        { align: 'right' }
      );
    }
  };

  // ───── Header ─────
  addHeader();
  y = 25;

  // ───── Resumen Ejecutivo ─────
  const tipoLabel = TIPOS_INCIDENTE.find(t => t.value === incidente.tipo)?.label || incidente.tipo;
  const sevLabel = SEVERIDADES.find(s => s.value === incidente.severidad)?.label || incidente.severidad;
  const sevColor = SEV_COLORS[incidente.severidad] || CORPORATE_GRAY;
  const responseTime = calcResponseTime(cronologia);

  pdf.setFillColor(250, 250, 250);
  pdf.setDrawColor(220, 220, 220);
  pdf.roundedRect(marginLeft, y, contentWidth, 22, 2, 2, 'FD');

  const boxW = contentWidth / 5;
  const boxes = [
    { label: 'Tipo', value: tipoLabel },
    { label: 'Severidad', value: sevLabel, color: sevColor },
    { label: 'Cliente', value: incidente.cliente_nombre || '-' },
    { label: 'Zona', value: incidente.zona || '-' },
    { label: 'T. Respuesta', value: responseTime || 'N/D' },
  ];

  boxes.forEach((box, i) => {
    const bx = marginLeft + i * boxW;
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...CORPORATE_GRAY);
    pdf.text(box.label, bx + boxW / 2, y + 7, { align: 'center' });

    if (box.color) {
      // Severity circle
      pdf.setFillColor(box.color[0], box.color[1], box.color[2]);
      pdf.circle(bx + boxW / 2 - 10, y + 14, 2, 'F');
    }

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...CORPORATE_BLACK);
    const valText = pdf.splitTextToSize(String(box.value), boxW - 4);
    pdf.text(valText[0] || '', bx + boxW / 2, y + 15, { align: 'center' });
  });

  y += 28;

  // ───── Title ─────
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...CORPORATE_BLACK);
  pdf.text('Reporte de Incidente Operativo', marginLeft, y);
  y += 6;
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(...CORPORATE_GRAY);
  pdf.text(`Fecha: ${format(new Date(incidente.fecha_incidente), "dd 'de' MMMM yyyy, HH:mm", { locale: es })}`, marginLeft, y);
  y += 10;

  // ───── 1. Datos Generales ─────
  const addSectionHeader = (title: string) => {
    checkPage(12);
    pdf.setFillColor(...LIGHT_GRAY);
    pdf.rect(marginLeft, y, contentWidth, 7, 'F');
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...CORPORATE_BLACK);
    pdf.text(title, marginLeft + 3, y + 5);
    y += 12;
  };

  addSectionHeader('1. Datos Generales');

  const fields = [
    ['Tipo', tipoLabel],
    ['Severidad', sevLabel],
    ['Estado', incidente.estado],
    ['Zona', incidente.zona || '-'],
    ['Cliente', incidente.cliente_nombre || '-'],
    ['Reportado por', (incidente as any).reportado_por || '-'],
    ['Atribuible a operacion', incidente.atribuible_operacion ? 'Si' : 'No'],
  ];

  if (responseTime) {
    fields.push(['Tiempo de respuesta', responseTime]);
  }

  pdf.setFontSize(9);
  fields.forEach(([label, value]) => {
    checkPage(6);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...CORPORATE_GRAY);
    pdf.text(`${label}:`, marginLeft + 3, y);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...CORPORATE_BLACK);
    pdf.text(String(value), marginLeft + 50, y);
    y += 5;
  });

  y += 3;
  checkPage(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...CORPORATE_GRAY);
  pdf.text('Descripcion:', marginLeft + 3, y);
  y += 5;
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(...CORPORATE_BLACK);
  const descLines = pdf.splitTextToSize(incidente.descripcion, contentWidth - 6);
  descLines.forEach((line: string) => {
    checkPage(5);
    pdf.text(line, marginLeft + 3, y);
    y += 4.5;
  });
  y += 8;

  // ───── 2. Servicio Vinculado ─────
  if (servicio) {
    addSectionHeader('2. Servicio Vinculado');

    // Sanitize route text: replace → with -> and clean extra spaces
    const rutaRaw = [servicio.origen, servicio.destino].filter(Boolean).join(' -> ') || '-';
    const rutaClean = rutaRaw.replace(/\s+/g, ' ').trim();

    const svcFields = [
      ['ID Servicio', servicio.id_servicio],
      ['Cliente', servicio.nombre_cliente || '-'],
      ['Custodio', servicio.custodio_asignado || '-'],
      ['Vehiculo', [servicio.auto, servicio.placa].filter(Boolean).join(' - ') || '-'],
      ['Armado', servicio.armado_asignado || '-'],
      ['Tarifa', servicio.tarifa_acordada ? `$${Number(servicio.tarifa_acordada).toLocaleString('es-MX')}` : '-'],
      ['Ruta', rutaClean],
    ];

    pdf.setFontSize(9);
    svcFields.forEach(([label, value]) => {
      checkPage(6);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...CORPORATE_GRAY);
      pdf.text(`${label}:`, marginLeft + 3, y);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...CORPORATE_BLACK);
      const valLines = pdf.splitTextToSize(String(value), contentWidth - 55);
      valLines.forEach((line: string, li: number) => {
        if (li > 0) checkPage(5);
        pdf.text(line, marginLeft + 50, y);
        if (li < valLines.length - 1) y += 4.5;
      });
      y += 5;
    });
    y += 8;
  }

  // Ubicacion georeferenciada del incidente
  const incAny = incidente as any;
  if (incAny.ubicacion_lat && incAny.ubicacion_lng) {
    checkPage(10);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...CORPORATE_GRAY);
    pdf.text('Coordenadas:', marginLeft + 3, y);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...CORPORATE_BLACK);
    pdf.text(`${incAny.ubicacion_lat.toFixed(6)}, ${incAny.ubicacion_lng.toFixed(6)}`, marginLeft + 50, y);
    y += 8;
  }

  // ───── 3. Cronologia ─────
  addSectionHeader('3. Cronologia del Evento');

  if (sortedCrono.length === 0) {
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'italic');
    pdf.setTextColor(...CORPORATE_GRAY);
    pdf.text('Sin entradas registradas en la cronologia.', marginLeft + 3, y);
    y += 8;
  } else {
    for (const entry of sortedCrono) {
      checkPage(18);
      const tipoEntrada = TIPOS_ENTRADA_CRONOLOGIA.find(t => t.value === entry.tipo_entrada)?.label || entry.tipo_entrada;
      const ts = format(new Date(entry.timestamp), 'dd/MM HH:mm', { locale: es });

      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...CORPORATE_RED);
      pdf.text(`● ${ts}`, marginLeft + 3, y);
      pdf.setTextColor(...CORPORATE_GRAY);
      pdf.text(`[${tipoEntrada}]`, marginLeft + 30, y);
      y += 4.5;

      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...CORPORATE_BLACK);
      const entryLines = pdf.splitTextToSize(entry.descripcion, contentWidth - 10);
      entryLines.forEach((line: string) => {
        checkPage(4.5);
        pdf.text(line, marginLeft + 8, y);
        y += 4;
      });

      // Location
      const entryAny = entry as any;
      if (entryAny.ubicacion_texto) {
        checkPage(5);
        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'italic');
        pdf.setTextColor(100, 100, 160);
        pdf.text(`Ubicacion: ${entryAny.ubicacion_texto}`, marginLeft + 8, y);
        y += 4;
      } else if (entryAny.ubicacion_lat && entryAny.ubicacion_lng) {
        checkPage(5);
        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'italic');
        pdf.setTextColor(100, 100, 160);
        pdf.text(`Coords: ${entryAny.ubicacion_lat.toFixed(6)}, ${entryAny.ubicacion_lng.toFixed(6)}`, marginLeft + 8, y);
        y += 4;
      }

      // Image thumbnail
      const imgUrl = entryAny.imagen_url;
      if (imgUrl) {
        const imgData = imageCache.get(imgUrl);
        if (imgData) {
          checkPage(35);
          try {
            pdf.addImage(imgData, 'JPEG', marginLeft + 8, y, 40, 30);
            y += 32;
          } catch {
            pdf.setFontSize(7);
            pdf.setTextColor(...CORPORATE_GRAY);
            pdf.text('[Imagen no disponible]', marginLeft + 8, y);
            y += 5;
          }
        } else {
          checkPage(5);
          pdf.setFontSize(7);
          pdf.setFont('helvetica', 'italic');
          pdf.setTextColor(...CORPORATE_GRAY);
          pdf.text('[Imagen no disponible]', marginLeft + 8, y);
          y += 5;
        }
      }

      y += 3;
    }
  }

  // ───── 4. Controles y Atribucion ─────
  addSectionHeader('4. Controles y Atribucion');

  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...CORPORATE_GRAY);
  pdf.text('Controles activos:', marginLeft + 3, y);
  y += 5;
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(...CORPORATE_BLACK);
  pdf.text(incidente.controles_activos?.length ? incidente.controles_activos.join(', ') : 'Ninguno registrado', marginLeft + 3, y);
  y += 5;
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...CORPORATE_GRAY);
  pdf.text('Control efectivo:', marginLeft + 3, y);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(...CORPORATE_BLACK);
  pdf.text(incidente.control_efectivo ? 'Si' : 'No', marginLeft + 50, y);
  y += 8;

  // ───── 5. Resolucion ─────
  if (incidente.resolucion_notas || incidente.fecha_resolucion) {
    addSectionHeader('5. Resolucion');

    if (incidente.fecha_resolucion) {
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...CORPORATE_GRAY);
      pdf.text('Fecha resolucion:', marginLeft + 3, y);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...CORPORATE_BLACK);
      pdf.text(format(new Date(incidente.fecha_resolucion), 'dd/MM/yyyy HH:mm', { locale: es }), marginLeft + 50, y);
      y += 5;
    }

    if (incidente.resolucion_notas) {
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...CORPORATE_GRAY);
      pdf.text('Notas:', marginLeft + 3, y);
      y += 5;
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...CORPORATE_BLACK);
      const resLines = pdf.splitTextToSize(incidente.resolucion_notas, contentWidth - 6);
      resLines.forEach((line: string) => {
        checkPage(4.5);
        pdf.text(line, marginLeft + 3, y);
        y += 4.5;
      });
    }
  }

  // ───── 6. Firmas Digitales ─────
  const hasFirmaCreacion = !!(incidente as any).firma_creacion_base64;
  const hasFirmaCierre = !!(incidente as any).firma_cierre_base64;

  if (hasFirmaCreacion || hasFirmaCierre) {
    addSectionHeader('6. Firmas Digitales');

    if (hasFirmaCreacion) {
      checkPage(45);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...CORPORATE_BLACK);
      pdf.text('Firma de Creacion', marginLeft + 3, y);
      y += 5;
      try {
        pdf.addImage((incidente as any).firma_creacion_base64, 'PNG', marginLeft + 3, y, 50, 20);
        y += 22;
      } catch { y += 2; }
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...CORPORATE_GRAY);
      pdf.text(`Firmado por: ${(incidente as any).firma_creacion_email || '-'}`, marginLeft + 3, y);
      y += 4;
      if ((incidente as any).firma_creacion_timestamp) {
        pdf.text(`Fecha: ${format(new Date((incidente as any).firma_creacion_timestamp), 'dd/MM/yyyy HH:mm:ss', { locale: es })}`, marginLeft + 3, y);
        y += 4;
      }
      y += 5;
    }

    if (hasFirmaCierre) {
      checkPage(45);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...CORPORATE_BLACK);
      pdf.text('Firma de Cierre', marginLeft + 3, y);
      y += 5;
      try {
        pdf.addImage((incidente as any).firma_cierre_base64, 'PNG', marginLeft + 3, y, 50, 20);
        y += 22;
      } catch { y += 2; }
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...CORPORATE_GRAY);
      pdf.text(`Firmado por: ${(incidente as any).firma_cierre_email || '-'}`, marginLeft + 3, y);
      y += 4;
      if ((incidente as any).firma_cierre_timestamp) {
        pdf.text(`Fecha: ${format(new Date((incidente as any).firma_cierre_timestamp), 'dd/MM/yyyy HH:mm:ss', { locale: es })}`, marginLeft + 3, y);
        y += 4;
      }
    }
  }

  addFooter();
  pdf.save(`incidente-${incidente.id.slice(0, 8)}-${format(new Date(), 'yyyyMMdd')}.pdf`);
}
