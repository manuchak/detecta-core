import { useNavigate } from "react-router-dom";
import { Wrench, MessageSquarePlus, AlertCircle, Phone, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickActionsGridProps {
  onRegisterService: () => void;
  onReportUnavailability?: () => void;
  onContactSupport?: () => void;
  pendingTickets?: number;
}

const QuickActionsGrid = ({ 
  onRegisterService, 
  onReportUnavailability,
  onContactSupport,
  pendingTickets = 0 
}: QuickActionsGridProps) => {
  const navigate = useNavigate();

  const actions = [
    {
      icon: FileText,
      label: "Mis Documentos",
      sublabel: "Ver / Actualizar",
      onClick: () => navigate('/custodian/onboarding'),
      color: "text-cyan-600",
      bgColor: "bg-cyan-500/10",
      borderColor: "border-cyan-500/20",
    },
    {
      icon: Wrench,
      label: "Registrar Servicio",
      sublabel: "Taller / Refacción",
      onClick: onRegisterService,
      color: "text-blue-600",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20",
    },
    {
      icon: MessageSquarePlus,
      label: "Crear Ticket",
      sublabel: "Reclamo / Duda",
      onClick: () => navigate('/custodian/support'),
      color: "text-purple-600",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-500/20",
      badge: pendingTickets > 0 ? pendingTickets : undefined,
    },
    {
      icon: AlertCircle,
      label: "No Disponible",
      sublabel: "Reportar ausencia",
      onClick: onReportUnavailability || (() => navigate('/custodian/support')),
      color: "text-amber-600",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/20",
    },
    {
      icon: Phone,
      label: "Contactar Soporte",
      sublabel: "Ver opciones",
      onClick: onContactSupport || (() => navigate('/custodian/support')),
      color: "text-green-600",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {actions.map((action, index) => (
        <button
          key={index}
          onClick={action.onClick}
          className={cn(
            "relative rounded-2xl p-4 border text-left transition-all active:scale-[0.97]",
            action.bgColor,
            action.borderColor
          )}
        >
          {action.badge && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
              {action.badge}
            </span>
          )}
          <action.icon className={cn("w-7 h-7 mb-2", action.color)} />
          <p className={cn("font-semibold text-sm", action.color)}>{action.label}</p>
          <p className="text-xs text-muted-foreground">{action.sublabel}</p>
        </button>
      ))}
    </div>
  );
};

export default QuickActionsGrid;
