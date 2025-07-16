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
  PhoneCall
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
  onLogCall
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
    <Card className="hover:shadow-lg transition-all duration-200 border-0 shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                {getInitials(lead.lead_nombre)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-lg leading-none mb-1">{lead.lead_nombre}</h3>
              <div className="flex items-center gap-2">
                {getStatusBadge(lead.approval_stage, lead.final_decision)}
                {hasMissingInfo && (
                  <Badge variant="outline" className="text-amber-700 border-amber-200 bg-amber-50">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Incompleta
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Analista asignado */}
          {lead.analyst_name && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-2 rounded-lg">
              <User className="h-4 w-4" />
              <div className="text-right">
                <div className="font-medium text-foreground">{lead.analyst_name}</div>
                <div className="text-xs">Trabajando en esto</div>
              </div>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Información de contacto */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">{lead.lead_email || 'Sin email'}</span>
          </div>
          {lead.lead_telefono && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{lead.lead_telefono}</span>
            </div>
          )}
        </div>

        {/* Metadatos */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4 pb-4 border-b">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDate(lead.lead_fecha_creacion)}
          </div>
          <div className="flex items-center gap-1">
            <Bot className="h-3 w-3" />
            {callLogs.length} llamadas
          </div>
        </div>

        {/* Acciones principales */}
        <div className="flex items-center gap-2">
          {/* Acción prioritaria: Llamar (si no ha habido llamada exitosa) */}
          {!hasSuccessfulCall && (
            <Button
              size="sm"
              onClick={() => onLogCall(lead)}
              className="bg-blue-500 hover:bg-blue-600 flex-1"
            >
              <PhoneCall className="h-4 w-4 mr-2" />
              Llamar
            </Button>
          )}

          {/* Acción para completar información (solo si hay llamada exitosa) */}
          {hasSuccessfulCall && hasMissingInfo && (
            <Button
              size="sm"
              onClick={() => onCompleteMissingInfo(lead)}
              className="bg-amber-500 hover:bg-amber-600 flex-1"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Completar Info
            </Button>
          )}

          {/* Acciones cuando la información está completa o no es pendiente */}
          {!lead.final_decision && hasSuccessfulCall && (
            <div className="flex items-center gap-2 flex-1">
              <Button
                size="sm"
                onClick={() => onApproveLead(lead)}
                disabled={hasMissingInfo || !hasSuccessfulCall}
                className="bg-emerald-500 hover:bg-emerald-600 flex-1"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Aprobar
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => onSendToSecondInterview(lead)}
                disabled={hasMissingInfo || !hasSuccessfulCall}
                className="border-purple-200 text-purple-700 hover:bg-purple-50 flex-1"
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                2da Entrevista
              </Button>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onReject(lead)}
                    className="border-red-200 text-red-700 hover:bg-red-50"
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Rechazar candidato</p>
                </TooltipContent>
              </Tooltip>
            </div>
          )}

          {/* Acciones secundarias */}
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onVapiCall(lead)}
                  className="border-blue-200 text-blue-700 hover:bg-blue-50"
                >
                  <Bot className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Llamada automática con VAPI</p>
              </TooltipContent>
            </Tooltip>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 w-9 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => onEditLead(lead)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar candidato
                </DropdownMenuItem>
                
                <DropdownMenuItem onClick={() => onManualInterview(lead)}>
                  <Phone className="h-4 w-4 mr-2" />
                  Entrevista manual
                </DropdownMenuItem>
                
                {callLogs.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onViewCallHistory(lead)}>
                      <Bot className="h-4 w-4 mr-2" />
                      Historial de llamadas
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};