import PlanningHub from './PlanningHub';
import { EditWorkflowProvider } from '@/contexts/EditWorkflowContext';
import UnifiedLayout from '@/layouts/UnifiedLayout';

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