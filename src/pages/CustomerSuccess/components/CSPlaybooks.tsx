import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCSLoyaltyFunnel, type LoyaltyStage } from '@/hooks/useCSLoyaltyFunnel';
import { useCreateCSTouchpoint } from '@/hooks/useCSTouchpoints';
import { Sparkles, Activity, Shield, Star, Crown, AlertTriangle, Play } from 'lucide-react';
import { toast } from 'sonner';

interface PlaybookAction {
  stage: LoyaltyStage;
  icon: React.ElementType;
  title: string;
  description: string;
  touchpointTipo: string;
  touchpointResumen: string;
  priority: number;
}

const PLAYBOOKS: PlaybookAction[] = [
  {
    stage: 'en_riesgo',
    icon: AlertTriangle,
    title: 'Intervención urgente',
    description: 'Contactar en 24h — identificar causa de insatisfacción y crear plan de recuperación',
    touchpointTipo: 'llamada_seguimiento',
    touchpointResumen: 'Llamada de intervención por riesgo de churn — seguimiento proactivo CS',
    priority: 0,
  },
  {
    stage: 'nuevo',
    icon: Sparkles,
    title: 'Onboarding call',
    description: 'Programar llamada de bienvenida — verificar que el servicio cumplió expectativas',
    touchpointTipo: 'llamada_seguimiento',
    touchpointResumen: 'Llamada de onboarding — validar expectativas y primer servicio',
    priority: 1,
  },
  {
    stage: 'activo',
    icon: Activity,
    title: 'Agendar QBR',
    description: 'Quarterly Business Review — explorar oportunidades de expansión y feedback',
    touchpointTipo: 'reunion',
    touchpointResumen: 'QBR — revisión trimestral de servicio y oportunidades de mejora',
    priority: 2,
  },
  {
    stage: 'leal',
    icon: Shield,
    title: 'Encuesta NPS',
    description: 'Enviar encuesta de satisfacción — evaluar potencial de referido y caso de éxito',
    touchpointTipo: 'email',
    touchpointResumen: 'Envío de encuesta NPS — evaluación de satisfacción y potencial promotor',
    priority: 3,
  },
  {
    stage: 'promotor',
    icon: Star,
    title: 'Programa de referidos',
    description: 'Invitar al programa de referidos — solicitar testimonial o caso de éxito',
    touchpointTipo: 'reunion',
    touchpointResumen: 'Reunión para programa de embajadores — testimonial y referidos',
    priority: 4,
  },
];

export function CSPlaybooks() {
  const { data: loyalty } = useCSLoyaltyFunnel();
  const createTouchpoint = useCreateCSTouchpoint();

  // Only show playbooks where there are clients in that stage
  const activePlaybooks = PLAYBOOKS.filter(p => {
    const stageData = loyalty?.funnel.find(f => f.stage === p.stage);
    return stageData && stageData.count > 0;
  }).slice(0, 4);

  const handleExecute = (playbook: PlaybookAction) => {
    const stageClients = loyalty?.funnel.find(f => f.stage === playbook.stage)?.clients || [];
    if (stageClients.length === 0) return;

    // Create touchpoint for the first client in that stage (most urgent)
    const client = stageClients[0];
    createTouchpoint.mutate({
      cliente_id: client.id,
      tipo: playbook.touchpointTipo,
      direccion: 'saliente',
      resumen: `${playbook.touchpointResumen} — Cliente: ${client.nombre_comercial}`,
      siguiente_accion: playbook.description,
    });
    toast.success(`Touchpoint creado para ${client.nombre_comercial}`);
  };

  if (activePlaybooks.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Siguiente Mejor Acción</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
            Sin acciones pendientes — todos los clientes están al día ✓
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Siguiente Mejor Acción</CardTitle>
        <p className="text-xs text-muted-foreground">Playbooks automáticos basados en la etapa del cliente</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {activePlaybooks.map(playbook => {
            const Icon = playbook.icon;
            const stageCount = loyalty?.funnel.find(f => f.stage === playbook.stage)?.count || 0;

            return (
              <div
                key={playbook.stage}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/30 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{playbook.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{playbook.description}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{stageCount} clientes en esta etapa</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="shrink-0 gap-1"
                  onClick={() => handleExecute(playbook)}
                  disabled={createTouchpoint.isPending}
                >
                  <Play className="h-3 w-3" /> Ejecutar
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
