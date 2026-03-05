import React, { useState } from 'react';
import { ServiceTimesTable } from './ServiceTimesTable';
import { ServiceDetailView } from './ServiceDetailView';
import type { ServiceTimeRow } from '@/hooks/useServiceTimesReport';

export const ServiceTimesPanel: React.FC = () => {
  const [selectedService, setSelectedService] = useState<ServiceTimeRow | null>(null);

  if (selectedService) {
    return (
      <ServiceDetailView
        service={selectedService}
        onBack={() => setSelectedService(null)}
      />
    );
  }

  return <ServiceTimesTable onSelectService={setSelectedService} />;
};
