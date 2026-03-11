import { Shield, Zap, Scale, AlertTriangle, ArrowRight, CheckCircle2, Clock, Wifi, WifiOff, UserCheck, BookOpen, Lock, Eye, Play, Moon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

/* ─── tiny reusable pieces ─── */

const FlowStep = ({ icon: Icon, label, color, active }: { icon: any; label: string; color: string; active?: boolean }) => (
  <div className={`flex flex-col items-center gap-1.5 px-3 py-2 rounded-lg border ${active ? 'border-primary bg-primary/10' : 'border-border bg-muted/30'}`}>
    <Icon className={`h-4 w-4 ${color}`} />
    <span className="text-xs font-medium text-center leading-tight">{label}</span>
  </div>
);

const FlowArrow = () => (
  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 mx-1" />
);

const RuleCard = ({ icon: Icon, iconColor, title, badge, badgeVariant, children }: {
  icon: any; iconColor: string; title: string; badge: string; badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline'; children: React.ReactNode;
}) => (
  <Card className="overflow-hidden">
    <CardHeader className="pb-3">
      <div className="flex items-start gap-3">
        <div className={`p-2.5 rounded-xl ${iconColor} shrink-0`}>
          <Icon className="h-5 w-5 text-primary-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <CardTitle className="text-base">{title}</CardTitle>
            <Badge variant={badgeVariant || 'secondary'} className="text-[10px] uppercase tracking-wider">{badge}</Badge>
          </div>
        </div>
      </div>
    </CardHeader>
    <CardContent className="pt-0 space-y-4">{children}</CardContent>
  </Card>
);

const DiagramBox = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-muted/40 border border-border rounded-xl p-4 space-y-3">{children}</div>
);

const DiagramRow = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center gap-1 flex-wrap justify-center">{children}</div>
);

const InfoBullet = ({ emoji, children }: { emoji: string; children: React.ReactNode }) => (
  <div className="flex items-start gap-2 text-sm">
    <span className="text-base leading-none mt-0.5">{emoji}</span>
    <span className="text-muted-foreground">{children}</span>
  </div>
);

/* ─── MAIN COMPONENT ─── */

export const SystemRulesGuide = () => {
  return (
    <ScrollArea className="h-[calc(100vh-200px)]">
      <div className="space-y-6 pr-4 pb-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary">
            <BookOpen className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Reglas del Sistema</h2>
            <p className="text-sm text-muted-foreground">
              Guía de referencia rápida sobre la lógica automática de asignación, balanceo y blindaje de servicios.
            </p>
          </div>
        </div>

        {/* ═══════════════════════════════════════════
            SECTION 1: Workflow General
        ═══════════════════════════════════════════ */}
        <RuleCard
          icon={ArrowRight}
          iconColor="bg-blue-600"
          title="Flujo General: Planeación → Monitoreo"
          badge="Workflow"
        >
          <p className="text-sm text-muted-foreground">
            Cada servicio pasa por estas fases. El <strong>handoff</strong> ocurre cuando Planeación marca al custodio <em>"En Sitio"</em>. 
            Solo entonces el servicio aparece en la Bitácora de Monitoreo.
          </p>

          <DiagramBox>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider text-center mb-2">Planeación</p>
            <DiagramRow>
              <FlowStep icon={Clock} label="Solicitud" color="text-muted-foreground" />
              <FlowArrow />
              <FlowStep icon={CheckCircle2} label="Cotización" color="text-muted-foreground" />
              <FlowArrow />
              <FlowStep icon={UserCheck} label="Asignar Custodio" color="text-muted-foreground" />
              <FlowArrow />
              <FlowStep icon={Shield} label="Armados / Extras" color="text-muted-foreground" />
              <FlowArrow />
              <FlowStep icon={Eye} label="En Sitio ✓" color="text-green-600" active />
            </DiagramRow>
            
            <div className="flex justify-center">
              <div className="flex flex-col items-center gap-1">
                <div className="h-6 w-px bg-primary" />
                <Badge variant="default" className="text-[10px]">HANDOFF</Badge>
                <div className="h-6 w-px bg-primary" />
              </div>
            </div>

            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider text-center mb-2">Monitoreo</p>
            <DiagramRow>
              <FlowStep icon={CheckCircle2} label="Checklist" color="text-blue-500" />
              <FlowArrow />
              <FlowStep icon={Play} label="Inicio" color="text-emerald-500" />
              <FlowArrow />
              <FlowStep icon={Eye} label="Monitoreo Activo" color="text-amber-500" active />
              <FlowArrow />
              <FlowStep icon={CheckCircle2} label="En Destino" color="text-blue-500" />
              <FlowArrow />
              <FlowStep icon={Lock} label="Liberación" color="text-green-600" />
            </DiagramRow>
          </DiagramBox>

          <div className="space-y-1.5">
            <InfoBullet emoji="📋">Planeación gestiona todo hasta que el custodio llega al punto de encuentro.</InfoBullet>
            <InfoBullet emoji="🔄">Al marcar "En Sitio", el servicio aparece automáticamente en Monitoreo.</InfoBullet>
            <InfoBullet emoji="🔒">Sin "En Sitio", el monitorista NO puede ver ni iniciar el servicio.</InfoBullet>
          </div>
        </RuleCard>

        {/* ═══════════════════════════════════════════
            SECTION 2: Regla 1 — Auto-asignación Pendientes
        ═══════════════════════════════════════════ */}
        <RuleCard
          icon={Zap}
          iconColor="bg-amber-600"
          title="Regla 1 — Auto-asignación de Pendientes"
          badge="OrphanGuard"
        >
          <p className="text-sm text-muted-foreground">
            Cuando un servicio ya tiene custodio <em>en sitio</em> y su cita está dentro de la 
            <strong> ventana operativa</strong> (desde 1 hora antes hasta 4 horas después de ahora), 
            el sistema le asigna automáticamente un monitorista.
          </p>

          <DiagramBox>
            <DiagramRow>
              <FlowStep icon={Clock} label="Servicio sin monitorista" color="text-destructive" />
              <FlowArrow />
              <FlowStep icon={Eye} label="¿Cita entre -1h y +4h?" color="text-amber-500" active />
              <FlowArrow />
              <FlowStep icon={UserCheck} label="Asignar al de menor carga" color="text-green-600" />
            </DiagramRow>
          </DiagramBox>

          <div className="space-y-1.5">
            <InfoBullet emoji="⏰">Ventana: desde 60 minutos antes de la cita hasta 4 horas después.</InfoBullet>
            <InfoBullet emoji="👤">Se asigna al monitorista con menos servicios activos.</InfoBullet>
            <InfoBullet emoji="🤝">Si el custodio ya trabajó con un monitorista, se prioriza esa afinidad.</InfoBullet>
          </div>
        </RuleCard>

        {/* ═══════════════════════════════════════════
            SECTION 3: Regla 2 — Rescate de Activos Huérfanos
        ═══════════════════════════════════════════ */}
        <RuleCard
          icon={AlertTriangle}
          iconColor="bg-red-600"
          title="Regla 2 — Rescate de Servicios Activos sin Monitorista"
          badge="Urgente"
          badgeVariant="destructive"
        >
          <p className="text-sm text-muted-foreground">
            Si un servicio <strong>ya empezó</strong> (tiene hora de inicio) pero por alguna razón no tiene monitorista asignado, 
            el sistema lo detecta y lo asigna <strong>inmediatamente</strong> al monitorista disponible con menos carga.
          </p>

          <DiagramBox>
            <DiagramRow>
              <FlowStep icon={Play} label="Servicio en curso" color="text-emerald-500" />
              <FlowArrow />
              <FlowStep icon={AlertTriangle} label="Sin monitorista ⚠️" color="text-destructive" active />
              <FlowArrow />
              <FlowStep icon={Zap} label="Asignación inmediata" color="text-amber-500" />
            </DiagramRow>
          </DiagramBox>

          <div className="space-y-1.5">
            <InfoBullet emoji="🚨">Esta regla NO tiene ventana de tiempo — actúa al instante.</InfoBullet>
            <InfoBullet emoji="📊">Aplica a cualquier servicio iniciado que no tenga fin registrado.</InfoBullet>
            <InfoBullet emoji="🛡️">Es la red de seguridad principal para evitar servicios sin supervisión.</InfoBullet>
          </div>
        </RuleCard>

        {/* ═══════════════════════════════════════════
            SECTION 4: Regla 3 — Reasignación por Desconexión
        ═══════════════════════════════════════════ */}
        <RuleCard
          icon={WifiOff}
          iconColor="bg-orange-600"
          title="Regla 3 — Reasignación por Desconexión"
          badge="OrphanGuard"
        >
          <p className="text-sm text-muted-foreground">
            Si un monitorista <strong>pierde su conexión</strong> (deja de enviar heartbeat), todos sus servicios 
            se transfieren automáticamente al monitorista con menos carga. El evento se registra en el log de anomalías.
          </p>

          <DiagramBox>
            <DiagramRow>
              <FlowStep icon={Wifi} label="Monitorista conectado" color="text-green-600" />
              <FlowArrow />
              <FlowStep icon={WifiOff} label="Pierde heartbeat" color="text-destructive" active />
              <FlowArrow />
              <FlowStep icon={UserCheck} label="Reasignar servicios" color="text-amber-500" />
            </DiagramRow>
          </DiagramBox>

          <div className="space-y-1.5">
            <InfoBullet emoji="💓">El sistema verifica el heartbeat continuamente (cada 15 segundos de cooldown).</InfoBullet>
            <InfoBullet emoji="📝">Se registra en <strong>bitácora de anomalías</strong> con tipo "reasignación por desconexión".</InfoBullet>
            <InfoBullet emoji="👥">Los servicios van al monitorista activo con menos carga en ese momento.</InfoBullet>
          </div>
        </RuleCard>

        {/* ═══════════════════════════════════════════
            SECTION 5: Regla 4 — Limpieza + Protección Manual
        ═══════════════════════════════════════════ */}
        <RuleCard
          icon={Clock}
          iconColor="bg-violet-600"
          title="Regla 4 — Limpieza de Asignaciones Futuras"
          badge="OrphanGuard"
        >
          <p className="text-sm text-muted-foreground">
            Las asignaciones automáticas para servicios cuya cita es <strong>más de 4 horas en el futuro</strong> se desactivan, 
            porque es demasiado pronto para reservar un monitorista. <strong>Pero</strong> si un coordinador asignó manualmente, 
            esa asignación está <strong>protegida</strong>.
          </p>

          <DiagramBox>
            <DiagramRow>
              <FlowStep icon={Clock} label="Servicio > 4h futuro" color="text-muted-foreground" />
              <FlowArrow />
              <FlowStep icon={UserCheck} label="¿Quién asignó?" color="text-amber-500" active />
            </DiagramRow>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className="flex flex-col items-center gap-2 p-3 rounded-lg border border-destructive/30 bg-destructive/5">
                <Badge variant="destructive" className="text-[10px]">AUTOMÁTICA</Badge>
                <span className="text-xs text-center text-muted-foreground">Se desactiva para no reservar recursos innecesarios</span>
              </div>
              <div className="flex flex-col items-center gap-2 p-3 rounded-lg border border-green-500/30 bg-green-500/5">
                <Badge className="bg-green-600 text-[10px]">MANUAL (COORDINADOR)</Badge>
                <span className="text-xs text-center text-muted-foreground">Queda protegida — el coordinador sabe lo que hace</span>
              </div>
            </div>
          </DiagramBox>

          <div className="space-y-1.5">
            <InfoBullet emoji="🛡️">Una asignación hecha por un coordinador NUNCA se elimina automáticamente.</InfoBullet>
            <InfoBullet emoji="🔄">Las automáticas se recrean cuando el servicio entre en la ventana de -1h a +4h.</InfoBullet>
            <InfoBullet emoji="🚐">Ideal para pernoctas y rutas foráneas programadas con anticipación.</InfoBullet>
          </div>
        </RuleCard>

        {/* ═══════════════════════════════════════════
            SECTION 6: Balanceo de Carga
        ═══════════════════════════════════════════ */}
        <RuleCard
          icon={Scale}
          iconColor="bg-cyan-600"
          title="Balanceo de Carga"
          badge="BalanceGuard"
        >
          <p className="text-sm text-muted-foreground">
            Cada 5 minutos, el sistema revisa si la carga está equilibrada entre monitoristas. 
            Si un monitorista tiene <strong>2 o más servicios de diferencia</strong> con otro, 
            se mueven servicios <em>"fríos"</em> para nivelar.
          </p>

          <DiagramBox>
            <div className="grid grid-cols-3 gap-3 items-center">
              <div className="flex flex-col items-center gap-1 p-3 rounded-lg border border-destructive/30 bg-destructive/5">
                <span className="text-2xl font-bold text-destructive">5</span>
                <span className="text-[11px] text-muted-foreground text-center">Monitorista A</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <Scale className="h-5 w-5 text-primary" />
                <ArrowRight className="h-4 w-4 text-primary" />
                <span className="text-[10px] text-muted-foreground">Transferir fríos</span>
              </div>
              <div className="flex flex-col items-center gap-1 p-3 rounded-lg border border-green-500/30 bg-green-500/5">
                <span className="text-2xl font-bold text-green-600">2</span>
                <span className="text-[11px] text-muted-foreground text-center">Monitorista B</span>
              </div>
            </div>
          </DiagramBox>

          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">¿Qué es un servicio "frío"?</p>
            <InfoBullet emoji="✅">No tiene evento activo (sin alarma, sin novedad en curso)</InfoBullet>
            <InfoBullet emoji="✅">No fue iniciado aún (sigue en pendientes o checklist)</InfoBullet>
            <InfoBullet emoji="✅">No fue restaurado recientemente de una pausa (gracia de 10 min)</InfoBullet>
            <InfoBullet emoji="❌">Servicios con eventos activos o en "Evento Especial" NO se mueven</InfoBullet>
          </div>
        </RuleCard>

        {/* ═══════════════════════════════════════════
            SECTION 7: Blindajes del Handoff
        ═══════════════════════════════════════════ */}
        <RuleCard
          icon={Shield}
          iconColor="bg-emerald-600"
          title="Blindajes de Seguridad del Handoff"
          badge="Protección"
        >
          <p className="text-sm text-muted-foreground">
            El sistema cuenta con múltiples capas de protección para evitar servicios sin supervisión 
            o acciones fuera de secuencia.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-lg border border-border bg-muted/30 space-y-2">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Gate de Visibilidad</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Los monitoristas solo ven servicios donde Planeación ya marcó al custodio <strong>"En Sitio"</strong>. 
                Sin esa marca, el servicio es invisible en la Bitácora.
              </p>
            </div>

            <div className="p-3 rounded-lg border border-border bg-muted/30 space-y-2">
              <div className="flex items-center gap-2">
                <Play className="h-4 w-4 text-emerald-500" />
                <span className="text-sm font-medium">Guard de Inicio</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Un monitorista no puede presionar "Iniciar" si el custodio no fue marcado en sitio. 
                El botón mostrará un error explícito.
              </p>
            </div>

            <div className="p-3 rounded-lg border border-border bg-muted/30 space-y-2">
              <div className="flex items-center gap-2">
                <Moon className="h-4 w-4 text-violet-500" />
                <span className="text-sm font-medium">Supresión Pernocta</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Cuando un servicio tiene un evento de <strong>pernocta</strong> activo, 
                las alertas de duración no escalan a "crítico". Evita falsas alarmas durante el descanso del custodio.
              </p>
            </div>

            <div className="p-3 rounded-lg border border-border bg-muted/30 space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-medium">Sin Límite Temporal</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Los servicios activos (iniciados, sin fin) permanecen visibles <strong>indefinidamente</strong> hasta que se liberen. 
                Ideal para rutas multi-día.
              </p>
            </div>
          </div>

          <Separator />

          <div className="p-3 rounded-lg border border-primary/20 bg-primary/5 space-y-2">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Protección a nivel base de datos</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Existe un índice único parcial que <strong>impide que 2 monitoristas estén activos en el mismo servicio</strong> simultáneamente. 
              Si el sistema detecta una colisión, la segunda asignación falla y se busca otro servicio.
            </p>
          </div>
        </RuleCard>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground py-4">
          Estas reglas se ejecutan automáticamente cada 15 segundos. Para consultas o ajustes, contacta al equipo de desarrollo.
        </div>
      </div>
    </ScrollArea>
  );
};
