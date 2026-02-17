import React from 'react';
import { View } from '@react-pdf/renderer';
import { FieldGroup, FieldRow } from '@/components/pdf';
import type { ServicioVinculado } from '@/hooks/useServicioLookup';

interface Props {
  servicio: ServicioVinculado;
  ubicacionLat?: number;
  ubicacionLng?: number;
}

export const PDFLinkedService: React.FC<Props> = ({ servicio, ubicacionLat, ubicacionLng }) => {
  const ruta = [servicio.origen, servicio.destino].filter(Boolean).join(' → ') || '-';

  // Use relational armados, fallback to scalar
  const armadoDisplay = servicio.armados && servicio.armados.length > 0
    ? servicio.armados.map(a => a.armado_nombre_verificado || 'Sin nombre').join(', ')
    : servicio.armado_asignado || '-';

  const fields: [string, string][] = [
    ['ID Servicio', servicio.id_servicio],
    ['Cliente', servicio.nombre_cliente || '-'],
    ['Custodio', servicio.custodio_asignado || '-'],
    ['Vehículo', [servicio.auto, servicio.placa].filter(Boolean).join(' - ') || '-'],
    ['Armado', armadoDisplay],
    ['Tarifa', servicio.tarifa_acordada ? `$${Number(servicio.tarifa_acordada).toLocaleString('es-MX')}` : '-'],
    ['Ruta', ruta],
  ];

  return (
    <View>
      <FieldGroup title="2. Servicio Vinculado" fields={fields} />
      {ubicacionLat && ubicacionLng && (
        <FieldRow label="Coordenadas" value={`${ubicacionLat.toFixed(6)}, ${ubicacionLng.toFixed(6)}`} />
      )}
    </View>
  );
};
