import React from 'react';
import { Document, View, Text } from '@react-pdf/renderer';
import {
  ReportPage, SectionHeader, FieldGroup, DataTable, SignatureBlock,
  pdfBaseStyles, PDF_COLORS,
} from '@/components/pdf';
import type { DataTableColumn } from '@/components/pdf/DataTable';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface TransferredService {
  servicio_id: string;
  cliente: string;
  fase: string;
  notas_servicio?: string;
  asignado_a: string;
  incidentes: number;
}

interface ClosedService {
  servicio_id: string;
  cliente: string;
  razon: string;
}

interface IncidenteAbierto {
  incidente_id: string;
  tipo: string;
  severidad: string;
}

export interface HandoffActaData {
  turnoSaliente: string;
  turnoEntrante: string;
  salientes: { id: string; display_name: string }[];
  entrantes: { id: string; display_name: string }[];
  serviciosTransferidos: TransferredService[];
  serviciosCerrados: ClosedService[];
  incidentesAbiertos: IncidenteAbierto[];
  notasGenerales: string;
  firmaBase64?: string;
  firmaEmail?: string;
  firmaTimestamp?: string;
  logoBase64?: string | null;
}

const TURNO_LABELS: Record<string, string> = {
  matutino: 'Matutino',
  vespertino: 'Vespertino',
  nocturno: 'Nocturno',
};

const DECLARACION_NORMATIVA =
  'Se confirma que los servicios, incidencias y pendientes operativos han sido debidamente comunicados y aceptados ' +
  'por el equipo entrante, en cumplimiento con la normativa operativa vigente. El equipo entrante se compromete a ' +
  'dar seguimiento continuo a todos los servicios activos e incidentes heredados hasta su resolución o siguiente ' +
  'entrega de turno.';

const transferCols: DataTableColumn[] = [
  { header: 'Servicio', accessor: 'servicio_id', flex: 1.2 },
  { header: 'Cliente', accessor: 'cliente', flex: 1.5 },
  { header: 'Fase', accessor: 'fase', flex: 0.8 },
  { header: 'Asignado a', accessor: 'asignado_a', flex: 1.2 },
  { header: 'Inc.', accessor: (r) => String(r.incidentes || 0), flex: 0.4, align: 'center' },
];

const closedCols: DataTableColumn[] = [
  { header: 'Servicio', accessor: 'servicio_id', flex: 1.2 },
  { header: 'Cliente', accessor: 'cliente', flex: 2 },
  { header: 'Razón', accessor: (r) => r.razon === 'inactividad_6h' ? 'Inactividad >6h' : r.razon, flex: 1.5 },
];

const incidentCols: DataTableColumn[] = [
  { header: 'ID', accessor: (r) => r.incidente_id?.slice(0, 8) || '-', flex: 0.8 },
  { header: 'Tipo', accessor: 'tipo', flex: 1.5 },
  { header: 'Severidad', accessor: 'severidad', flex: 1, align: 'center' },
];

export const HandoffActaPDF: React.FC<{ data: HandoffActaData }> = ({ data }) => {
  const fechaStr = format(new Date(), "dd 'de' MMMM 'de' yyyy, HH:mm 'hrs'", { locale: es });

  return (
    <Document>
      <ReportPage
        title="Acta de Entrega de Turno"
        subtitle={fechaStr}
        logoBase64={data.logoBase64}
        footerText="Documento generado automáticamente — Detecta Core"
      >
        {/* 1. Datos Generales */}
        <SectionHeader title="1. Datos Generales" />
        <FieldGroup>
          <FieldRow label="Fecha" value={fechaStr} />
          <FieldRow label="Turno Saliente" value={TURNO_LABELS[data.turnoSaliente] || data.turnoSaliente} />
          <FieldRow label="Turno Entrante" value={TURNO_LABELS[data.turnoEntrante] || data.turnoEntrante} />
          <FieldRow label="Salientes" value={data.salientes.map(s => s.display_name).join(', ')} />
          <FieldRow label="Entrantes" value={data.entrantes.map(e => e.display_name).join(', ')} />
        </FieldGroup>

        {/* 2. Servicios Transferidos */}
        <SectionHeader title="2. Servicios Transferidos" />
        <DataTable columns={transferCols} data={data.serviciosTransferidos} />

        {/* 3. Servicios Cerrados */}
        {data.serviciosCerrados.length > 0 && (
          <>
            <SectionHeader title="3. Servicios Cerrados por Inactividad" />
            <DataTable columns={closedCols} data={data.serviciosCerrados} />
          </>
        )}

        {/* 4. Incidentes Abiertos Heredados */}
        {data.incidentesAbiertos.length > 0 && (
          <>
            <SectionHeader title="4. Incidentes Abiertos Heredados" />
            <DataTable columns={incidentCols} data={data.incidentesAbiertos} />
          </>
        )}

        {/* 5. Notas Generales */}
        {data.notasGenerales && (
          <>
            <SectionHeader title="5. Notas Generales" />
            <Text style={pdfBaseStyles.paragraph}>{data.notasGenerales}</Text>
          </>
        )}

        {/* 6. Declaración Normativa */}
        <SectionHeader title="6. Declaración Normativa" />
        <View style={{ borderWidth: 1, borderColor: PDF_COLORS.border, borderRadius: 3, padding: 10, marginBottom: 12 }}>
          <Text style={[pdfBaseStyles.paragraph, { fontWeight: 600, marginBottom: 0 }]}>
            {DECLARACION_NORMATIVA}
          </Text>
        </View>

        {/* 7. Firma Digital */}
        {data.firmaBase64 && (
          <>
            <SectionHeader title="7. Firma de Entrega" />
            <SignatureBlock
              title="Firma del Coordinador / Monitorista Saliente"
              signatureBase64={data.firmaBase64}
              email={data.firmaEmail}
              timestamp={data.firmaTimestamp}
            />
          </>
        )}
      </ReportPage>
    </Document>
  );
};
