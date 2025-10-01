import PlanningHub from './PlanningHub';
import { EditWorkflowProvider } from '@/contexts/EditWorkflowContext';

function PlaneacionDashboard() {
  return (
    <EditWorkflowProvider>
      <PlanningHub />
    </EditWorkflowProvider>
  );
}

export default PlaneacionDashboard;