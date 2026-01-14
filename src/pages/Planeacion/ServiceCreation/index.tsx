import { EditWorkflowProvider } from '@/contexts/EditWorkflowContext';
import UnifiedLayout from '@/layouts/UnifiedLayout';
import ServiceCreationLayout from './ServiceCreationLayout';

/**
 * ServiceCreationPage - Full-page service creation experience
 * Replaces the modal-based workflow with a dedicated page
 */
function ServiceCreationPage() {
  return (
    <EditWorkflowProvider>
      <UnifiedLayout>
        <ServiceCreationLayout />
      </UnifiedLayout>
    </EditWorkflowProvider>
  );
}

export default ServiceCreationPage;
