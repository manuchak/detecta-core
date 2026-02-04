import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Building2, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  CreditCard,
  TrendingUp,
  Clock
} from 'lucide-react';
import { useClientesCreditoResumen } from '../../hooks/useClienteCredito';
import { useClientesFiscales } from '../../hooks/useClientesFiscales';
import { formatCurrency } from '@/utils/formatUtils';

interface CreditoSummaryCardsProps {
  onFilterChange?: (filter: string) => void;
  activeFilter?: string;
}

export function CreditoSummaryCards({ onFilterChange, activeFilter }: CreditoSummaryCardsProps) {
  const { data: clientes = [], isLoading: loadingClientes } = useClientesFiscales();
  const { data: creditoResumen = [], isLoading: loadingCredito } = useClientesCreditoResumen();

  const isLoading = loadingClientes || loadingCredito;

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    );
  }

  // Calculate stats
  const total = clientes.length;
  const completos = clientes.filter(c => 
    c.rfc && c.razon_social && c.regimen_fiscal && c.codigo_postal_fiscal
  ).length;
  const parciales = clientes.filter(c => 
    (c.rfc || c.razon_social) && !(c.rfc && c.razon_social && c.regimen_fiscal && c.codigo_postal_fiscal)
  ).length;
  const sinDatos = total - completos - parciales;

  // Credit stats
  const sobreLimite = creditoResumen.filter(c => c.sobre_limite).length;
  const conVencido = creditoResumen.filter(c => c.vencido).length;
  const creditoTotal = creditoResumen.reduce((sum, c) => sum + c.saldo_actual, 0);

  const cards = [
    {
      id: 'todos',
      label: 'Total Clientes',
      value: total,
      icon: Building2,
      color: 'text-primary',
      bgColor: 'bg-primary/5',
    },
    {
      id: 'completos',
      label: 'Datos Completos',
      value: completos,
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-500/10',
    },
    {
      id: 'incompletos',
      label: 'Incompletos',
      value: parciales,
      icon: AlertTriangle,
      color: 'text-amber-600',
      bgColor: 'bg-amber-500/10',
    },
    {
      id: 'sin-datos',
      label: 'Sin Datos',
      value: sinDatos,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-500/10',
    },
    {
      id: 'sobre-limite',
      label: 'Sobre Límite',
      value: sobreLimite,
      icon: CreditCard,
      color: sobreLimite > 0 ? 'text-red-600' : 'text-muted-foreground',
      bgColor: sobreLimite > 0 ? 'bg-red-500/10' : 'bg-muted/50',
    },
    {
      id: 'con-vencido',
      label: 'Con Vencido',
      value: conVencido,
      icon: Clock,
      color: conVencido > 0 ? 'text-amber-600' : 'text-muted-foreground',
      bgColor: conVencido > 0 ? 'bg-amber-500/10' : 'bg-muted/50',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((card) => {
        const Icon = card.icon;
        const isActive = activeFilter === card.id;
        
        return (
          <Card 
            key={card.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              isActive ? 'ring-2 ring-primary ring-offset-2' : ''
            } ${card.bgColor}`}
            onClick={() => onFilterChange?.(isActive ? 'todos' : card.id)}
          >
            <CardContent className="py-3 px-4">
              <div className="flex items-center gap-2">
                <Icon className={`h-4 w-4 ${card.color}`} />
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground truncate">{card.label}</p>
                  <p className={`text-lg font-bold ${card.color}`}>{card.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
