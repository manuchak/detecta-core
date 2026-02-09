import { ResumenTurno, COLORES_ESTADO } from '@/hooks/useServiciosTurno';

interface TVSummaryBarProps {
  resumen: ResumenTurno;
}

const metrics = [
  { key: 'enSitio' as const, estado: 'en_sitio' as const, label: 'EN SITIO' },
  { key: 'proximos' as const, estado: 'proximo' as const, label: 'PRÓXIMO' },
  { key: 'asignados' as const, estado: 'asignado' as const, label: 'ASIGNADO' },
  { key: 'sinAsignar' as const, estado: 'sin_asignar' as const, label: 'SIN ASIGNAR' },
];

const TVSummaryBar = ({ resumen }: TVSummaryBarProps) => {
  return (
    <div className="grid grid-cols-4 gap-3">
      {metrics.map(({ key, estado, label }) => {
        const color = COLORES_ESTADO[estado];
        const value = resumen[key];
        const isCritical = estado === 'sin_asignar' && value > 0;

        return (
          <div
            key={key}
            className={`rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm px-3 py-2 flex items-center gap-4 ${
              isCritical ? 'animate-pulse border-red-500/50 bg-red-500/10' : ''
            }`}
          >
            <div
              className="w-3 h-10 rounded-full shrink-0"
              style={{ backgroundColor: color.primary }}
            />
            <div className="min-w-0">
              <div
                className="text-5xl font-black tabular-nums leading-none"
                style={{ color: color.primary }}
              >
                {value}
              </div>
              <div className="text-xs font-semibold tracking-widest text-gray-400 mt-1 uppercase">
                {label}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TVSummaryBar;
