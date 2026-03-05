import { RadarResumen } from '@/hooks/useServiciosTurnoLive';

interface RadarSummaryBarProps {
  resumen: RadarResumen;
}

const metrics = [
  { key: 'enRuta' as const, label: 'EN RUTA', color: 'hsl(142, 76%, 36%)' },
  { key: 'enEvento' as const, label: 'EN EVENTO', color: 'hsl(271, 91%, 65%)' },
  { key: 'alerta' as const, label: 'ALERTA', color: 'hsl(0, 84%, 60%)' },
  { key: 'porIniciar' as const, label: 'POR INICIAR', color: 'hsl(217, 91%, 60%)' },
  { key: 'completados' as const, label: 'COMPLETADOS', color: 'hsl(220, 9%, 46%)' },
];

const RadarSummaryBar = ({ resumen }: RadarSummaryBarProps) => {
  return (
    <div className="grid grid-cols-5 gap-3">
      {metrics.map(({ key, label, color }) => {
        const value = resumen[key];
        const isCritical = key === 'alerta' && value > 0;

        return (
          <div
            key={key}
            className={`rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm px-3 py-2 flex items-center gap-4 ${
              isCritical ? 'animate-pulse border-red-500/50 bg-red-500/10' : ''
            }`}
          >
            <div
              className="w-3 h-10 rounded-full shrink-0"
              style={{ backgroundColor: color }}
            />
            <div className="min-w-0">
              <div
                className="text-5xl font-black tabular-nums leading-none"
                style={{ color }}
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

export default RadarSummaryBar;
