import PlanningHub from './PlanningHub';
import { EditWorkflowProvider } from '@/contexts/EditWorkflowContext';
import UnifiedLayout from '@/layouts/UnifiedLayout';

/**
 * PlaneacionDashboard - Custody service planning module
 * Provides workflow management for service creation and scheduling
 */
function PlaneacionDashboard() {
  return (
    <EditWorkflowProvider>
      <UnifiedLayout>
        <PlanningHub />
      </UnifiedLayout>
    </EditWorkflowProvider>
  );
}

export default PlaneacionDashboard;