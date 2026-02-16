import React from 'react';
import { Document, Page } from '@react-pdf/renderer';
import './fontSetup';
import { styles } from './pdfStyles';
import { PDFHeader } from './PDFHeader';
import { PDFExecutiveSummary } from './PDFExecutiveSummary';
import { PDFGeneralData } from './PDFGeneralData';
import { PDFLinkedService } from './PDFLinkedService';
import { PDFTimeline } from './PDFTimeline';
import { PDFControls } from './PDFControls';
import { PDFResolution } from './PDFResolution';
import { PDFSignatures } from './PDFSignatures';
import { PDFFooter } from './PDFFooter';
import { TIPOS_INCIDENTE, SEVERIDADES } from '@/hooks/useIncidentesOperativos';
import type { IncidenteOperativo, EntradaCronologia } from '@/hooks/useIncidentesOperativos';
import type { ServicioVinculado } from '@/hooks/useServicioLookup';

interface Props {
  incidente: IncidenteOperativo;
  cronologia: EntradaCronologia[];
  servicio?: ServicioVinculado;
  logoBase64: string | null;
  imageCache: Map<string, string | null>;
  responseTime: string;
}

export const IncidentPDFDocument: React.FC<Props> = ({
  incidente, cronologia, servicio, logoBase64, imageCache, responseTime,
}) => {
  const tipoLabel = TIPOS_INCIDENTE.find(t => t.value === incidente.tipo)?.label || incidente.tipo;
  const sevLabel = SEVERIDADES.find(s => s.value === incidente.severidad)?.label || incidente.severidad;
  const incAny = incidente as any;

  const generalFields: [string, string][] = [
    ['Tipo', tipoLabel],
    ['Severidad', sevLabel],
    ['Estado', incidente.estado],
    ['Zona', incidente.zona || '-'],
    ['Cliente', incidente.cliente_nombre || '-'],
    ['Reportado por', incAny.reportado_por || '-'],
    ['Atribuible a operación', incidente.atribuible_operacion ? 'Sí' : 'No'],
  ];
  if (responseTime !== 'N/D') {
    generalFields.push(['Tiempo de respuesta', responseTime]);
  }

  return (
    <Document title={`Incidente ${incidente.id.slice(0, 8)}`} author="Detecta">
      <Page size="A4" style={styles.page} wrap>
        <PDFHeader logoBase64={logoBase64} incidentId={incidente.id} />
        <PDFFooter />

        <PDFExecutiveSummary
          tipo={tipoLabel}
          severidad={sevLabel}
          severidadValue={incidente.severidad}
          cliente={incidente.cliente_nombre || '-'}
          zona={incidente.zona || '-'}
          tiempoRespuesta={responseTime}
        />

        <PDFGeneralData
          fields={generalFields}
          descripcion={incidente.descripcion}
        />

        {servicio && (
          <PDFLinkedService
            servicio={servicio}
            ubicacionLat={incAny.ubicacion_lat}
            ubicacionLng={incAny.ubicacion_lng}
          />
        )}

        <PDFTimeline cronologia={cronologia} imageCache={imageCache} />

        <PDFControls
          controlesActivos={incidente.controles_activos}
          controlEfectivo={!!incidente.control_efectivo}
        />

        <PDFResolution
          fechaResolucion={incidente.fecha_resolucion}
          resolucionNotas={incidente.resolucion_notas}
        />

        <PDFSignatures
          firmaCreacion={{
            base64: incAny.firma_creacion_base64,
            email: incAny.firma_creacion_email,
            timestamp: incAny.firma_creacion_timestamp,
          }}
          firmaCierre={{
            base64: incAny.firma_cierre_base64,
            email: incAny.firma_cierre_email,
            timestamp: incAny.firma_cierre_timestamp,
          }}
        />
      </Page>
    </Document>
  );
};
