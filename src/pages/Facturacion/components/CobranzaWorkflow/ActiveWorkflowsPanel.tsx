import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Workflow,
  Search,
  Filter,
  Phone,
  Mail,
  AlertTriangle,
  Scale,
  Bell,
  HandCoins,
  Clock,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Calendar,
} from 'lucide-react';
import { useActiveWorkflows, WorkflowInstance } from '../../hooks/useCobranzaWorkflow';
import { formatCurrency } from '@/utils/formatUtils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { PromesaPagoModal } from './PromesaPagoModal';
import { RegistrarAccionModal } from './RegistrarAccionModal';

const getPrioridadConfig = (prioridad: WorkflowInstance['prioridad']) => {
  switch (prioridad) {
    case 'critica':
      return { color: 'bg-red-500/10 text-red-700 border-red-500/30', label: 'Crítico' };
    case 'alta':
      return { color: 'bg-orange-500/10 text-orange-700 border-orange-500/30', label: 'Alto' };
    case 'media':
      return { color: 'bg-amber-500/10 text-amber-700 border-amber-500/30', label: 'Medio' };
    case 'baja':
      return { color: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30', label: 'Bajo' };
  }
};

const getAccionIcon = (accion: string) => {
  switch (accion) {
    case 'llamada':
      return Phone;
    case 'email':
      return Mail;
    case 'escalamiento':
      return AlertTriangle;
    case 'juridico':
      return Scale;
    default:
      return Bell;
  }
};

export function ActiveWorkflowsPanel() {
  const { data: workflows, isLoading } = useActiveWorkflows();
  const [search, setSearch] = useState('');
  const [filterPrioridad, setFilterPrioridad] = useState<string>('all');
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowInstance | null>(null);
  const [promesaModalOpen, setPromesaModalOpen] = useState(false);
  const [accionModalOpen, setAccionModalOpen] = useState(false);

  const filteredWorkflows = (workflows || []).filter(w => {
    const matchSearch = 
      w.cliente_nombre.toLowerCase().includes(search.toLowerCase()) ||
      w.numero_factura?.toLowerCase().includes(search.toLowerCase());
    
    const matchPrioridad = filterPrioridad === 'all' || w.prioridad === filterPrioridad;
    
    return matchSearch && matchPrioridad;
  });

  const handleOpenPromesa = (workflow: WorkflowInstance) => {
    setSelectedWorkflow(workflow);
    setPromesaModalOpen(true);
  };

  const handleOpenAccion = (workflow: WorkflowInstance) => {
    setSelectedWorkflow(workflow);
    setAccionModalOpen(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="py-3 px-4">
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="h-full flex flex-col">
        <CardHeader className="py-3 px-4 shrink-0">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Workflow className="h-4 w-4 text-primary" />
            Workflows Activos
            <Badge variant="secondary" className="ml-auto">
              {filteredWorkflows.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="px-4 pb-4 flex-1 flex flex-col min-h-0 space-y-3">
          {/* Filters */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar cliente o factura..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
            </div>
            <Select value={filterPrioridad} onValueChange={setFilterPrioridad}>
              <SelectTrigger className="w-[110px] h-8 text-sm">
                <Filter className="h-3.5 w-3.5 mr-1" />
                <SelectValue placeholder="Prioridad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="critica">Crítica</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
                <SelectItem value="media">Media</SelectItem>
                <SelectItem value="baja">Baja</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Workflows List */}
          <ScrollArea className="flex-1">
            {filteredWorkflows.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-10 w-10 mb-2 text-emerald-500" />
                <p className="text-sm font-medium">Sin workflows pendientes</p>
              </div>
            ) : (
              <div className="space-y-2 pr-2">
                {filteredWorkflows.map((workflow) => {
                  const prioConfig = getPrioridadConfig(workflow.prioridad);
                  const AccionIcon = getAccionIcon(workflow.proxima_accion);
                  
                  return (
                    <div
                      key={workflow.id}
                      className={cn(
                        'p-3 rounded-lg border transition-colors',
                        prioConfig.color
                      )}
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">
                            {workflow.cliente_nombre}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {workflow.numero_factura}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn('shrink-0 text-[10px]', prioConfig.color)}
                        >
                          {prioConfig.label}
                        </Badge>
                      </div>

                      {/* Info */}
                      <div className="grid grid-cols-2 gap-2 mb-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">Monto: </span>
                          <span className="font-medium">
                            {formatCurrency(workflow.monto_pendiente)}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Días: </span>
                          <span className={cn(
                            'font-medium',
                            workflow.dias_vencido > 30 && 'text-red-600',
                            workflow.dias_vencido > 0 && workflow.dias_vencido <= 30 && 'text-amber-600'
                          )}>
                            {workflow.dias_vencido > 0 ? `+${workflow.dias_vencido}` : workflow.dias_vencido}
                          </span>
                        </div>
                      </div>

                      {/* Stage */}
                      <div className="flex items-center gap-2 mb-2 p-1.5 bg-background/60 rounded text-xs">
                        <AccionIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="truncate flex-1">{workflow.etapa_actual}</span>
                        {workflow.tiene_promesa_activa && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <HandCoins className="h-3.5 w-3.5 text-purple-600" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Tiene promesa de pago activa</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-xs"
                                onClick={() => handleOpenAccion(workflow)}
                              >
                                <Phone className="h-3.5 w-3.5 mr-1" />
                                Acción
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Registrar acción de cobranza</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-xs text-purple-600 hover:text-purple-700"
                                onClick={() => handleOpenPromesa(workflow)}
                              >
                                <HandCoins className="h-3.5 w-3.5 mr-1" />
                                Promesa
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Registrar promesa de pago</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <div className="flex-1" />
                        
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {workflow.historial_acciones} acciones
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Modals */}
      {selectedWorkflow && (
        <>
          <PromesaPagoModal
            open={promesaModalOpen}
            onOpenChange={setPromesaModalOpen}
            clienteId={selectedWorkflow.cliente_id}
            clienteNombre={selectedWorkflow.cliente_nombre}
            facturaId={selectedWorkflow.factura_id}
            numeroFactura={selectedWorkflow.numero_factura}
            montoSugerido={selectedWorkflow.monto_pendiente}
          />
          
          <RegistrarAccionModal
            open={accionModalOpen}
            onOpenChange={setAccionModalOpen}
            clienteId={selectedWorkflow.cliente_id}
            clienteNombre={selectedWorkflow.cliente_nombre}
            facturaId={selectedWorkflow.factura_id}
            numeroFactura={selectedWorkflow.numero_factura}
          />
        </>
      )}
    </>
  );
}
