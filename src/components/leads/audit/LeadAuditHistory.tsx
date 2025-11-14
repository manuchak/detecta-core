import { useEffect } from "react";
import { useLeadAudit } from "@/hooks/useLeadAudit";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History, User, Calendar } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface LeadAuditHistoryProps {
  leadId: string;
}

const actionTypeLabels: Record<string, string> = {
  lead_created: "Lead creado",
  status_change: "Cambio de estado",
  zone_assigned: "Zona asignada",
  contacted: "Contactado",
  call_logged: "Llamada registrada",
  interview_scheduled: "Entrevista programada",
  interview_completed: "Entrevista completada",
  approved: "Aprobado",
  rejected: "Rechazado",
  notes_updated: "Notas actualizadas"
};

const getActionBadgeVariant = (actionType: string): "default" | "secondary" | "destructive" | "outline" => {
  if (actionType === "approved") return "default";
  if (actionType === "rejected") return "destructive";
  if (actionType === "lead_created") return "secondary";
  return "outline";
};

export const LeadAuditHistory = ({ leadId }: LeadAuditHistoryProps) => {
  const { auditLogs, loading, fetchAuditLogs } = useLeadAudit();

  useEffect(() => {
    if (leadId) {
      fetchAuditLogs(leadId);
    }
  }, [leadId, fetchAuditLogs]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="h-4 w-4" />
          Historial de Auditoría
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-16 bg-muted rounded-lg" />
                </div>
              ))}
            </div>
          ) : auditLogs.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No hay registros de auditoría
            </p>
          ) : (
            <div className="space-y-3">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant={getActionBadgeVariant(log.action_type)}>
                      {actionTypeLabels[log.action_type] || log.action_type}
                    </Badge>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(log.created_at), "PPp", { locale: es })}
                    </div>
                  </div>

                  {log.field_name && (
                    <div className="space-y-1 text-sm mt-2">
                      <p className="font-medium text-muted-foreground">Campo: {log.field_name}</p>
                      {log.old_value && (
                        <p className="text-muted-foreground">
                          <span className="font-medium">Anterior:</span> {log.old_value}
                        </p>
                      )}
                      {log.new_value && (
                        <p className="text-foreground">
                          <span className="font-medium">Nuevo:</span> {log.new_value}
                        </p>
                      )}
                    </div>
                  )}

                  {log.additional_data && Object.keys(log.additional_data).length > 0 && (
                    <div className="mt-2 p-2 bg-muted rounded text-xs">
                      <pre className="whitespace-pre-wrap">
                        {JSON.stringify(log.additional_data, null, 2)}
                      </pre>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span>
                      {log.performed_by_name || 'Sistema'}
                      {log.performed_by_role && (
                        <span className="ml-1">({log.performed_by_role})</span>
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
