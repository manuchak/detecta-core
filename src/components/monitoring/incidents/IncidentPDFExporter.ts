import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { IncidenteOperativo, EntradaCronologia } from '@/hooks/useIncidentesOperativos';
import { TIPOS_INCIDENTE, SEVERIDADES, TIPOS_ENTRADA_CRONOLOGIA } from '@/hooks/useIncidentesOperativos';
import type { ServicioVinculado } from '@/hooks/useServicioLookup';

const CORPORATE_RED = [235, 0, 0] as const;
const CORPORATE_BLACK = [25, 25, 25] as const;
const CORPORATE_GRAY = [100, 100, 100] as const;
const LIGHT_GRAY = [240, 240, 240] as const;
const WHITE = [255, 255, 255] as const;

interface ExportData {
  incidente: IncidenteOperativo;
  cronologia: EntradaCronologia[];
  servicio?: ServicioVinculado;
}

export function exportIncidentePDF({ incidente, cronologia, servicio }: ExportData) {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const marginLeft = 20;
  const marginRight = 20;
  const contentWidth = pageWidth - marginLeft - marginRight;
  let y = 25;

  const checkPage = (needed: number) => {
    if (y + needed > pdf.internal.pageSize.getHeight() - 20) {
      pdf.addPage();
      y = 25;
      addHeader();
    }
  };

  const addHeader = () => {
    pdf.setFillColor(...CORPORATE_RED);
    pdf.rect(0, 0, pageWidth, 16, 'F');
    pdf.setTextColor(...WHITE);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text('REPORTE DE INCIDENTE OPERATIVO', marginLeft, 11);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.text(`ID: ${incidente.id.slice(0, 8)}`, pageWidth - marginRight, 11, { align: 'right' });
    pdf.setTextColor(...CORPORATE_BLACK);
  };

  const addFooter = () => {
    const pageCount = pdf.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      const ph = pdf.internal.pageSize.getHeight();
      pdf.setFontSize(7);
      pdf.setTextColor(...CORPORATE_GRAY);
      pdf.text(`Página ${i} de ${pageCount}`, pageWidth - marginRight, ph - 8, { align: 'right' });
      pdf.text(`Generado: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: es })}`, marginLeft, ph - 8);
    }
  };

  // Header
  addHeader();
  y = 25;

  // Title
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...CORPORATE_BLACK);
  pdf.text('Reporte de Incidente Operativo', marginLeft, y);
  y += 8;

  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(...CORPORATE_GRAY);
  pdf.text(`Fecha del incidente: ${format(new Date(incidente.fecha_incidente), "dd 'de' MMMM yyyy, HH:mm", { locale: es })}`, marginLeft, y);
  y += 12;

  // Section: Datos Generales
  pdf.setFillColor(...LIGHT_GRAY);
  pdf.rect(marginLeft, y, contentWidth, 7, 'F');
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...CORPORATE_BLACK);
  pdf.text('1. Datos Generales', marginLeft + 3, y + 5);
  y += 12;

  const tipoLabel = TIPOS_INCIDENTE.find(t => t.value === incidente.tipo)?.label || incidente.tipo;
  const sevLabel = SEVERIDADES.find(s => s.value === incidente.severidad)?.label || incidente.severidad;

  const fields = [
    ['Tipo', tipoLabel],
    ['Severidad', sevLabel],
    ['Estado', incidente.estado],
    ['Zona', incidente.zona || '—'],
    ['Cliente', incidente.cliente_nombre || '—'],
    ['Atribuible a operación', incidente.atribuible_operacion ? 'Sí' : 'No'],
  ];

  pdf.setFontSize(9);
  fields.forEach(([label, value]) => {
    checkPage(6);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...CORPORATE_GRAY);
    pdf.text(`${label}:`, marginLeft + 3, y);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...CORPORATE_BLACK);
    pdf.text(String(value), marginLeft + 45, y);
    y += 5;
  });

  y += 3;
  checkPage(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...CORPORATE_GRAY);
  pdf.text('Descripción:', marginLeft + 3, y);
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

  // Section: Servicio Vinculado (Bloque 5)
  if (servicio) {
    checkPage(15);
    pdf.setFillColor(...LIGHT_GRAY);
    pdf.rect(marginLeft, y, contentWidth, 7, 'F');
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...CORPORATE_BLACK);
    pdf.text('2. Servicio Vinculado', marginLeft + 3, y + 5);
    y += 12;

    const svcFields = [
      ['ID Servicio', servicio.id_servicio],
      ['Cliente', servicio.nombre_cliente || '—'],
      ['Custodio', servicio.custodio_asignado || '—'],
      ['Vehículo', [servicio.auto, servicio.placa].filter(Boolean).join(' · ') || '—'],
      ['Armado', servicio.armado_asignado || '—'],
      ['Tarifa', servicio.tarifa_acordada ? `$${Number(servicio.tarifa_acordada).toLocaleString('es-MX')}` : '—'],
      ['Ruta', [servicio.origen, servicio.destino].filter(Boolean).join(' → ') || '—'],
    ];

    pdf.setFontSize(9);
    svcFields.forEach(([label, value]) => {
      checkPage(6);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...CORPORATE_GRAY);
      pdf.text(`${label}:`, marginLeft + 3, y);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...CORPORATE_BLACK);
      pdf.text(String(value), marginLeft + 45, y);
      y += 5;
    });
    y += 8;
  }

  // Ubicación georeferenciada
  const incAny = incidente as any;
  if (incAny.ubicacion_lat && incAny.ubicacion_lng) {
    checkPage(10);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...CORPORATE_GRAY);
    pdf.text('Coordenadas:', marginLeft + 3, y);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...CORPORATE_BLACK);
    pdf.text(`${incAny.ubicacion_lat.toFixed(6)}, ${incAny.ubicacion_lng.toFixed(6)}`, marginLeft + 45, y);
    y += 8;
  }

  // Section: Cronología
  checkPage(15);
  pdf.setFillColor(...LIGHT_GRAY);
  pdf.rect(marginLeft, y, contentWidth, 7, 'F');
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...CORPORATE_BLACK);
  pdf.text('3. Cronología del Evento', marginLeft + 3, y + 5);
  y += 12;

  if (cronologia.length === 0) {
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'italic');
    pdf.setTextColor(...CORPORATE_GRAY);
    pdf.text('Sin entradas registradas en la cronología.', marginLeft + 3, y);
    y += 8;
  } else {
    cronologia.forEach((entry) => {
      checkPage(14);
      const tipoEntrada = TIPOS_ENTRADA_CRONOLOGIA.find(t => t.value === entry.tipo_entrada)?.label || entry.tipo_entrada;
      const ts = format(new Date(entry.timestamp), "dd/MM HH:mm", { locale: es });

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
      y += 3;
    });
  }

  // Section: Controles
  checkPage(15);
  pdf.setFillColor(...LIGHT_GRAY);
  pdf.rect(marginLeft, y, contentWidth, 7, 'F');
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...CORPORATE_BLACK);
  pdf.text('4. Controles y Atribución', marginLeft + 3, y + 5);
  y += 12;

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
  pdf.text(incidente.control_efectivo ? 'Sí' : 'No', marginLeft + 45, y);
  y += 8;

  // Section: Resolución
  if (incidente.resolucion_notas || incidente.fecha_resolucion) {
    checkPage(15);
    pdf.setFillColor(...LIGHT_GRAY);
    pdf.rect(marginLeft, y, contentWidth, 7, 'F');
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...CORPORATE_BLACK);
    pdf.text('5. Resolución', marginLeft + 3, y + 5);
    y += 12;

    if (incidente.fecha_resolucion) {
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...CORPORATE_GRAY);
      pdf.text('Fecha resolución:', marginLeft + 3, y);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...CORPORATE_BLACK);
      pdf.text(format(new Date(incidente.fecha_resolucion), "dd/MM/yyyy HH:mm", { locale: es }), marginLeft + 45, y);
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

  addFooter();
  pdf.save(`incidente-${incidente.id.slice(0, 8)}-${format(new Date(), 'yyyyMMdd')}.pdf`);
}
