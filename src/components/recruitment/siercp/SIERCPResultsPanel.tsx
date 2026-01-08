import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MetricCard } from '@/components/recruitment/ui/MetricCard';
import { CalibrationResultsTable } from './CalibrationResultsTable';
import { InvitationsTable } from './InvitationsTable';
import { useSIERCPResults } from '@/hooks/useSIERCPResults';
import { useAllSIERCPInvitations } from '@/hooks/useSIERCPInvitations';
import { 
  Brain, 
  FlaskConical, 
  Mail, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Users
} from 'lucide-react';

export function SIERCPResultsPanel() {
  const { allResults, loading: loadingResults } = useSIERCPResults();
  const { invitations, isLoading: loadingInvitations } = useAllSIERCPInvitations();

  // Calculate metrics
  const calibrationCount = allResults?.length || 0;
  const invitationsCount = invitations?.length || 0;
  const completedInvitations = invitations?.filter(i => i.status === 'completed').length || 0;
  const pendingInvitations = invitations?.filter(i => 
    ['pending', 'sent', 'opened', 'started'].includes(i.status)
  ).length || 0;
  const expiredInvitations = invitations?.filter(i => i.status === 'expired').length || 0;

  const totalCompleted = calibrationCount + completedInvitations;

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard
          title="Total Completadas"
          value={totalCompleted}
          icon={CheckCircle}
          variant="success"
          loading={loadingResults || loadingInvitations}
        />
        <MetricCard
          title="En Progreso"
          value={pendingInvitations}
          icon={Clock}
          variant="warning"
          loading={loadingInvitations}
        />
        <MetricCard
          title="Calibración Interna"
          value={calibrationCount}
          icon={FlaskConical}
          variant="default"
          loading={loadingResults}
        />
        <MetricCard
          title="Invitaciones Enviadas"
          value={invitationsCount}
          icon={Mail}
          variant="default"
          loading={loadingInvitations}
        />
      </div>

      {/* Sub-tabs */}
      <Tabs defaultValue="calibration" className="space-y-4">
        <TabsList>
          <TabsTrigger value="calibration" className="gap-2">
            <FlaskConical className="h-4 w-4" />
            Calibración Interna
            {calibrationCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-amber-500/20 text-amber-600 rounded">
                {calibrationCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="invitations" className="gap-2">
            <Users className="h-4 w-4" />
            Invitaciones Candidatos
            {pendingInvitations > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-500/20 text-blue-600 rounded">
                {pendingInvitations}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calibration">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FlaskConical className="h-5 w-5 text-amber-600" />
                Resultados de Calibración - Equipo Supply
              </CardTitle>
              <CardDescription>
                Pruebas internas realizadas por el equipo para validar el sistema SIERCP
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CalibrationResultsTable />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invitations">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-blue-600" />
                Invitaciones a Candidatos
              </CardTitle>
              <CardDescription>
                Estado de las evaluaciones SIERCP enviadas a candidatos externos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InvitationsTable />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
