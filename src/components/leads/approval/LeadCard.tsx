
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
  AlertTriangle
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
  onCompleteMissingInfo
}: LeadCardProps) => {
  const validation = validateLeadForApproval(lead);
  const hasMissingInfo = !validation.isValid;

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
    <Card className={`border-l-4 ${hasMissingInfo ? 'border-l-orange-500' : 'border-l-blue-500'} hover:shadow-md transition-shadow`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          {/* Información del candidato */}
          <div className="flex items-center gap-4 flex-1">
            <div className={`w-12 h-12 bg-gradient-to-br ${hasMissingInfo ? 'from-orange-500 to-orange-600' : 'from-blue-500 to-blue-600'} rounded-full flex items-center justify-center text-white font-semibold`}>
              {lead.lead_nombre.charAt(0).toUpperCase()}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-semibold text-lg">{lead.lead_nombre}</h3>
                {getStatusBadge(lead.current_stage, lead.final_decision)}
                {hasMissingInfo && (
                  <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Info incompleta
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                <div className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  {lead.lead_email || 'Sin email'}
                </div>
                {lead.lead_telefono && (
                  <div className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    {lead.lead_telefono}
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-4 text-xs text-gray-500">
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
          </div>

          {/* Acciones con iconos y tooltips */}
          <div className="flex items-center gap-2">
            {/* Completar información faltante - Acción prioritaria si falta info */}
            {hasMissingInfo && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    onClick={() => onCompleteMissingInfo(lead)}
                    className="h-9 px-4 bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    Completar Info
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Completar información faltante</p>
                </TooltipContent>
              </Tooltip>
            )}

            {/* Llamada VAPI - Acción principal */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onVapiCall(lead)}
                  className="h-9 w-9 p-0 bg-blue-50 hover:bg-blue-100 border-blue-200"
                >
                  <Bot className="h-4 w-4 text-blue-600" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Llamada automática con VAPI</p>
              </TooltipContent>
            </Tooltip>

            {/* Acciones de aprobación - Solo para pendientes */}
            {!lead.final_decision && (
              <>
                {/* Aprobar directamente */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      onClick={() => onApproveLead(lead)}
                      disabled={hasMissingInfo}
                      className="h-9 px-4 bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Aprobar
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{hasMissingInfo ? 'Complete la información para aprobar' : 'Aprobar candidato directamente'}</p>
                  </TooltipContent>
                </Tooltip>

                {/* Enviar a segunda entrevista */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onSendToSecondInterview(lead)}
                      disabled={hasMissingInfo}
                      className="h-9 px-4 border-purple-200 text-purple-700 hover:bg-purple-50 disabled:opacity-50"
                    >
                      <ArrowRight className="h-4 w-4 mr-1" />
                      2da Entrevista
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{hasMissingInfo ? 'Complete la información para enviar a segunda entrevista' : 'Enviar a segunda entrevista'}</p>
                  </TooltipContent>
                </Tooltip>

                {/* Rechazar */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onReject(lead)}
                      className="h-9 w-9 p-0"
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Rechazar candidato</p>
                  </TooltipContent>
                </Tooltip>
              </>
            )}

            {/* Menú de acciones adicionales */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 w-9 p-0">
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
        </div>
      </CardContent>
    </Card>
  );
};
