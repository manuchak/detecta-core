
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Phone, 
  Bot, 
  Edit, 
  Play, 
  CheckCircle, 
  XCircle, 
  Mail, 
  ArrowRight,
  Calendar,
  MoreHorizontal,
  AlertTriangle,
  Brain,
  Rocket
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
import { AssignedLead, LeadEstado } from "@/types/leadTypes";
import { VapiCallLog } from "@/types/vapiTypes";
import { validateLeadForApproval } from "@/utils/leadValidation";
import { useSIERCPInvitations } from "@/hooks/useSIERCPInvitations";
import { SIERCPStatusBadge } from "@/components/recruitment/siercp/SIERCPStatusBadge";
import { SendSIERCPDialog } from "./SendSIERCPDialog";

interface LeadCardProps {
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
  onSendSIERCP?: (lead: AssignedLead) => void;
  onIniciarLiberacion?: (lead: AssignedLead) => void;
  onRetryVinculacion?: (lead: AssignedLead) => void;
}

export const LeadCard = ({
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
  onSendSIERCP,
  onIniciarLiberacion,
  onRetryVinculacion
}: LeadCardProps) => {
  const [showSIERCPDialog, setShowSIERCPDialog] = useState(false);
  const validation = validateLeadForApproval(lead);
  const hasMissingInfo = !validation.isValid;

  // SIERCP invitation state
  const { activeInvitation, isLoading: siercpLoading } = useSIERCPInvitations(
    lead.final_decision === 'approved' ? lead.lead_id : undefined
  );
  const siercpStatus = activeInvitation?.status;
  const siercpCompleted = siercpStatus === 'completed';
  const siercpInProgress = siercpStatus && !siercpCompleted && siercpStatus !== 'cancelled' && siercpStatus !== 'expired';

  const getStatusBadge = (stage: string, decision: string | null) => {
    if (decision === 'approved') {
      return <Badge className="bg-green-100 text-green-800 border-green-200">Aprobado</Badge>;
    }
    if (decision === 'rejected') {
      return <Badge className="bg-red-100 text-red-800 border-red-200">Rechazado</Badge>;
    }
    
    switch (stage) {
      case 'phone_interview':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Entrevista Telefónica</Badge>;
      case 'second_interview':
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Segunda Entrevista</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Pendiente</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
    <Card className={`border-l-4 ${hasMissingInfo ? 'border-l-orange-500' : 'border-l-blue-500'} hover:shadow-md transition-shadow`}>
      <CardContent className="p-4 sm:p-6">
        {/* Info section */}
        <div className="flex items-start gap-3 sm:gap-4">
          <div className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br ${hasMissingInfo ? 'from-orange-500 to-orange-600' : 'from-blue-500 to-blue-600'} rounded-full flex items-center justify-center text-white font-semibold shrink-0`}>
            {lead.lead_nombre.charAt(0).toUpperCase()}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="font-semibold text-base sm:text-lg">{lead.lead_nombre}</h3>
              {getStatusBadge(lead.current_stage, lead.final_decision)}
              {hasMissingInfo && (
                <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Info incompleta
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
              <div className="flex items-center gap-1">
                <Mail className="h-4 w-4 shrink-0" />
                <span className="truncate max-w-[180px]">{lead.lead_email || 'Sin email'}</span>
              </div>
              {lead.lead_telefono && (
                <a href={`tel:${lead.lead_telefono}`} className="flex items-center gap-1 hover:text-foreground">
                  <Phone className="h-4 w-4 shrink-0" />
                  {lead.lead_telefono}
                </a>
              )}
            </div>
            
            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(lead.lead_fecha_creacion)}
              </div>
              <div className="flex items-center gap-1">
                <Play className="h-3 w-3" />
                {callLogs.length} llamadas
              </div>
            </div>
          </div>

          {/* Dropdown - always visible */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 w-9 p-0 shrink-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => onEditLead(lead)}>
                <Edit className="h-4 w-4 mr-2" />
                Editar candidato
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onManualInterview(lead)}>
                <Phone className="h-4 w-4 mr-2" />
                Entrevista manual
              </DropdownMenuItem>
              {callLogs.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onViewCallHistory(lead)}>
                    <Play className="h-4 w-4 mr-2" />
                    Ver historial de llamadas
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Actions - stacked on mobile */}
        <div className="flex flex-wrap items-center gap-2 mt-3 sm:mt-4 sm:pl-[52px]">
          {hasMissingInfo && (
            <Button
              size="sm"
              onClick={() => onCompleteMissingInfo(lead)}
              className="h-10 sm:h-9 px-4 bg-orange-600 hover:bg-orange-700 text-white w-full sm:w-auto"
            >
              <AlertTriangle className="h-4 w-4 mr-1" />
              Completar Info
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={() => onVapiCall(lead)}
            className="h-10 sm:h-9 w-10 sm:w-9 p-0 bg-blue-50 hover:bg-blue-100 border-blue-200"
          >
            <Bot className="h-4 w-4 text-blue-600" />
          </Button>

          {!lead.final_decision && (
            <>
              <Button
                size="sm"
                onClick={() => onApproveLead(lead)}
                disabled={hasMissingInfo}
                className="h-10 sm:h-9 px-4 bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 flex-1 sm:flex-none"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Aprobar
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onSendToSecondInterview(lead)}
                disabled={hasMissingInfo}
                className="h-10 sm:h-9 px-4 border-purple-200 text-purple-700 hover:bg-purple-50 disabled:opacity-50 flex-1 sm:flex-none"
              >
                <ArrowRight className="h-4 w-4 mr-1" />
                2da Entrevista
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onReject(lead)}
                className="h-10 sm:h-9 w-10 sm:w-9 p-0"
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </>
          )}

          {lead.final_decision === 'approved' && (
            <>
              {siercpInProgress && activeInvitation && (
                <SIERCPStatusBadge status={activeInvitation.status} />
              )}
              {!activeInvitation && !siercpLoading && (
                <Button
                  size="sm"
                  onClick={() => setShowSIERCPDialog(true)}
                  className="h-10 sm:h-9 px-4 bg-chart-3 hover:bg-chart-3/90 text-white w-full sm:w-auto"
                >
                  <Brain className="h-4 w-4 mr-1" />
                  Enviar SIERCP
                </Button>
              )}
              {siercpInProgress && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowSIERCPDialog(true)}
                  className="h-10 sm:h-9 px-4 border-chart-3/30 text-chart-3 hover:bg-chart-3/5 w-full sm:w-auto"
                >
                  Ver SIERCP
                </Button>
              )}
              {siercpCompleted && onIniciarLiberacion && (
                lead.candidato_custodio_id ? (
                  <Button
                    size="sm"
                    onClick={() => onIniciarLiberacion(lead)}
                    className="h-10 sm:h-9 px-4 w-full sm:w-auto"
                  >
                    <Rocket className="h-4 w-4 mr-1" />
                    Liberar
                  </Button>
                ) : onRetryVinculacion && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onRetryVinculacion(lead)}
                    className="h-10 sm:h-9 px-4 border-warning/30 text-warning hover:bg-warning/5 w-full sm:w-auto"
                  >
                    Re-vincular
                  </Button>
                )
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>

    {/* SIERCP Dialog */}
    <SendSIERCPDialog
      open={showSIERCPDialog}
      onOpenChange={setShowSIERCPDialog}
      lead={lead}
    />
    </>
  );
};
