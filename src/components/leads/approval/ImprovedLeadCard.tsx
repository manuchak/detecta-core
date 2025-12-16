import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Phone, Bot, Edit, CheckCircle, XCircle, Mail, ArrowRight,
  Calendar, User, AlertTriangle, MoreHorizontal, PhoneCall, Archive, Rocket
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
}

export const ImprovedLeadCard = ({
  lead, callLogs, onVapiCall, onManualInterview, onEditLead, onViewCallHistory,
  onApproveLead, onSendToSecondInterview, onReject, onCompleteMissingInfo,
  onLogCall, onMoveToPool, onIniciarLiberacion
}: ImprovedLeadCardProps) => {
  const validation = validateLeadForApproval(lead);
  const hasMissingInfo = !validation.isValid;
  const hasSuccessfulCall = lead.has_successful_call || false;
  const isApprovedButUnlinked = lead.final_decision === 'approved' && !lead.candidato_custodio_id;

  const getStatusBadge = (stage: string, decision: string | null) => {
    if (decision === 'approved') {
      if (isApprovedButUnlinked) {
        return (
          <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Aprobado (sin vincular)
          </Badge>
        );
      }
      return <Badge className="bg-emerald-500 hover:bg-emerald-600">Aprobado</Badge>;
    }
    if (decision === 'rejected') return <Badge variant="destructive">Rechazado</Badge>;
    if (stage === 'phone_interview') return <Badge variant="secondary">Entrevista Telefónica</Badge>;
    if (stage === 'second_interview') return <Badge className="bg-purple-500">Segunda Entrevista</Badge>;
    return <Badge variant="outline">Pendiente</Badge>;
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
  const getInitials = (name: string) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '??';

  return (
    <Card className="group hover:shadow-lg hover:scale-[1.01] transition-all duration-200 border-0 shadow-sm bg-gradient-to-br from-background to-muted/5">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Avatar className="h-10 w-10 shadow-sm shrink-0">
              <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-medium text-sm">
                {getInitials(lead.lead_nombre)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-base leading-tight truncate">{lead.lead_nombre}</h3>
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                {getStatusBadge(lead.current_stage, lead.final_decision)}
                {hasMissingInfo && (
                  <Badge variant="outline" className="text-xs px-1.5 py-0.5 text-amber-800 border-amber-300 bg-amber-100 font-medium">
                    <AlertTriangle className="h-2.5 w-2.5 mr-1" />
                    Incompleta
                  </Badge>
                )}
              </div>
            </div>
          </div>
          {lead.analista_nombre && (
            <Badge variant="outline" className="text-xs px-2 py-1 bg-blue-100 text-blue-800 border-blue-300 font-medium shrink-0">
              <User className="h-3 w-3 mr-1" />
              {lead.analista_nombre}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {/* TELÉFONO PROMINENTE */}
        {lead.lead_telefono && (
          <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
            <Phone className="h-5 w-5 text-primary shrink-0" />
            <a href={`tel:${lead.lead_telefono}`} className="font-mono text-lg font-semibold text-primary hover:underline">
              {lead.lead_telefono}
            </a>
            {hasSuccessfulCall ? (
              <Badge className="ml-auto bg-emerald-500 text-white"><CheckCircle className="h-3 w-3 mr-1" />Contactado</Badge>
            ) : (
              <Badge variant="outline" className="ml-auto border-amber-300 text-amber-700 bg-amber-50"><PhoneCall className="h-3 w-3 mr-1" />Sin contactar</Badge>
            )}
          </div>
        )}

        {lead.lead_email && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{lead.lead_email}</span>
          </div>
        )}

        <div className="flex items-center gap-1.5 flex-wrap">
          {lead.last_contact_outcome && (
            <Badge variant={['voicemail', 'no_answer', 'busy', 'wrong_number'].includes(lead.last_contact_outcome) ? "destructive" : "secondary"} className="text-xs">
              {lead.last_contact_outcome}
            </Badge>
          )}
          {(lead.contact_attempts_count && lead.contact_attempts_count > 0) && (
            <Badge variant="outline" className={cn("text-xs font-medium", lead.contact_attempts_count >= 3 ? "text-red-800 border-red-300 bg-red-100" : "text-muted-foreground")}>
              <PhoneCall className="h-2.5 w-2.5 mr-1" />{lead.contact_attempts_count} intentos
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground/70 pt-2 border-t border-border/50">
          <Calendar className="h-3 w-3" />{formatDate(lead.lead_fecha_creacion)}
          <span>•</span>
          <Bot className="h-3 w-3" />{callLogs.length} llamadas
        </div>

        {/* ACCIONES */}
        <div className="flex items-center justify-between pt-2">
          {!hasSuccessfulCall && (
            <div className="flex items-center gap-2">
              <Button size="default" onClick={() => onLogCall(lead)} className="h-10 px-5 bg-primary hover:bg-primary/90 font-medium">
                <Phone className="h-4 w-4 mr-2" />Llamar
              </Button>
              <Tooltip><TooltipTrigger asChild>
                <Button size="sm" variant="outline" onClick={() => onVapiCall(lead)} className="h-10 w-10 p-0 border-blue-200 text-blue-600 hover:bg-blue-50">
                  <Bot className="h-4 w-4" />
                </Button>
              </TooltipTrigger><TooltipContent>Llamada IA</TooltipContent></Tooltip>
            </div>
          )}

          {hasSuccessfulCall && hasMissingInfo && (
            <Button size="sm" onClick={() => onCompleteMissingInfo(lead)} className="h-9 px-4 bg-amber-500 hover:bg-amber-600 text-white">
              <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />Completar Info
            </Button>
          )}

          {!lead.final_decision && hasSuccessfulCall && !hasMissingInfo && (
            <div className="flex items-center gap-1.5">
              <Button size="sm" onClick={() => onApproveLead(lead)} className="h-9 px-4 bg-emerald-500 hover:bg-emerald-600 text-white">
                <CheckCircle className="h-3.5 w-3.5 mr-1.5" />Aprobar
              </Button>
              <Button size="sm" variant="outline" onClick={() => onSendToSecondInterview(lead)} className="h-9 px-3 border-purple-200 text-purple-700 hover:bg-purple-50">
                <ArrowRight className="h-3.5 w-3.5 mr-1" />2da
              </Button>
              <Button size="sm" variant="outline" onClick={() => onReject(lead)} className="h-9 w-9 p-0 border-red-200 text-red-600 hover:bg-red-50">
                <XCircle className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}

          {lead.final_decision === 'approved' && onIniciarLiberacion && (
            <Button size="default" onClick={() => onIniciarLiberacion(lead)} className="h-10 px-5 bg-amber-500 hover:bg-amber-600 text-white font-medium">
              <Rocket className="h-4 w-4 mr-2" />Liberar Custodio
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-9 w-9 p-0 hover:bg-muted text-muted-foreground">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => onEditLead(lead)}><Edit className="h-3.5 w-3.5 mr-2" />Editar</DropdownMenuItem>
              {callLogs.length > 0 && (<><DropdownMenuSeparator /><DropdownMenuItem onClick={() => onViewCallHistory(lead)}><Bot className="h-3.5 w-3.5 mr-2" />Historial</DropdownMenuItem></>)}
              {onMoveToPool && (<><DropdownMenuSeparator /><DropdownMenuItem onClick={() => onMoveToPool(lead)}><Archive className="h-3.5 w-3.5 mr-2" />Pool</DropdownMenuItem></>)}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
};
