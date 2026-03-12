import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Play, CheckCircle2, XCircle, Loader2, RotateCcw, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SimStep {
  id: string;
  label: string;
  description: string;
  status: 'pending' | 'running' | 'success' | 'error';
  error?: string;
  execute: (ctx: SimContext) => Promise<void>;
}

interface SimContext {
  servicioId: string;
  phone: string;
}

type Scenario = 'planeacion' | 'monitoreo' | 'cliente';

const StatusIcon: React.FC<{ status: SimStep['status'] }> = ({ status }) => {
  switch (status) {
    case 'pending': return <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />;
    case 'running': return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
    case 'success': return <CheckCircle2 className="h-4 w-4 text-chart-2" />;
    case 'error': return <XCircle className="h-4 w-4 text-destructive" />;
  }
};

async function insertSimMessage(params: {
  phone: string;
  servicioId: string;
  body: string;
  direction: 'inbound' | 'outbound';
  senderType: string;
  commChannel: string;
  messageType?: string;
  mediaUrl?: string;
}) {
  const { error } = await supabase.from('whatsapp_messages').insert({
    phone_number: params.phone,
    servicio_id: params.servicioId,
    message_body: params.body,
    direction: params.direction,
    sender_type: params.senderType,
    comm_channel: params.commChannel,
    message_type: params.messageType || 'text',
    media_url: params.mediaUrl || null,
    status: params.direction === 'outbound' ? 'sent' : 'received',
    kapso_message_id: `sim_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    is_from_bot: false,
  });
  if (error) throw error;
}

function createPlaneacionSteps(): SimStep[] {
  return [
    {
      id: 'p1', label: 'Staff pregunta posición', description: 'comm_channel=custodio_planeacion, sender_type=staff',
      status: 'pending',
      execute: async (ctx) => {
        await insertSimMessage({ phone: ctx.phone, servicioId: ctx.servicioId, body: '¿Ya estás en posición?', direction: 'outbound', senderType: 'staff', commChannel: 'custodio_planeacion' });
      },
    },
    {
      id: 'p2', label: 'Custodio responde', description: 'sender_type=custodio, texto libre',
      status: 'pending',
      execute: async (ctx) => {
        await insertSimMessage({ phone: ctx.phone, servicioId: ctx.servicioId, body: 'Sí, ya estoy aquí en la ubicación', direction: 'inbound', senderType: 'custodio', commChannel: 'custodio_planeacion' });
      },
    },
    {
      id: 'p3', label: 'Staff pide foto', description: 'Solicitud de evidencia fotográfica',
      status: 'pending',
      execute: async (ctx) => {
        await insertSimMessage({ phone: ctx.phone, servicioId: ctx.servicioId, body: 'Envía foto de tu ubicación actual', direction: 'outbound', senderType: 'staff', commChannel: 'custodio_planeacion' });
      },
    },
    {
      id: 'p4', label: 'Custodio envía imagen', description: 'message_type=image simulada',
      status: 'pending',
      execute: async (ctx) => {
        await insertSimMessage({ phone: ctx.phone, servicioId: ctx.servicioId, body: 'Foto de ubicación', direction: 'inbound', senderType: 'custodio', commChannel: 'custodio_planeacion', messageType: 'image', mediaUrl: 'https://placehold.co/400x300/22c55e/white?text=Ubicacion+Sim' });
      },
    },
    {
      id: 'p5', label: 'Handoff a C4', description: 'Mensaje sistema: transferencia',
      status: 'pending',
      execute: async (ctx) => {
        await insertSimMessage({ phone: ctx.phone, servicioId: ctx.servicioId, body: '🔄 Servicio transferido a C4 — monitoreo activo', direction: 'outbound', senderType: 'sistema', commChannel: 'sistema' });
      },
    },
    {
      id: 'p6', label: 'Verificar read-only post-handoff', description: 'Confirma que mensajes sistema existen',
      status: 'pending',
      execute: async (ctx) => {
        const { data, error } = await supabase
          .from('whatsapp_messages')
          .select('id')
          .eq('servicio_id', ctx.servicioId)
          .eq('sender_type', 'sistema')
          .limit(1);
        if (error) throw error;
        if (!data || data.length === 0) throw new Error('No se encontró mensaje de sistema — handoff no registrado');
      },
    },
  ];
}

function createMonitoreoSteps(): SimStep[] {
  return [
    {
      id: 'm1', label: 'Monitorista envía nudge', description: 'comm_channel=custodio_c4, template simulado',
      status: 'pending',
      execute: async (ctx) => {
        await insertSimMessage({ phone: ctx.phone, servicioId: ctx.servicioId, body: '[Template] Hola, ¿cuál es tu estatus actual?', direction: 'outbound', senderType: 'staff', commChannel: 'custodio_c4', messageType: 'template' });
      },
    },
    {
      id: 'm2', label: 'Custodio responde texto', description: 'Respuesta libre del custodio',
      status: 'pending',
      execute: async (ctx) => {
        await insertSimMessage({ phone: ctx.phone, servicioId: ctx.servicioId, body: 'Todo bien, sin novedad en el trayecto', direction: 'inbound', senderType: 'custodio', commChannel: 'custodio_c4' });
      },
    },
    {
      id: 'm3', label: 'Monitorista mensaje libre', description: 'Texto libre de staff',
      status: 'pending',
      execute: async (ctx) => {
        await insertSimMessage({ phone: ctx.phone, servicioId: ctx.servicioId, body: 'Recibido, mantente en comunicación', direction: 'outbound', senderType: 'staff', commChannel: 'custodio_c4' });
      },
    },
    {
      id: 'm4', label: 'Custodio envía imagen', description: 'Foto de evidencia media',
      status: 'pending',
      execute: async (ctx) => {
        await insertSimMessage({ phone: ctx.phone, servicioId: ctx.servicioId, body: 'Foto de ruta actual', direction: 'inbound', senderType: 'custodio', commChannel: 'custodio_c4', messageType: 'image', mediaUrl: 'https://placehold.co/400x300/3b82f6/white?text=Ruta+Sim' });
      },
    },
    {
      id: 'm5', label: 'Verificar persistencia', description: 'Confirma comm_channel correcto en todos',
      status: 'pending',
      execute: async (ctx) => {
        const { data, error } = await supabase
          .from('whatsapp_messages')
          .select('id, comm_channel')
          .eq('servicio_id', ctx.servicioId)
          .eq('comm_channel', 'custodio_c4');
        if (error) throw error;
        if (!data || data.length < 4) throw new Error(`Solo ${data?.length || 0} mensajes con comm_channel=custodio_c4, esperados ≥4`);
      },
    },
  ];
}

function createClienteSteps(): SimStep[] {
  return [
    {
      id: 'c1', label: 'Staff envía a cliente', description: 'comm_channel=cliente_c4, sender_type=staff',
      status: 'pending',
      execute: async (ctx) => {
        await insertSimMessage({ phone: ctx.phone, servicioId: ctx.servicioId, body: 'Su custodio ya está en camino al punto de encuentro', direction: 'outbound', senderType: 'staff', commChannel: 'cliente_c4' });
      },
    },
    {
      id: 'c2', label: 'Cliente responde', description: 'sender_type=cliente, respuesta libre',
      status: 'pending',
      execute: async (ctx) => {
        await insertSimMessage({ phone: ctx.phone, servicioId: ctx.servicioId, body: 'Perfecto, lo espero en la entrada', direction: 'inbound', senderType: 'cliente', commChannel: 'cliente_c4' });
      },
    },
    {
      id: 'c3', label: 'Broadcast a 3 contactos', description: 'Simula envío multi-contacto',
      status: 'pending',
      execute: async (ctx) => {
        const contacts = ['_contact1', '_contact2', '_contact3'];
        const ts = Date.now();
        for (const suffix of contacts) {
          await insertSimMessage({
            phone: ctx.phone + suffix,
            servicioId: ctx.servicioId,
            body: 'Su servicio de custodia ha sido completado. Gracias por su confianza.',
            direction: 'outbound',
            senderType: 'staff',
            commChannel: 'cliente_c4',
          });
        }
      },
    },
    {
      id: 'c4', label: 'Verificar canal cliente', description: 'Confirma registros cliente_c4',
      status: 'pending',
      execute: async (ctx) => {
        const { data, error } = await supabase
          .from('whatsapp_messages')
          .select('id')
          .eq('servicio_id', ctx.servicioId)
          .eq('comm_channel', 'cliente_c4');
        if (error) throw error;
        if (!data || data.length < 2) throw new Error(`Solo ${data?.length || 0} mensajes cliente_c4, esperados ≥2`);
      },
    },
  ];
}

export const CommScenarioSimulator: React.FC<{ servicioId: string; phone: string }> = ({
  servicioId: defaultServicioId,
  phone: defaultPhone,
}) => {
  const [scenario, setScenario] = useState<Scenario>('planeacion');
  const [servicioId, setServicioId] = useState(defaultServicioId);
  const [phone, setPhone] = useState(defaultPhone);
  const [steps, setSteps] = useState<SimStep[]>(createPlaneacionSteps());
  const [running, setRunning] = useState(false);

  const switchScenario = useCallback((s: Scenario) => {
    setScenario(s);
    setSteps(
      s === 'planeacion' ? createPlaneacionSteps()
      : s === 'monitoreo' ? createMonitoreoSteps()
      : createClienteSteps()
    );
  }, []);

  const executeStep = useCallback(async (stepId: string) => {
    if (!servicioId || !phone) {
      toast.error('Configura servicio ID y teléfono');
      return;
    }
    setSteps(prev => prev.map(s => s.id === stepId ? { ...s, status: 'running' } : s));
    const step = steps.find(s => s.id === stepId);
    if (!step) return;
    try {
      await step.execute({ servicioId, phone });
      setSteps(prev => prev.map(s => s.id === stepId ? { ...s, status: 'success' } : s));
    } catch (err: any) {
      setSteps(prev => prev.map(s => s.id === stepId ? { ...s, status: 'error', error: err.message } : s));
    }
  }, [servicioId, phone, steps]);

  const executeAll = useCallback(async () => {
    if (!servicioId || !phone) {
      toast.error('Configura servicio ID y teléfono');
      return;
    }
    setRunning(true);
    const currentSteps = scenario === 'planeacion' ? createPlaneacionSteps()
      : scenario === 'monitoreo' ? createMonitoreoSteps()
      : createClienteSteps();
    setSteps(currentSteps);

    for (const step of currentSteps) {
      setSteps(prev => prev.map(s => s.id === step.id ? { ...s, status: 'running' } : s));
      try {
        await step.execute({ servicioId, phone });
        setSteps(prev => prev.map(s => s.id === step.id ? { ...s, status: 'success' } : s));
        await new Promise(r => setTimeout(r, 500)); // Small delay for visual feedback
      } catch (err: any) {
        setSteps(prev => prev.map(s => s.id === step.id ? { ...s, status: 'error', error: err.message } : s));
        toast.error(`Error en paso "${step.label}": ${err.message}`);
        break;
      }
    }
    setRunning(false);
    toast.success(`Escenario ${scenario} completado`);
  }, [servicioId, phone, scenario]);

  const reset = useCallback(() => {
    switchScenario(scenario);
  }, [scenario, switchScenario]);

  const completedCount = steps.filter(s => s.status === 'success').length;
  const hasErrors = steps.some(s => s.status === 'error');

  return (
    <div className="space-y-4">
      {/* Scenario selector */}
      <div className="flex items-center gap-2 flex-wrap">
        {[
          { key: 'planeacion' as Scenario, label: '📋 Planeación', desc: 'Flujo pre-servicio con custodio' },
          { key: 'monitoreo' as Scenario, label: '📡 Monitoreo', desc: 'Flujo C4 en servicio activo' },
          { key: 'cliente' as Scenario, label: '👤 Cliente', desc: 'Chat bidireccional + broadcast' },
        ].map(s => (
          <Button
            key={s.key}
            variant={scenario === s.key ? 'default' : 'outline'}
            size="sm"
            onClick={() => switchScenario(s.key)}
            disabled={running}
            className="text-xs"
          >
            {s.label}
          </Button>
        ))}
      </div>

      {/* Config */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Servicio ID</Label>
          <Input value={servicioId} onChange={e => setServicioId(e.target.value)} placeholder="UUID del servicio" className="h-8 text-xs font-mono" />
        </div>
        <div>
          <Label className="text-xs">Teléfono</Label>
          <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="521234567890" className="h-8 text-xs font-mono" />
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              hasErrors ? 'bg-destructive' : 'bg-chart-2'
            )}
            style={{ width: `${(completedCount / steps.length) * 100}%` }}
          />
        </div>
        <span className="text-xs text-muted-foreground tabular-nums">{completedCount}/{steps.length}</span>
      </div>

      {/* Steps */}
      <Card>
        <CardContent className="pt-4 space-y-1">
          {steps.map((step, i) => (
            <div key={step.id} className="flex items-start gap-3 py-2 px-2 rounded-md hover:bg-muted/50">
              <StatusIcon status={step.status} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium">{i + 1}. {step.label}</p>
                <p className="text-[10px] text-muted-foreground">{step.description}</p>
                {step.error && (
                  <p className="text-[10px] text-destructive mt-0.5">{step.error}</p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[10px]"
                disabled={running || step.status === 'running'}
                onClick={() => executeStep(step.id)}
              >
                <Play className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button onClick={executeAll} disabled={running || !servicioId || !phone} size="sm" className="gap-1.5">
          <Zap className="h-3.5 w-3.5" />
          Ejecutar Todo
        </Button>
        <Button variant="outline" size="sm" onClick={reset} disabled={running} className="gap-1.5">
          <RotateCcw className="h-3.5 w-3.5" />
          Reiniciar
        </Button>
        {completedCount === steps.length && !hasErrors && (
          <Badge variant="success" className="text-xs">✅ Escenario completado</Badge>
        )}
      </div>
    </div>
  );
};
