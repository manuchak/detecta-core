import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import type { AlertaSistema } from '@/hooks/useNationalRecruitment';

interface AlertsPanelProps {
  alertas: AlertaSistema[];
  loading: boolean;
}

export const AlertsPanel: React.FC<AlertsPanelProps> = ({ alertas, loading }) => {
  const getAlertIcon = (tipo: string) => {
    switch (tipo) {
      case 'critica': return <AlertTriangle className="w-4 h-4 text-destructive" />;
      case 'preventiva': return <Clock className="w-4 h-4 text-warning" />;
      case 'estrategica': return <CheckCircle className="w-4 h-4 text-success" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getAlertBadge = (tipo: string) => {
    switch (tipo) {
      case 'critica': return <Badge variant="destructive">Crítica</Badge>;
      case 'preventiva': return <Badge variant="secondary">Preventiva</Badge>;
      case 'estrategica': return <Badge variant="default">Estratégica</Badge>;
      default: return <Badge variant="outline">Normal</Badge>;
    }
  };

  if (loading) {
    return <Card className="p-6"><div>Cargando alertas...</div></Card>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Sistema de Alertas Nacional</h2>
        <Badge variant="outline">{alertas.length} Alertas Activas</Badge>
      </div>

      <div className="grid gap-4">
        {alertas.map((alerta) => (
          <Card key={alerta.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                {getAlertIcon(alerta.tipo_alerta)}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">{alerta.titulo}</h3>
                    {getAlertBadge(alerta.tipo_alerta)}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{alerta.descripcion}</p>
                  {alerta.zona?.nombre && (
                    <Badge variant="outline" className="mb-2">
                      📍 {alerta.zona.nombre}
                    </Badge>
                  )}
                  {alerta.acciones_sugeridas && alerta.acciones_sugeridas.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Acciones sugeridas:</p>
                      <ul className="text-xs text-muted-foreground">
                        {alerta.acciones_sugeridas.map((accion, idx) => (
                          <li key={idx}>• {accion}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
              <Button size="sm" variant="outline">
                Resolver
              </Button>
            </div>
          </Card>
        ))}
        
        {alertas.length === 0 && (
          <Card className="p-8 text-center">
            <CheckCircle className="w-12 h-12 text-success mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Sin alertas activas</h3>
            <p className="text-muted-foreground">Todas las zonas están operando normalmente</p>
          </Card>
        )}
      </div>
    </div>
  );
};