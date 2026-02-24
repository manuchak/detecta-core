import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, XCircle, Clock } from 'lucide-react';
import { EstudioSocioeconomico } from '@/hooks/useEstudioSocioeconomico';

interface Props {
  estudio: EstudioSocioeconomico;
  size?: 'sm' | 'default';
}

export function SocioeconomicoBadge({ estudio, size = 'default' }: Props) {
  if (estudio.estado === 'pendiente' || estudio.estado === 'en_proceso') {
    if (size === 'sm') {
      return <Badge variant="secondary" className="text-xs px-1"><Clock className="h-2 w-2" /></Badge>;
    }
    return (
      <Badge variant="secondary" className="gap-1">
        <Clock className="h-3 w-3" />
        {estudio.estado === 'pendiente' ? 'Pendiente' : 'En proceso'}
      </Badge>
    );
  }

  const config = {
    favorable: { icon: CheckCircle, label: 'Favorable', className: 'bg-green-500/20 text-green-700 border-green-300' },
    con_observaciones: { icon: AlertTriangle, label: 'Con Obs.', className: 'bg-amber-500/20 text-amber-700 border-amber-300' },
    desfavorable: { icon: XCircle, label: 'Desfavorable', className: 'bg-red-500/20 text-red-700 border-red-300' },
  };

  const resultado = estudio.resultado_general as keyof typeof config;
  const c = config[resultado] || config.con_observaciones;
  const Icon = c.icon;

  if (size === 'sm') {
    return <Badge className={`text-xs px-1 ${c.className}`}><Icon className="h-2 w-2" /></Badge>;
  }

  return (
    <Badge className={`gap-1 ${c.className}`}>
      <Icon className="h-3 w-3" />
      {c.label}
      {estudio.score_global && <span className="ml-1 font-bold">{estudio.score_global}</span>}
    </Badge>
  );
}
