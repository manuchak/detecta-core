import { useEffect, useRef, useMemo } from 'react';
import { ServicioTurno, COLORES_ESTADO } from '@/hooks/useServiciosTurno';
import { format } from 'date-fns';

interface TVServicesListProps {
  servicios: ServicioTurno[];
}

const TVServicesList = ({ servicios }: TVServicesListProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll slow loop
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let animFrame: number;
    let speed = 0.5;

    const step = () => {
      if (!el) return;
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 2) {
        el.scrollTop = 0;
      } else {
        el.scrollTop += speed;
      }
      animFrame = requestAnimationFrame(step);
    };

    const timer = setTimeout(() => {
      if (el.scrollHeight > el.clientHeight + 20) {
        animFrame = requestAnimationFrame(step);
      }
    }, 3000);

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(animFrame);
    };
  }, [servicios]);

  // Group services by hour
  const grupos = useMemo(() => {
    const acc: Record<string, ServicioTurno[]> = {};
    for (const s of servicios) {
      const hora = s.fecha_hora_cita
        ? format(new Date(s.fecha_hora_cita), 'HH:mm')
        : '--:--';
      if (!acc[hora]) acc[hora] = [];
      acc[hora].push(s);
    }
    return acc;
  }, [servicios]);

  if (servicios.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 text-lg">
        Sin servicios en ventana
      </div>
    );
  }

  const horasOrdenadas = Object.keys(grupos).sort();

  return (
    <div className="h-full flex flex-col">
      <div className="text-sm font-semibold tracking-widest text-gray-500 uppercase px-3 py-2 border-b border-white/10">
        SERVICIOS ({servicios.length})
      </div>
      <div ref={scrollRef} className="flex-1 overflow-hidden">
        {horasOrdenadas.map((hora) => (
          <div key={hora}>
            {/* Time group separator */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.07]">
              <div className="h-px flex-1 bg-white/20" />
              <span className="text-lg font-semibold font-mono text-gray-300 tracking-wider shrink-0">
                {hora}
              </span>
              <div className="h-px flex-1 bg-white/20" />
            </div>

            {/* Services in this group */}
            {grupos[hora].map((s) => {
              const color = COLORES_ESTADO[s.estadoVisual];
              return (
                <div
                  key={s.id}
                  className="flex border-b border-white/5"
                >
                  {/* Status bar */}
                  <div
                    className="w-1 shrink-0 rounded-full my-1"
                    style={{ backgroundColor: color.primary }}
                  />
                  <div className="flex-1 pl-3 py-2 min-w-0">
                    {/* Line 1: Hour + Client */}
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-semibold font-mono text-emerald-400 shrink-0">
                        {hora}
                      </span>
                      <span className="text-sm text-white font-semibold">
                        {s.nombre_cliente || 'Sin cliente'}
                      </span>
                    </div>
                    {/* Line 2: Custodian */}
                    <div className="pl-[3.25rem]">
                      <span className="text-xs text-gray-500 truncate block">
                        {s.custodio_asignado || 'Sin custodio'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TVServicesList;
