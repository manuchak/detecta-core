import PlanningHub from './PlanningHub';
import { EditWorkflowProvider } from '@/contexts/EditWorkflowContext';

export default function PlaneacionDashboard() {
  return (
    <EditWorkflowProvider>
      <PlanningHub />
    </EditWorkflowProvider>
  );
}