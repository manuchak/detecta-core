import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { styles } from './pdfStyles';
import type { ServicioVinculado } from '@/hooks/useServicioLookup';

interface Props {
  servicio: ServicioVinculado;
  ubicacionLat?: number;
  ubicacionLng?: number;
}

export const PDFLinkedService: React.FC<Props> = ({ servicio, ubicacionLat, ubicacionLng }) => {
  const ruta = [servicio.origen, servicio.destino].filter(Boolean).join(' → ') || '-';

  const fields: [string, string][] = [
    ['ID Servicio', servicio.id_servicio],
    ['Cliente', servicio.nombre_cliente || '-'],
    ['Custodio', servicio.custodio_asignado || '-'],
    ['Vehículo', [servicio.auto, servicio.placa].filter(Boolean).join(' - ') || '-'],
    ['Armado', servicio.armado_asignado || '-'],
    ['Tarifa', servicio.tarifa_acordada ? `$${Number(servicio.tarifa_acordada).toLocaleString('es-MX')}` : '-'],
    ['Ruta', ruta],
  ];

  return (
    <View>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>2. Servicio Vinculado</Text>
      </View>
      {fields.map(([label, value], i) => (
        <View style={styles.fieldRow} key={i}>
          <Text style={styles.label}>{label}:</Text>
          <Text style={styles.value}>{value}</Text>
        </View>
      ))}
      {ubicacionLat && ubicacionLng && (
        <View style={[styles.fieldRow, { marginTop: 4 }]}>
          <Text style={styles.label}>Coordenadas:</Text>
          <Text style={styles.value}>{ubicacionLat.toFixed(6)}, {ubicacionLng.toFixed(6)}</Text>
        </View>
      )}
    </View>
  );
};
