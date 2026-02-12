import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface MidotBadgeProps {
  resultado: string | null | undefined;
  size?: 'sm' | 'default';
}

export function MidotBadge({ resultado, size = 'default' }: MidotBadgeProps) {
  if (!resultado || resultado === 'pendiente') return null;

  const config: Record<string, { label: string; className: string }> = {
    verde: { label: 'OK', className: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30' },
    ambar: { label: 'Á', className: 'bg-amber-500/15 text-amber-700 border-amber-500/30' },
    rojo: { label: '!', className: 'bg-red-500/15 text-red-700 border-red-500/30' },
  };

  const c = config[resultado] || config.ambar;

  return (
    <Badge
      variant="outline"
      className={cn(
        c.className,
        size === 'sm' ? 'text-[10px] px-1 py-0 h-4 leading-none' : 'text-xs'
      )}
    >
      {c.label}
    </Badge>
  );
}
