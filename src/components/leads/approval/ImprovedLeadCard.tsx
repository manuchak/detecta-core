import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Phone, 
  Bot, 
  Edit, 
  CheckCircle, 
  XCircle, 
  Mail, 
  ArrowRight,
  Calendar,
  User,
  AlertTriangle,
  MoreHorizontal,
  PhoneCall,
  Archive
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { AssignedLead } from "@/types/leadTypes";
import { VapiCallLog } from "@/types/vapiTypes";
import { validateLeadForApproval } from "@/utils/leadValidation";
import { cn } from "@/lib/utils";

interface ImprovedLeadCardProps {
  lead: AssignedLead;
  callLogs: VapiCallLog[];
  onVapiCall: (lead: AssignedLead) => void;
  onManualInterview: (lead: AssignedLead) => void;
  onEditLead: (lead: AssignedLead) => void;
  onViewCallHistory: (lead: AssignedLead) => void;
  onApproveLead: (lead: AssignedLead) => void;
  onSendToSecondInterview: (lead: AssignedLead) => void;
  onReject: (lead: AssignedLead) => void;
  onCompleteMissingInfo: (lead: AssignedLead) => void;
  onLogCall: (lead: AssignedLead) => void;
  onMoveToPool?: (lead: AssignedLead) => void;
}

export const ImprovedLeadCard = ({
  lead,
  callLogs,
  onVapiCall,
  onManualInterview,
  onEditLead,
  onViewCallHistory,
  onApproveLead,
  onSendToSecondInterview,
  onReject,
  onCompleteMissingInfo,
  onLogCall,
  onMoveToPool
}: ImprovedLeadCardProps) => {
  const validation = validateLeadForApproval(lead);
  const hasMissingInfo = !validation.isValid;
  const hasSuccessfulCall = lead.has_successful_call || false;

  const getStatusBadge = (stage: string, decision: string | null) => {
    if (decision === 'approved') {
      return <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600">Aprobado</Badge>;
    }
    if (decision === 'rejected') {
      return <Badge variant="destructive">Rechazado</Badge>;
    }
    
    switch (stage) {
      case 'phone_interview':
        return <Badge variant="secondary">Entrevista Telefónica</Badge>;
      case 'second_interview':
        return <Badge className="bg-purple-500 hover:bg-purple-600">Segunda Entrevista</Badge>;
      default:
        return <Badge variant="outline">Pendiente</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <Card className="group hover:shadow-lg hover:scale-[1.01] transition-all duration-200 border-0 shadow-sm hover:shadow-md bg-gradient-to-br from-background to-muted/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 shadow-sm">
              <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-medium text-sm">
                {getInitials(lead.lead_nombre)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium text-base leading-none truncate">{lead.lead_nombre}</h3>
                {/* Quick call action - appears on hover */}
                {lead.lead_telefono && !hasSuccessfulCall && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onLogCall(lead)}
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-primary/10 hover:text-primary"
                      >
                        <Phone className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Llamar ahora</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {getStatusBadge(lead.approval_stage, lead.final_decision)}
                {hasMissingInfo && (
                  <Badge variant="outline" className="text-xs px-1.5 py-0.5 text-amber-600 border-amber-200 bg-amber-50 dark:bg-amber-950 dark:text-amber-400">
                    <AlertTriangle className="h-2.5 w-2.5 mr-1" />
                    Incompleta
                  </Badge>
                )}
                {lead.has_scheduled_call && (
                  <Badge variant="outline" className="text-xs px-1.5 py-0.5 text-blue-600 border-blue-200 bg-blue-50 dark:bg-blue-950 dark:text-blue-400">
                    <Calendar className="h-2.5 w-2.5 mr-1" />
                    Programada
                  </Badge>
                )}
                {(lead.contact_attempts_count && lead.contact_attempts_count > 0) && (
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "text-xs px-1.5 py-0.5",
                      lead.contact_attempts_count >= 3 
                        ? "text-red-600 border-red-200 bg-red-50 dark:bg-red-950 dark:text-red-400"
                        : lead.contact_attempts_count >= 2
                        ? "text-orange-600 border-orange-200 bg-orange-50 dark:bg-orange-950 dark:text-orange-400" 
                        : "text-gray-600 border-gray-200 bg-gray-50 dark:bg-gray-950 dark:text-gray-400"
                    )}
                  >
                    <PhoneCall className="h-2.5 w-2.5 mr-1" />
                    {lead.contact_attempts_count} {lead.contact_attempts_count === 1 ? 'intento' : 'intentos'}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Badge del analista asignado */}
          {lead.analista_nombre && (
            <Badge 
              variant="outline" 
              className="text-xs px-2 py-1 bg-primary/5 text-primary border-primary/20 font-medium"
            >
              <User className="h-3 w-3 mr-1" />
              {lead.analista_nombre}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {/* Información de contacto - más compacta */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <Mail className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            <span className="text-muted-foreground truncate">{lead.lead_email || 'Sin email'}</span>
          </div>
          {lead.lead_telefono && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Phone className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="font-mono">{lead.lead_telefono}</span>
            </div>
          )}
        </div>

        {/* Metadatos - inline y más sutiles */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground/80 pb-3 border-b border-border/50">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDate(lead.lead_fecha_creacion)}
          </div>
          <div className="flex items-center gap-1">
            <Bot className="h-3 w-3" />
            {callLogs.length} {callLogs.length === 1 ? 'llamada' : 'llamadas'}
          </div>
        </div>

        {/* Acciones sutiles */}
        <div className="flex items-center justify-between">
          {/* Acción prioritaria: Completar información */}
          {hasSuccessfulCall && hasMissingInfo && (
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    onClick={() => onCompleteMissingInfo(lead)}
                    className="h-7 px-3 bg-amber-500 hover:bg-amber-600 text-amber-50 text-xs"
                  >
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Completar Info
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Completar información faltante</p>
                </TooltipContent>
              </Tooltip>
            </div>
          )}

          {/* Acciones de decisión final */}
          {!lead.final_decision && hasSuccessfulCall && !hasMissingInfo && (
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    onClick={() => onApproveLead(lead)}
                    className="h-7 px-3 bg-emerald-500 hover:bg-emerald-600 text-emerald-50 text-xs"
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Aprobar
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Aprobar candidato</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onSendToSecondInterview(lead)}
                    className="h-7 px-3 border-purple-200 text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950 text-xs"
                  >
                    <ArrowRight className="h-3 w-3 mr-1" />
                    2da Entrevista
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Enviar a segunda entrevista</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onReject(lead)}
                    className="h-7 w-7 p-0 border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                  >
                    <XCircle className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Rechazar candidato</p>
                </TooltipContent>
              </Tooltip>
            </div>
          )}

          {/* Si no hay llamada exitosa, mostrar acciones de contacto */}
          {!hasSuccessfulCall && (
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    onClick={() => onLogCall(lead)}
                    className="h-7 px-3 bg-primary hover:bg-primary/90 text-xs"
                  >
                    <Phone className="h-3 w-3 mr-1" />
                    Llamar
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Registrar llamada manual</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onVapiCall(lead)}
                    className="h-7 w-7 p-0 border-blue-200 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
                  >
                    <Bot className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Llamada automática con IA</p>
                </TooltipContent>
              </Tooltip>
            </div>
          )}

          {/* Menú de acciones adicionales - siempre visible */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-muted text-muted-foreground hover:text-foreground">
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => onEditLead(lead)} className="text-xs">
                <Edit className="h-3 w-3 mr-2" />
                Editar
              </DropdownMenuItem>
              
              {callLogs.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onViewCallHistory(lead)} className="text-xs">
                    <Bot className="h-3 w-3 mr-2" />
                    Historial llamadas
                  </DropdownMenuItem>
                </>
              )}
              
              {onMoveToPool && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onMoveToPool(lead)} className="text-xs">
                    <Archive className="h-3 w-3 mr-2" />
                    Mover al Pool
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
};