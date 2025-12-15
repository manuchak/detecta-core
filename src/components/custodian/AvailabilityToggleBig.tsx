import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface AvailabilityToggleBigProps {
  isAvailable: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

const AvailabilityToggleBig = ({ isAvailable, onToggle, disabled }: AvailabilityToggleBigProps) => {
  return (
    <div 
      className={cn(
        "rounded-2xl p-6 transition-all duration-300",
        isAvailable 
          ? "bg-green-500/10 border-2 border-green-500" 
          : "bg-red-500/10 border-2 border-red-500"
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <p className={cn(
            "text-2xl font-bold",
            isAvailable ? "text-green-600" : "text-red-600"
          )}>
            {isAvailable ? "🟢 Disponible" : "🔴 No disponible"}
          </p>
          <p className="text-base text-muted-foreground mt-1">
            {isAvailable 
              ? "Puedes recibir servicios" 
              : "No recibirás servicios"
            }
          </p>
        </div>
        
        <button
          onClick={onToggle}
          disabled={disabled}
          className={cn(
            "relative w-20 h-12 rounded-full transition-all duration-300 focus:outline-none focus:ring-4",
            isAvailable 
              ? "bg-green-500 focus:ring-green-500/30" 
              : "bg-red-500 focus:ring-red-500/30",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <span 
            className={cn(
              "absolute top-1 w-10 h-10 bg-white rounded-full shadow-lg transition-all duration-300",
              isAvailable ? "left-9" : "left-1"
            )}
          />
        </button>
      </div>
    </div>
  );
};

export default AvailabilityToggleBig;
