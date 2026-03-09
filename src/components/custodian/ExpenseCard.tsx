import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { DollarSign, Clock, CheckCircle, XCircle, CreditCard, Image } from 'lucide-react';
import { TIPOS_APOYO_CUSTODIO, type SolicitudApoyo } from '@/hooks/useCustodianExpenses';

const estadoConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof Clock }> = {
  pendiente: { label: 'Pendiente', variant: 'secondary', icon: Clock },
  aprobado: { label: 'Aprobado', variant: 'default', icon: CheckCircle },
  rechazado: { label: 'Rechazado', variant: 'destructive', icon: XCircle },
  pagado: { label: 'Pagado', variant: 'outline', icon: CreditCard },
  cancelado: { label: 'Cancelado', variant: 'destructive', icon: XCircle },
};

interface ExpenseCardProps {
  expense: SolicitudApoyo;
}

const ExpenseCard = ({ expense }: ExpenseCardProps) => {
  const config = estadoConfig[expense.estado || 'pendiente'] || estadoConfig.pendiente;
  const StatusIcon = config.icon;
  const tipoLabel = TIPOS_APOYO_CUSTODIO.find(t => t.value === expense.tipo_apoyo)?.label || expense.tipo_apoyo;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-sm truncate">{tipoLabel}</span>
              <Badge variant={config.variant} className="text-[10px] px-1.5 py-0 shrink-0">
                <StatusIcon className="w-3 h-3 mr-1" />
                {config.label}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{expense.motivo}</p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                ${expense.monto_solicitado.toLocaleString('es-MX')}
              </span>
              {expense.monto_aprobado != null && (
                <span className="text-primary font-medium">
                  Aprobado: ${expense.monto_aprobado.toLocaleString('es-MX')}
                </span>
              )}
              {expense.created_at && (
                <span>{format(new Date(expense.created_at), 'dd MMM', { locale: es })}</span>
              )}
            </div>
            {expense.motivo_rechazo && (
              <p className="text-xs text-destructive mt-1">Motivo: {expense.motivo_rechazo}</p>
            )}
          </div>
          {expense.comprobante_url && (
            <a href={expense.comprobante_url} target="_blank" rel="noopener noreferrer"
              className="shrink-0 w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
              <img src={expense.comprobante_url} alt="Comprobante" className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ExpenseCard;
