import React, { useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ChevronDown,
  ChevronRight,
  RotateCcw,
  Download,
  Send,
  FileText,
  Inbox,
  MessagesSquare,
  Radio,
  Database,
  Shield,
  Play,
} from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

/* ─── Types ─── */

type TestStatus = 'pending' | 'pass' | 'fail' | 'skip';

interface TestItem {
  id: string;
  description: string;
  status: TestStatus;
  timestamp: string | null;
}

interface ChecklistSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  tests: TestItem[];
}

interface ChecklistState {
  sections: ChecklistSection[];
  lastUpdated: string | null;
}

/* ─── Initial Data ─── */

const createInitialState = (): ChecklistState => ({
  lastUpdated: null,
  sections: [
    {
      id: 'envio',
      title: 'Envío de Mensajes',
      icon: null,
      tests: [
        { id: 'envio-1', description: 'Envío de texto libre a número válido', status: 'pending', timestamp: null },
        { id: 'envio-2', description: 'Envío de imagen con caption', status: 'pending', timestamp: null },
        { id: 'envio-3', description: 'Envío de documento', status: 'pending', timestamp: null },
        { id: 'envio-4', description: 'Normalización de teléfono (formato 52+10 dígitos)', status: 'pending', timestamp: null },
        { id: 'envio-5', description: 'Error controlado sin teléfono configurado', status: 'pending', timestamp: null },
      ],
    },
    {
      id: 'templates',
      title: 'Templates',
      icon: null,
      tests: [
        { id: 'tpl-1', description: 'Carga de templates aprobados desde DB', status: 'pending', timestamp: null },
        { id: 'tpl-2', description: 'Envío de template con variables', status: 'pending', timestamp: null },
        { id: 'tpl-3', description: 'Payload correcto (languageCode, components)', status: 'pending', timestamp: null },
        { id: 'tpl-4', description: 'Template sin variables (variable_count=0)', status: 'pending', timestamp: null },
      ],
    },
    {
      id: 'recepcion',
      title: 'Recepción / Simulación Inbound',
      icon: null,
      tests: [
        { id: 'rcv-1', description: 'Mensaje inbound se persiste con is_from_bot=false', status: 'pending', timestamp: null },
        { id: 'rcv-2', description: 'Media inbound con URL renderizable', status: 'pending', timestamp: null },
        { id: 'rcv-3', description: 'Asociación correcta a servicio_id', status: 'pending', timestamp: null },
      ],
    },
    {
      id: 'multicanal',
      title: 'Conversación Multi-Canal',
      icon: null,
      tests: [
        { id: 'mc-1', description: 'Canal custodio_planeacion: mensajes pre-servicio', status: 'pending', timestamp: null },
        { id: 'mc-2', description: 'Canal custodio_c4: mensajes monitoreo activo', status: 'pending', timestamp: null },
        { id: 'mc-3', description: 'Canal cliente_c4: chat bidireccional', status: 'pending', timestamp: null },
        { id: 'mc-4', description: 'Handoff planeacion→c4 inserta mensaje sistema', status: 'pending', timestamp: null },
        { id: 'mc-5', description: 'Post-handoff: planeación queda read-only', status: 'pending', timestamp: null },
        { id: 'mc-6', description: 'Filtrado por comm_channel funciona', status: 'pending', timestamp: null },
      ],
    },
    {
      id: 'broadcast',
      title: 'Broadcast',
      icon: null,
      tests: [
        { id: 'bc-1', description: 'Envío a múltiples contactos', status: 'pending', timestamp: null },
        { id: 'bc-2', description: 'Agrupación en burbuja con BroadcastBadge (ventana 5s)', status: 'pending', timestamp: null },
        { id: 'bc-3', description: 'Resumen de éxitos/fallos por destinatario', status: 'pending', timestamp: null },
      ],
    },
    {
      id: 'persistencia',
      title: 'Persistencia y DB',
      icon: null,
      tests: [
        { id: 'db-1', description: 'Mensajes persisten en whatsapp_messages con columnas correctas', status: 'pending', timestamp: null },
        { id: 'db-2', description: 'delivery_status correcto (sent/received)', status: 'pending', timestamp: null },
        { id: 'db-3', description: 'sender_type correcto por contexto', status: 'pending', timestamp: null },
        { id: 'db-4', description: 'Realtime subscription actualiza mensajes nuevos', status: 'pending', timestamp: null },
      ],
    },
    {
      id: 'flags',
      title: 'Feature Flags / Gobernanza',
      icon: null,
      tests: [
        { id: 'ff-1', description: 'Flag planeación deshabilitado oculta chat en Planning', status: 'pending', timestamp: null },
        { id: 'ff-2', description: 'Flag monitoreo deshabilitado oculta chat en Monitoring', status: 'pending', timestamp: null },
        { id: 'ff-3', description: 'Flags se controlan desde Centro de Coordinación', status: 'pending', timestamp: null },
      ],
    },
    {
      id: 'e2e',
      title: 'Escenarios E2E',
      icon: null,
      tests: [
        { id: 'e2e-1', description: 'Escenario Planeación completo (6 pasos)', status: 'pending', timestamp: null },
        { id: 'e2e-2', description: 'Escenario Monitoreo completo (5 pasos)', status: 'pending', timestamp: null },
        { id: 'e2e-3', description: 'Escenario Cliente completo (4 pasos)', status: 'pending', timestamp: null },
      ],
    },
  ],
});

const SECTION_ICONS: Record<string, React.ReactNode> = {
  envio: <Send className="h-4 w-4" />,
  templates: <FileText className="h-4 w-4" />,
  recepcion: <Inbox className="h-4 w-4" />,
  multicanal: <MessagesSquare className="h-4 w-4" />,
  broadcast: <Radio className="h-4 w-4" />,
  persistencia: <Database className="h-4 w-4" />,
  flags: <Shield className="h-4 w-4" />,
  e2e: <Play className="h-4 w-4" />,
};

const STATUS_COLORS: Record<TestStatus, string> = {
  pending: 'bg-muted text-muted-foreground',
  pass: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  fail: 'bg-destructive/15 text-destructive',
  skip: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
};

const STATUS_LABELS: Record<TestStatus, string> = {
  pending: 'Pendiente',
  pass: 'Pass',
  fail: 'Fail',
  skip: 'Skip',
};

/* ─── Component ─── */

export const QAChecklistPanel: React.FC = () => {
  const [state, setState] = useLocalStorage<ChecklistState>('qa-checklist-whatsapp', createInitialState());
  const [collapsedSections, setCollapsedSections] = useLocalStorage<string[]>('qa-checklist-collapsed', []);

  const updateTestStatus = useCallback((testId: string, status: TestStatus) => {
    setState(prev => ({
      ...prev,
      lastUpdated: new Date().toISOString(),
      sections: prev.sections.map(section => ({
        ...section,
        tests: section.tests.map(test =>
          test.id === testId
            ? { ...test, status, timestamp: status !== 'pending' ? new Date().toISOString() : null }
            : test
        ),
      })),
    }));
  }, [setState]);

  const toggleSection = useCallback((sectionId: string) => {
    setCollapsedSections(prev =>
      prev.includes(sectionId) ? prev.filter(s => s !== sectionId) : [...prev, sectionId]
    );
  }, [setCollapsedSections]);

  const globalStats = useMemo(() => {
    const allTests = state.sections.flatMap(s => s.tests);
    const total = allTests.length;
    const pass = allTests.filter(t => t.status === 'pass').length;
    const fail = allTests.filter(t => t.status === 'fail').length;
    const skip = allTests.filter(t => t.status === 'skip').length;
    const completed = pass + fail + skip;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, pass, fail, skip, completed, pct };
  }, [state]);

  const handleReset = () => {
    if (window.confirm('¿Resetear todo el checklist? Se perderá el progreso actual.')) {
      setState(createInitialState());
    }
  };

  const handleExport = () => {
    const exportData = {
      exportedAt: new Date().toISOString(),
      summary: globalStats,
      sections: state.sections.map(s => ({
        title: s.title,
        tests: s.tests.map(t => ({
          description: t.description,
          status: t.status,
          timestamp: t.timestamp,
        })),
      })),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qa-checklist-whatsapp-${format(new Date(), 'yyyy-MM-dd-HHmm')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const progressColor = globalStats.pct < 50 ? 'text-destructive' : globalStats.pct < 80 ? 'text-amber-500' : 'text-emerald-500';

  return (
    <div className="space-y-4">
      {/* Global Progress */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">QA Checklist WhatsApp</CardTitle>
              <CardDescription className="text-xs">
                {globalStats.completed}/{globalStats.total} pruebas completadas
                {state.lastUpdated && (
                  <> · Última actualización: {format(new Date(state.lastUpdated), 'dd/MM HH:mm')}</>
                )}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-3.5 w-3.5 mr-1.5" />
                Exportar
              </Button>
              <Button variant="ghost" size="sm" onClick={handleReset}>
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                Reset
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <Progress value={globalStats.pct} className="flex-1 h-3" />
            <span className={cn('text-sm font-bold tabular-nums', progressColor)}>
              {globalStats.pct}%
            </span>
          </div>
          <div className="flex gap-3 text-xs">
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">✓ {globalStats.pass} pass</span>
            <span className="text-destructive font-medium">✗ {globalStats.fail} fail</span>
            <span className="text-amber-600 dark:text-amber-400 font-medium">⊘ {globalStats.skip} skip</span>
            <span className="text-muted-foreground">{globalStats.total - globalStats.completed} pendientes</span>
          </div>
        </CardContent>
      </Card>

      {/* Sections */}
      {state.sections.map(section => {
        const isCollapsed = collapsedSections.includes(section.id);
        const sectionPass = section.tests.filter(t => t.status === 'pass').length;
        const sectionTotal = section.tests.length;
        const sectionDone = section.tests.filter(t => t.status !== 'pending').length;
        const allPass = sectionPass === sectionTotal;
        const hasFail = section.tests.some(t => t.status === 'fail');

        return (
          <Card key={section.id} className={cn(allPass && 'border-emerald-500/30', hasFail && 'border-destructive/30')}>
            <CardHeader
              className="pb-2 cursor-pointer select-none"
              onClick={() => toggleSection(section.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isCollapsed ? <ChevronRight className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  <span className="text-muted-foreground">{SECTION_ICONS[section.id]}</span>
                  <CardTitle className="text-sm">{section.title}</CardTitle>
                </div>
                <Badge variant="outline" className={cn('text-xs', allPass ? 'border-emerald-500/50 text-emerald-600' : hasFail ? 'border-destructive/50 text-destructive' : '')}>
                  {sectionDone}/{sectionTotal}
                </Badge>
              </div>
            </CardHeader>
            {!isCollapsed && (
              <CardContent className="pt-0">
                <div className="space-y-1">
                  {section.tests.map(test => (
                    <TestItemRow
                      key={test.id}
                      test={test}
                      onStatusChange={(status) => updateTestStatus(test.id, status)}
                    />
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
};

/* ─── Test Item Row ─── */

const TestItemRow: React.FC<{
  test: TestItem;
  onStatusChange: (status: TestStatus) => void;
}> = ({ test, onStatusChange }) => {
  const isChecked = test.status === 'pass';

  return (
    <div className={cn(
      'flex items-center gap-3 rounded-lg px-3 py-2 transition-colors',
      test.status === 'pass' && 'bg-emerald-500/5',
      test.status === 'fail' && 'bg-destructive/5',
    )}>
      <Checkbox
        checked={isChecked}
        onCheckedChange={(checked) => {
          onStatusChange(checked ? 'pass' : 'pending');
        }}
        className="shrink-0"
      />
      <span className={cn(
        'flex-1 text-sm',
        test.status === 'pass' && 'line-through text-muted-foreground',
      )}>
        {test.description}
      </span>
      <div className="flex items-center gap-2 shrink-0">
        {test.timestamp && (
          <span className="text-[10px] text-muted-foreground tabular-nums hidden sm:inline">
            {format(new Date(test.timestamp), 'HH:mm')}
          </span>
        )}
        <Select
          value={test.status}
          onValueChange={(v: TestStatus) => onStatusChange(v)}
        >
          <SelectTrigger className={cn('h-7 w-[90px] text-xs border-0', STATUS_COLORS[test.status])}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pendiente</SelectItem>
            <SelectItem value="pass">Pass ✓</SelectItem>
            <SelectItem value="fail">Fail ✗</SelectItem>
            <SelectItem value="skip">Skip ⊘</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
