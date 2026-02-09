import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Phone, Bot, Edit, CheckCircle, XCircle, Mail, ArrowRight,
  MoreHorizontal, PhoneCall, Archive, Rocket, AlertTriangle, Brain
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { AssignedLead } from "@/types/leadTypes";
import { VapiCallLog } from "@/types/vapiTypes";
import { validateLeadForApproval } from "@/utils/leadValidation";
import { cn } from "@/lib/utils";
import { SendSIERCPDialog } from "./SendSIERCPDialog";
import { LeadAgeBadge } from "./LeadAgeBadge";
import { getLeadAge, getPriorityBorderColor } from "@/utils/leadAgeUtils";
import { useSIERCPInvitations } from "@/hooks/useSIERCPInvitations";
import { SIERCPStatusBadge } from "@/components/recruitment/siercp/SIERCPStatusBadge";

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
  onIniciarLiberacion?: (lead: AssignedLead) => void;
  onRetryVinculacion?: (lead: AssignedLead) => void;
}

export const ImprovedLeadCard = ({
  lead, callLogs, onVapiCall, onManualInterview, onEditLead, onViewCallHistory,
  onApproveLead, onSendToSecondInterview, onReject, onCompleteMissingInfo,
  onLogCall, onMoveToPool, onIniciarLiberacion, onRetryVinculacion
}: ImprovedLeadCardProps) => {
  const [showSIERCPDialog, setShowSIERCPDialog] = useState(false);
  
  const validation = validateLeadForApproval(lead);
  const hasMissingInfo = !validation.isValid;
  const hasSuccessfulCall = lead.has_successful_call || false;
  const isApprovedButUnlinked = lead.final_decision === 'approved' && !lead.candidato_custodio_id;
  
  // SIERCP invitation state
  const { activeInvitation, isLoading: siercpLoading } = useSIERCPInvitations(
    lead.final_decision === 'approved' ? lead.lead_id : undefined
  );
  const siercpStatus = activeInvitation?.status;
  const siercpCompleted = siercpStatus === 'completed';
  const siercpInProgress = siercpStatus && !siercpCompleted && siercpStatus !== 'cancelled' && siercpStatus !== 'expired';
  const canApplySIERCP = lead.final_decision === 'approved' || lead.current_stage === 'second_interview';

  const getStatusBadge = (stage: string, decision: string | null) => {
    if (decision === 'approved') {
      if (isApprovedButUnlinked) {
        return <Badge variant="outline" className="text-warning border-warning/30 bg-warning/5">Sin vincular</Badge>;
      }
      return <Badge className="bg-success/10 text-success border-success/20">Aprobado</Badge>;
    }
    if (decision === 'rejected') return <Badge variant="outline" className="text-destructive border-destructive/30">Rechazado</Badge>;
    if (stage === 'second_interview') return <Badge variant="outline" className="text-chart-3 border-chart-3/30">2da Entrevista</Badge>;
    return null;
  };

  const getInitials = (name: string) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '??';
  const statusBadge = getStatusBadge(lead.current_stage, lead.final_decision);
  const leadAge = getLeadAge(lead.lead_fecha_creacion);
  const priorityBorder = getPriorityBorderColor(leadAge.urgency);

  return (
    <div className={cn("apple-card p-4 group border-l-[3px]", priorityBorder)}>
      {/* Header: Avatar + Info + Status */}
      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarFallback className="bg-muted text-muted-foreground font-medium text-sm">
            {getInitials(lead.lead_nombre)}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="font-medium text-sm truncate">{lead.lead_nombre}</h3>
            <LeadAgeBadge createdAt={lead.lead_fecha_creacion} />
            {statusBadge}
            {hasMissingInfo && (
              <Tooltip>
                <TooltipTrigger>
                  <AlertTriangle className="h-3.5 w-3.5 text-warning shrink-0" />
                </TooltipTrigger>
                <TooltipContent className="max-w-[280px]">
                  <div className="space-y-1">
                    <p className="font-medium text-warning text-xs">Faltan {validation.missingFields.length} campos:</p>
                    <ul className="text-xs space-y-0.5">
                      {validation.missingFields.slice(0, 5).map(f => <li key={f}>• {f}</li>)}
                      {validation.missingFields.length > 5 && (
                        <li className="text-muted-foreground">+ {validation.missingFields.length - 5} más</li>
                      )}
                    </ul>
                  </div>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          
          {/* Contact info - subtle */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {lead.lead_telefono && (
              <a 
                href={`tel:${lead.lead_telefono}`} 
                className="hover:text-foreground transition-colors font-mono"
              >
                {lead.lead_telefono}
              </a>
            )}
            {lead.lead_email && (
              <span className="flex items-center gap-1 truncate max-w-[140px]">
                <Mail className="h-3 w-3 shrink-0" />
                <span className="truncate">{lead.lead_email}</span>
              </span>
            )}
          </div>
          
          {/* Contact status - very subtle */}
          <div className="flex items-center gap-2 mt-1.5">
            {hasSuccessfulCall ? (
              <span className="text-xs text-success flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Contactado
              </span>
            ) : lead.contact_attempts_count && lead.contact_attempts_count > 0 ? (
              <span className={cn(
                "text-xs flex items-center gap-1",
                lead.contact_attempts_count >= 3 ? "text-destructive" : "text-muted-foreground"
              )}>
                <PhoneCall className="h-3 w-3" />
                {lead.contact_attempts_count} intentos
              </span>
            ) : null}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Primary CTA */}
          {!hasSuccessfulCall && (
            <Button 
              size="sm" 
              onClick={() => onLogCall(lead)} 
              className="h-8 px-3 text-xs"
            >
              <Phone className="h-3.5 w-3.5 mr-1.5" />
              Llamar
            </Button>
          )}

          {hasSuccessfulCall && hasMissingInfo && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onCompleteMissingInfo(lead)} 
              className="h-8 px-3 text-xs border-warning/30 text-warning hover:bg-warning/5"
            >
              Completar
            </Button>
          )}

          {!lead.final_decision && hasSuccessfulCall && !hasMissingInfo && (
            <>
              <Button 
                size="sm" 
                onClick={() => onApproveLead(lead)} 
                className="h-8 px-3 text-xs bg-success hover:bg-success/90"
              >
                <CheckCircle className="h-3.5 w-3.5 mr-1" />
                Aprobar
              </Button>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => onSendToSecondInterview(lead)} 
                    className="h-8 w-8 p-0"
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Segunda entrevista</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => onReject(lead)} 
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Rechazar</TooltipContent>
              </Tooltip>
            </>
          )}

          {lead.final_decision === 'approved' && (
            <>
              {/* SIERCP Status Badge */}
              {siercpInProgress && activeInvitation && (
                <SIERCPStatusBadge status={activeInvitation.status} />
              )}

              {/* No SIERCP yet → show "Enviar SIERCP" */}
              {!activeInvitation && !siercpLoading && (
                <Button 
                  size="sm" 
                  onClick={() => setShowSIERCPDialog(true)} 
                  className="h-8 px-3 text-xs bg-chart-3 hover:bg-chart-3/90"
                >
                  <Brain className="h-3.5 w-3.5 mr-1.5" />
                  Enviar SIERCP
                </Button>
              )}

              {/* SIERCP in progress → "Ver SIERCP" */}
              {siercpInProgress && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setShowSIERCPDialog(true)} 
                  className="h-8 px-3 text-xs border-chart-3/30 text-chart-3 hover:bg-chart-3/5"
                >
                  Ver SIERCP
                </Button>
              )}

              {/* SIERCP completed → show Liberar or Re-vincular */}
              {siercpCompleted && onIniciarLiberacion && (
                lead.candidato_custodio_id ? (
                  <Button 
                    size="sm" 
                    onClick={() => onIniciarLiberacion(lead)} 
                    className="h-8 px-3 text-xs"
                  >
                    <Rocket className="h-3.5 w-3.5 mr-1.5" />
                    Liberar
                  </Button>
                ) : onRetryVinculacion && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => onRetryVinculacion(lead)} 
                    className="h-8 px-3 text-xs border-warning/30 text-warning hover:bg-warning/5"
                  >
                    Re-vincular
                  </Button>
                )
              )}
            </>
          )}

          {/* More actions dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => onEditLead(lead)}>
                <Edit className="h-3.5 w-3.5 mr-2" />
                Editar
              </DropdownMenuItem>
              {!hasSuccessfulCall && (
                <DropdownMenuItem onClick={() => onVapiCall(lead)}>
                  <Bot className="h-3.5 w-3.5 mr-2" />
                  Llamada IA
                </DropdownMenuItem>
              )}
              {callLogs.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onViewCallHistory(lead)}>
                    <Bot className="h-3.5 w-3.5 mr-2" />
                    Historial ({callLogs.length})
                  </DropdownMenuItem>
                </>
              )}
              {onMoveToPool && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onMoveToPool(lead)}>
                    <Archive className="h-3.5 w-3.5 mr-2" />
                    Mover a Pool
                  </DropdownMenuItem>
                </>
              )}
              {canApplySIERCP && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowSIERCPDialog(true)}>
                    <Brain className="h-3.5 w-3.5 mr-2 text-chart-3" />
                    Aplicar SIERCP
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* SIERCP Dialog */}
      <SendSIERCPDialog
        open={showSIERCPDialog}
        onOpenChange={setShowSIERCPDialog}
        lead={lead}
      />
    </div>
  );
};
