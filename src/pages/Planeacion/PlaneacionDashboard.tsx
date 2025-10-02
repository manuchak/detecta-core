import PlanningHub from './PlanningHub';
import { EditWorkflowProvider } from '@/contexts/EditWorkflowContext';
import { useDraftResume } from '@/contexts/DraftResumeContext';
import UnifiedLayout from '@/layouts/UnifiedLayout';
import { useState, useEffect } from 'react';

function PlaneacionDashboard() {
  const [activeSection, setActiveSection] = useState('planificacion');
  const { registerDraft, unregisterDraft } = useDraftResume();

  // Register the service creation draft with the global system
  useEffect(() => {
    registerDraft({
      storageKey: 'service_creation_workflow',
      moduleName: 'Creación de Servicio',
      resumePath: '/planeacion',
      isMeaningful: (data) => {
        return data && (data.routeData || data.serviceData || data.assignmentData);
      },
      previewText: 'Continúa creando tu servicio',
    });

    return () => {
      unregisterDraft('service_creation_workflow');
    };
  }, [registerDraft, unregisterDraft]);

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