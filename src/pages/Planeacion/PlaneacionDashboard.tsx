import PlanningHub from './PlanningHub';
import { EditWorkflowProvider } from '@/contexts/EditWorkflowContext';
import UnifiedLayout from '@/layouts/UnifiedLayout';
import { useState } from 'react';

function PlaneacionDashboard() {
  const [activeSection, setActiveSection] = useState('planificacion');

  return (
    <EditWorkflowProvider>
      <UnifiedLayout
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      >
        <PlanningHub />
      </UnifiedLayout>
    </EditWorkflowProvider>
  );
}

export default PlaneacionDashboard;