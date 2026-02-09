import { useEffect, useRef } from 'react';
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
    let speed = 0.5; // px per frame

    const step = () => {
      if (!el) return;
      // If scrolled to bottom, reset
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 2) {
        el.scrollTop = 0;
      } else {
        el.scrollTop += speed;
      }
      animFrame = requestAnimationFrame(step);
    };

    // Only auto-scroll if content overflows
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

  if (servicios.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 text-lg">
        Sin servicios en ventana
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="text-xs font-semibold tracking-widest text-gray-500 uppercase px-3 pb-2 border-b border-white/10">
        SERVICIOS ({servicios.length})
      </div>
      <div ref={scrollRef} className="flex-1 overflow-hidden">
        {servicios.map((s) => {
          const color = COLORES_ESTADO[s.estadoVisual];
          const hora = s.fecha_hora_cita
            ? format(new Date(s.fecha_hora_cita), 'HH:mm')
            : '--:--';

          return (
            <div
              key={s.id}
              className="flex items-center gap-3 px-3 py-2.5 border-b border-white/5 hover:bg-white/5"
            >
              <div
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: color.primary }}
              />
              <span className="text-base font-mono text-gray-300 shrink-0 w-14">
                {hora}
              </span>
              <span className="text-sm text-white flex-1 font-medium">
                {s.nombre_cliente || 'Sin cliente'}
              </span>
              <span className="text-sm text-gray-400">
                {s.custodio_asignado || 'Sin custodio'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TVServicesList;
