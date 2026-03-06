import React from 'react';
import { CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ClienteFiscal } from '../../hooks/useClientesFiscales';

interface Props {
  clienteFiscal: ClienteFiscal | undefined;
  hasReglasEstadia: boolean;
}

interface ReadinessCheck {
  label: string;
  ok: boolean;
}

export function ClienteBillingReadiness({ clienteFiscal, hasReglasEstadia }: Props) {
  const checks: ReadinessCheck[] = [
    {
      label: 'RFC',
      ok: !!(clienteFiscal?.rfc && clienteFiscal.rfc !== 'XAXX010101000'),
    },
    {
      label: 'Razón Social',
      ok: !!clienteFiscal?.razon_social,
    },
    {
      label: 'Reglas de estadía',
      ok: hasReglasEstadia,
    },
    {
      label: 'Contacto facturación',
      ok: !!clienteFiscal?.contacto_facturacion_email,
    },
  ];

  const passed = checks.filter(c => c.ok).length;
  const total = checks.length;
  const missing = checks.filter(c => !c.ok);

  const Icon = passed === total ? CheckCircle2 : passed >= 2 ? AlertCircle : XCircle;
  const colorClass = passed === total
    ? 'text-emerald-500'
    : passed >= 2
      ? 'text-amber-500'
      : 'text-destructive';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-1 cursor-default">
          <Icon className={`h-3.5 w-3.5 ${colorClass}`} />
          <span className={`text-xs font-medium ${colorClass}`}>{passed}/{total}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="left" className="max-w-[220px]">
        <div className="space-y-1">
          <p className="font-medium text-xs">Readiness para facturar</p>
          {checks.map((c) => (
            <div key={c.label} className="flex items-center gap-1.5 text-xs">
              {c.ok ? (
                <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
              ) : (
                <XCircle className="h-3 w-3 text-destructive shrink-0" />
              )}
              <span className={c.ok ? 'text-muted-foreground' : ''}>{c.label}</span>
            </div>
          ))}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
