import React from 'react';
import { Badge } from '@/components/ui/badge';
import { User, Car, DollarSign, MapPin, Shield, Briefcase } from 'lucide-react';
import type { ServicioVinculado } from '@/hooks/useServicioLookup';

interface ServiceDataSummaryProps {
  servicio: ServicioVinculado;
}

export const ServiceDataSummary: React.FC<ServiceDataSummaryProps> = ({ servicio }) => {
  // Build armado display from relational data, fallback to scalar
  const armadoDisplay = servicio.armados && servicio.armados.length > 0
    ? servicio.armados.map(a => a.armado_nombre_verificado || 'Sin nombre').join(', ')
    : servicio.armado_asignado;

  const items = [
    { icon: Briefcase, label: 'Cliente', value: servicio.nombre_cliente },
    { icon: User, label: 'Custodio', value: servicio.custodio_asignado },
    { icon: MapPin, label: 'Origen', value: servicio.origen },
    { icon: MapPin, label: 'Destino', value: servicio.destino },
    { icon: Car, label: 'Vehículo', value: [servicio.auto, servicio.placa].filter(Boolean).join(' · ') || null },
    { icon: Shield, label: 'Armado', value: armadoDisplay },
    { icon: DollarSign, label: 'Tarifa', value: servicio.tarifa_acordada ? `$${Number(servicio.tarifa_acordada).toLocaleString('es-MX')}` : null },
  ].filter(item => item.value);

  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30">
          {servicio.id_servicio}
        </Badge>
        {servicio.tipo_servicio && (
          <Badge variant="secondary" className="text-[10px]">{servicio.tipo_servicio}</Badge>
        )}
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
        {items.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center gap-1.5 text-xs">
            <Icon className="h-3 w-3 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground">{label}:</span>
            <span className="font-medium truncate">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
