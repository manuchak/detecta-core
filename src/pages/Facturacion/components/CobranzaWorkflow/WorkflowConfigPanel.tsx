import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Settings2,
  Bell,
  Phone,
  Mail,
  AlertTriangle,
  Scale,
  Clock,
  Zap,
  DollarSign,
  Calendar,
  Save,
  RotateCcw,
} from 'lucide-react';
import { DEFAULT_WORKFLOW_CONFIG, WorkflowStage } from '../../hooks/useCobranzaWorkflow';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const getStageIcon = (tipo: WorkflowStage['tipo_accion']) => {
  switch (tipo) {
    case 'recordatorio': return Bell;
    case 'email': return Mail;
    case 'llamada': return Phone;
    case 'escalamiento': return AlertTriangle;
    case 'juridico': return Scale;
    default: return Clock;
  }
};

export function WorkflowConfigPanel() {
  const [config, setConfig] = useState(DEFAULT_WORKFLOW_CONFIG);
  const [hasChanges, setHasChanges] = useState(false);

  const handleConfigChange = (key: keyof typeof config, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleStageToggle = (stageId: string, autoEjecutar: boolean) => {
    setConfig(prev => ({
      ...prev,
      etapas: prev.etapas.map(e => 
        e.id === stageId ? { ...e, auto_ejecutar: autoEjecutar } : e
      ),
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    // In a real app, this would save to database
    toast.success('Configuración guardada');
    setHasChanges(false);
  };

  const handleReset = () => {
    setConfig(DEFAULT_WORKFLOW_CONFIG);
    setHasChanges(false);
    toast.info('Configuración restaurada a valores predeterminados');
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="py-3 px-4 shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-primary" />
            Configuración del Workflow
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleReset}
              disabled={!hasChanges}
              className="h-7 text-xs"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              Restaurar
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!hasChanges}
              className="h-7 text-xs"
            >
              <Save className="h-3.5 w-3.5 mr-1" />
              Guardar
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4 flex-1 min-h-0">
        <ScrollArea className="h-full pr-2">
          <div className="space-y-4">
            {/* General Settings */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-500" />
                Configuración General
              </h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="dias-gracia" className="text-xs">Días de Gracia</Label>
                  <Input
                    id="dias-gracia"
                    type="number"
                    min="0"
                    max="30"
                    value={config.dias_gracia}
                    onChange={(e) => handleConfigChange('dias_gracia', parseInt(e.target.value))}
                    className="h-8"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="frecuencia" className="text-xs">Frecuencia Recordatorios (días)</Label>
                  <Input
                    id="frecuencia"
                    type="number"
                    min="1"
                    max="30"
                    value={config.frecuencia_recordatorios}
                    onChange={(e) => handleConfigChange('frecuencia_recordatorios', parseInt(e.target.value))}
                    className="h-8"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="umbral" className="text-xs flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  Umbral Monto Crítico
                </Label>
                <Input
                  id="umbral"
                  type="number"
                  min="0"
                  value={config.umbral_monto_critico}
                  onChange={(e) => handleConfigChange('umbral_monto_critico', parseInt(e.target.value))}
                  className="h-8"
                />
                <p className="text-[10px] text-muted-foreground">
                  Montos superiores se marcarán como prioridad crítica
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="escalamiento-auto" className="text-xs cursor-pointer">
                    Escalamiento Automático
                  </Label>
                  <Switch
                    id="escalamiento-auto"
                    checked={config.escalamiento_automatico}
                    onCheckedChange={(checked) => handleConfigChange('escalamiento_automatico', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="notificar-sup" className="text-xs cursor-pointer">
                    Notificar a Supervisor
                  </Label>
                  <Switch
                    id="notificar-sup"
                    checked={config.notificar_supervisor}
                    onCheckedChange={(checked) => handleConfigChange('notificar_supervisor', checked)}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Workflow Stages */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-500" />
                Etapas del Workflow
              </h4>

              <Accordion type="single" collapsible className="space-y-1">
                {config.etapas.map((stage) => {
                  const Icon = getStageIcon(stage.tipo_accion);
                  
                  return (
                    <AccordionItem
                      key={stage.id}
                      value={stage.id}
                      className="border rounded-lg px-3"
                    >
                      <AccordionTrigger className="py-2 hover:no-underline">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            'p-1.5 rounded-md',
                            stage.prioridad === 'critica' && 'bg-red-500/10',
                            stage.prioridad === 'alta' && 'bg-orange-500/10',
                            stage.prioridad === 'media' && 'bg-amber-500/10',
                            stage.prioridad === 'baja' && 'bg-emerald-500/10'
                          )}>
                            <Icon className={cn(
                              'h-3.5 w-3.5',
                              stage.prioridad === 'critica' && 'text-red-600',
                              stage.prioridad === 'alta' && 'text-orange-600',
                              stage.prioridad === 'media' && 'text-amber-600',
                              stage.prioridad === 'baja' && 'text-emerald-600'
                            )} />
                          </div>
                          <span className="text-sm font-medium">{stage.nombre}</span>
                          {stage.auto_ejecutar && (
                            <Badge variant="secondary" className="text-[10px] h-4">
                              Auto
                            </Badge>
                          )}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-2 pb-3">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Días desde vencimiento:</span>
                            <span className="font-medium">
                              {stage.dias_desde_vencimiento < 0 
                                ? `${Math.abs(stage.dias_desde_vencimiento)} días antes`
                                : stage.dias_desde_vencimiento === 0
                                ? 'Día de vencimiento'
                                : `${stage.dias_desde_vencimiento} días después`
                              }
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Tipo de acción:</span>
                            <Badge variant="outline" className="text-[10px] capitalize">
                              {stage.tipo_accion}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Prioridad:</span>
                            <Badge 
                              variant="outline" 
                              className={cn(
                                'text-[10px] capitalize',
                                stage.prioridad === 'critica' && 'border-red-500/50 text-red-600',
                                stage.prioridad === 'alta' && 'border-orange-500/50 text-orange-600',
                                stage.prioridad === 'media' && 'border-amber-500/50 text-amber-600',
                                stage.prioridad === 'baja' && 'border-emerald-500/50 text-emerald-600'
                              )}
                            >
                              {stage.prioridad}
                            </Badge>
                          </div>
                          <Separator />
                          <div className="flex items-center justify-between">
                            <Label htmlFor={`auto-${stage.id}`} className="text-xs cursor-pointer">
                              Ejecutar automáticamente
                            </Label>
                            <Switch
                              id={`auto-${stage.id}`}
                              checked={stage.auto_ejecutar}
                              onCheckedChange={(checked) => handleStageToggle(stage.id, checked)}
                            />
                          </div>
                          <p className="text-[10px] text-muted-foreground bg-muted/50 p-2 rounded">
                            {stage.mensaje_template}
                          </p>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
