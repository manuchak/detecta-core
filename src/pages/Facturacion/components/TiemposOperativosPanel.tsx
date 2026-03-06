import React, { useState } from 'react';
import { ServiceTimesTable } from '@/components/monitoring/tiempos/ServiceTimesTable';
import { ServiceDetailView } from '@/components/monitoring/tiempos/ServiceDetailView';
import type { ServiceTimeRow } from '@/hooks/useServiceTimesReport';
import { format } from 'date-fns';

const BITACORA_START = '2026-03-06';

export const TiemposOperativosPanel: React.FC = () => {
  const [selectedService, setSelectedService] = useState<ServiceTimeRow | null>(null);
  const today = format(new Date(), 'yyyy-MM-dd');

  if (selectedService) {
    return (
      <ServiceDetailView
        service={selectedService}
        onBack={() => setSelectedService(null)}
      />
    );
  }

  return (
    <ServiceTimesTable
      onSelectService={setSelectedService}
      defaultDateFrom={BITACORA_START}
      defaultDateTo={today}
    />
  );
};
