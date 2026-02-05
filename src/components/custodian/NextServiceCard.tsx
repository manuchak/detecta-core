 import { MapPin, Clock, Calendar, ChevronRight, ClipboardCheck, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface CustodianService {
  id_servicio: string;
  nombre_cliente: string;
  origen: string;
  destino: string;
  fecha_hora_cita: string;
  estado: string;
  tipo_servicio: string;
}

interface NextServiceCardProps {
  service: CustodianService | null;
  onViewDetails?: () => void;
   onStartChecklist?: (serviceId: string) => void;
   checklistCompleted?: boolean;
}

 const NextServiceCard = ({ service, onViewDetails, onStartChecklist, checklistCompleted }: NextServiceCardProps) => {
  if (!service) {
    return (
      <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl p-6 text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h3 className="text-xl font-bold text-foreground mb-2">
          ¡Sin servicios pendientes!
        </h3>
        <p className="text-muted-foreground text-lg">
          Descansa, te avisaremos cuando haya uno nuevo
        </p>
      </div>
    );
  }

  const serviceDate = new Date(service.fecha_hora_cita);
  const formattedTime = format(serviceDate, "h:mm a", { locale: es });
  const formattedDate = format(serviceDate, "EEEE d 'de' MMMM", { locale: es });

  return (
    <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-5 border-2 border-primary/20">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="bg-primary/20 text-primary font-semibold px-3 py-1 rounded-full text-sm">
          Próximo servicio
        </span>
        <span className="text-3xl font-bold text-primary">{formattedTime}</span>
      </div>
      
      {/* Client name */}
      <h3 className="text-xl font-bold text-foreground mb-3 line-clamp-1">
        {service.nombre_cliente}
      </h3>
      
      {/* Date */}
      <div className="flex items-center gap-2 text-muted-foreground mb-4">
        <Calendar className="w-5 h-5" />
        <span className="text-base capitalize">{formattedDate}</span>
      </div>
      
      {/* Route */}
      <div className="bg-background/60 rounded-xl p-4 mb-4">
        <div className="flex items-start gap-3">
          <div className="flex flex-col items-center">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <div className="w-0.5 h-8 bg-muted" />
            <div className="w-3 h-3 rounded-full bg-red-500" />
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <p className="text-xs text-muted-foreground uppercase">Origen</p>
              <p className="text-base font-medium text-foreground line-clamp-1">
                {service.origen || "Por definir"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase">Destino</p>
              <p className="text-base font-medium text-foreground line-clamp-1">
                {service.destino || "Por definir"}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Service type badge */}
       <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
          {service.tipo_servicio || "Custodia"}
        </span>
        {onViewDetails && (
          <button 
            onClick={onViewDetails}
            className="flex items-center gap-1 text-primary font-medium text-base active:scale-95 transition-transform"
          >
            Ver detalles
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>
       
       {/* Checklist section */}
       {onStartChecklist && (
         <div className="pt-4 border-t border-primary/20">
           {checklistCompleted ? (
             <div className="flex items-center justify-between bg-green-50 dark:bg-green-950/30 rounded-xl p-3">
               <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                 <CheckCircle className="w-5 h-5" />
                 <span className="font-medium">Checklist completado</span>
               </div>
               <button 
                 onClick={() => onStartChecklist(service.id_servicio)}
                 className="text-primary text-sm font-medium active:scale-95 transition-transform"
               >
                 Ver detalles
               </button>
             </div>
           ) : (
             <button 
               onClick={() => onStartChecklist(service.id_servicio)}
               className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-semibold text-lg active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
             >
               <ClipboardCheck className="w-5 h-5" />
               Iniciar Checklist Pre-Servicio
             </button>
           )}
         </div>
       )}
    </div>
  );
};

export default NextServiceCard;
