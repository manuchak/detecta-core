import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Banknote, 
  StickyNote, 
  RefreshCw,
  Construction
} from 'lucide-react';

export function PendingSubsystemsCard() {
  const pendingSystems = [
    {
      icon: Banknote,
      name: 'Adelantos de Dinero',
      description: 'Sistema para solicitar y rastrear adelantos de pago',
      tables: ['adelantos_custodio'],
      features: ['Solicitudes', 'Aprobaciones', 'Descuentos automáticos']
    },
    {
      icon: StickyNote,
      name: 'Notas Internas',
      description: 'Registro de notas, advertencias y reconocimientos',
      tables: ['notas_personal'],
      features: ['Notas generales', 'Advertencias', 'Reconocimientos']
    },
    {
      icon: RefreshCw,
      name: 'Historial de Estados',
      description: 'Seguimiento de cambios de estado del custodio',
      tables: ['personal_estado_historial'],
      features: ['Transiciones', 'Motivos', 'Auditoría']
    }
  ];

  return (
    <Card className="border-dashed border-amber-300 bg-amber-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Construction className="h-5 w-5 text-amber-600" />
          Subsistemas Pendientes
          <Badge variant="secondary" className="ml-2">En desarrollo</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {pendingSystems.map((system, index) => {
            const Icon = system.icon;
            return (
              <div 
                key={index}
                className="p-4 rounded-lg bg-background border border-dashed"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <h4 className="font-medium text-sm">{system.name}</h4>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  {system.description}
                </p>
                <div className="flex flex-wrap gap-1">
                  {system.features.map((feature, i) => (
                    <Badge key={i} variant="outline" className="text-[10px]">
                      {feature}
                    </Badge>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground mt-2 font-mono">
                  Tabla: {system.tables.join(', ')}
                </p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
