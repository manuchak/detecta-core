import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { History, User, Shield, Edit, RefreshCw, Trash2, Clock, X } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ServiceHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceId: string | null;
  serviceName?: string;
}

interface ServiceLogEntry {
  id: string;
  action_type: string;
  previous_value: string | null;
  new_value: string | null;
  reason: string | null;
  timestamp: string;
  modified_by: string | null;
  user_profile?: {
    display_name: string;
    email: string;
  };
}

export function ServiceHistoryModal({
  open,
  onOpenChange,
  serviceId,
  serviceName
}: ServiceHistoryModalProps) {
  
  // Fetch service modification history
  const { data: historyLogs, isLoading, error, refetch } = useQuery({
    queryKey: ['service-history', serviceId],
    queryFn: async () => {
      if (!serviceId) return [];
      
      const { data, error } = await supabase
        .from('service_modification_log')
        .select(`
          id,
          action_type,
          previous_value,
          new_value,
          reason,
          timestamp,
          modified_by
        `)
        .eq('service_id', serviceId)
        .order('timestamp', { ascending: false });
      
      if (error) throw error;
      
      return data?.map(log => ({
        ...log,
        user_profile: {
          display_name: 'Usuario',
          email: ''
        }
      })) || [];
    },
    enabled: open && !!serviceId
  });

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'assign_custodian':
      case 'reassign_custodian':
        return <User className="h-4 w-4 text-blue-600" />;
      case 'assign_armed_guard':
      case 'reassign_armed_guard':
        return <Shield className="h-4 w-4 text-emerald-600" />;
      case 'remove_custodian':
      case 'remove_armed_guard':
        return <Trash2 className="h-4 w-4 text-red-600" />;
      case 'update_configuration':
        return <Edit className="h-4 w-4 text-amber-600" />;
      default:
        return <RefreshCw className="h-4 w-4 text-slate-600" />;
    }
  };

  const getActionLabel = (actionType: string) => {
    const labels: Record<string, string> = {
      'assign_custodian': 'Asignación de Custodio',
      'reassign_custodian': 'Reasignación de Custodio',
      'remove_custodian': 'Remoción de Custodio',
      'assign_armed_guard': 'Asignación de Armado',
      'reassign_armed_guard': 'Reasignación de Armado',
      'remove_armed_guard': 'Remoción de Armado',
      'update_configuration': 'Actualización de Configuración',
      'create_service': 'Creación de Servicio',
      'update_service': 'Actualización de Servicio'
    };
    return labels[actionType] || actionType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getActionColor = (actionType: string) => {
    if (actionType.includes('assign') && !actionType.includes('reassign')) {
      return 'bg-blue-100 text-blue-700 border-blue-200';
    }
    if (actionType.includes('reassign')) {
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    }
    if (actionType.includes('remove')) {
      return 'bg-red-100 text-red-700 border-red-200';
    }
    if (actionType.includes('update')) {
      return 'bg-amber-100 text-amber-700 border-amber-200';
    }
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  const formatValue = (value: string | null) => {
    if (!value) return 'N/A';
    try {
      const parsed = JSON.parse(value);
      if (typeof parsed === 'object') {
        return JSON.stringify(parsed, null, 2);
      }
      return parsed.toString();
    } catch {
      return value;
    }
  };

  if (!serviceId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Historial de Cambios
            {serviceName && <span className="text-slate-600">- {serviceName}</span>}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Header Actions */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-600">
              Mostrando todos los cambios realizados en este servicio
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
              <span className="ml-2 text-slate-600">Cargando historial...</span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <X className="h-4 w-4 text-red-600" />
                <span className="text-red-800">Error al cargar el historial</span>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && (!historyLogs || historyLogs.length === 0) && (
            <div className="text-center py-8">
              <History className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                Sin historial de cambios
              </h3>
              <p className="text-slate-600">
                No se han registrado cambios para este servicio aún.
              </p>
            </div>
          )}

          {/* History Timeline */}
          {!isLoading && !error && historyLogs && historyLogs.length > 0 && (
            <div className="space-y-4">
              {historyLogs.map((log, index) => (
                <Card key={log.id} className="relative">
                  {/* Timeline connector */}
                  {index < historyLogs.length - 1 && (
                    <div className="absolute left-6 top-12 w-0.5 h-8 bg-slate-200"></div>
                  )}
                  
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Action Icon */}
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center">
                        {getActionIcon(log.action_type)}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            {/* Action Header */}
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className={getActionColor(log.action_type)}>
                                {getActionLabel(log.action_type)}
                              </Badge>
                              <div className="flex items-center gap-1 text-xs text-slate-500">
                                <Clock className="h-3 w-3" />
                                {format(new Date(log.timestamp), 'PPp', { locale: es })}
                              </div>
                            </div>
                            
                            {/* User Info */}
                            {log.user_profile && (
                              <div className="text-sm text-slate-600 mb-2">
                                Realizado por: <span className="font-medium">{log.user_profile.display_name}</span>
                                {log.user_profile.email && (
                                  <span className="text-slate-500"> ({log.user_profile.email})</span>
                                )}
                              </div>
                            )}
                            
                            {/* Changes */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              {log.previous_value && (
                                <div>
                                  <div className="text-caption font-medium text-slate-700">Valor Anterior:</div>
                                  <div className="bg-red-50 border border-red-200 rounded p-2 text-red-800 font-mono text-xs">
                                    {formatValue(log.previous_value)}
                                  </div>
                                </div>
                              )}
                              
                              {log.new_value && (
                                <div>
                                  <div className="text-caption font-medium text-slate-700">Nuevo Valor:</div>
                                  <div className="bg-emerald-50 border border-emerald-200 rounded p-2 text-emerald-800 font-mono text-xs">
                                    {formatValue(log.new_value)}
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            {/* Reason */}
                            {log.reason && (
                              <div className="mt-3">
                                <div className="text-caption font-medium text-slate-700 mb-1">Razón:</div>
                                <div className="bg-slate-50 border border-slate-200 rounded p-2 text-slate-700 text-sm">
                                  {log.reason}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}