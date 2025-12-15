import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { 
  Building2, 
  Wallet, 
  Truck, 
  MapPin, 
  Users, 
  HelpCircle,
  LayoutGrid
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface DepartmentConfig {
  id: string;
  label: string;
  icon: React.ElementType;
  colorClasses: {
    active: string;
    inactive: string;
    badge: string;
  };
}

export const DEPARTMENTS: DepartmentConfig[] = [
  { 
    id: 'todos', 
    label: 'Todos', 
    icon: LayoutGrid, 
    colorClasses: {
      active: 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-lg',
      inactive: 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300',
      badge: 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200'
    }
  },
  { 
    id: 'finanzas', 
    label: 'Finanzas', 
    icon: Wallet, 
    colorClasses: {
      active: 'bg-emerald-600 text-white shadow-lg shadow-emerald-200 dark:shadow-emerald-900/30',
      inactive: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-400',
      badge: 'bg-emerald-200 text-emerald-800 dark:bg-emerald-800 dark:text-emerald-200'
    }
  },
  { 
    id: 'planeacion', 
    label: 'Planeación', 
    icon: Truck, 
    colorClasses: {
      active: 'bg-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-blue-900/30',
      inactive: 'bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/50 dark:text-blue-400',
      badge: 'bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200'
    }
  },
  { 
    id: 'instaladores', 
    label: 'Instaladores', 
    icon: MapPin, 
    colorClasses: {
      active: 'bg-purple-600 text-white shadow-lg shadow-purple-200 dark:shadow-purple-900/30',
      inactive: 'bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-950/50 dark:text-purple-400',
      badge: 'bg-purple-200 text-purple-800 dark:bg-purple-800 dark:text-purple-200'
    }
  },
  { 
    id: 'supply', 
    label: 'Supply', 
    icon: Users, 
    colorClasses: {
      active: 'bg-amber-500 text-white shadow-lg shadow-amber-200 dark:shadow-amber-900/30',
      inactive: 'bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/50 dark:text-amber-400',
      badge: 'bg-amber-200 text-amber-800 dark:bg-amber-800 dark:text-amber-200'
    }
  },
  { 
    id: 'soporte', 
    label: 'Soporte', 
    icon: HelpCircle, 
    colorClasses: {
      active: 'bg-gray-600 text-white shadow-lg shadow-gray-200 dark:shadow-gray-900/30',
      inactive: 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400',
      badge: 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    }
  },
];

interface DepartmentPillsProps {
  selectedDepartment: string;
  onDepartmentChange: (department: string) => void;
  ticketCounts: Record<string, number>;
}

export const DepartmentPills = ({
  selectedDepartment,
  onDepartmentChange,
  ticketCounts
}: DepartmentPillsProps) => {
  return (
    <ScrollArea className="w-full whitespace-nowrap">
      <div className="flex gap-2 pb-2">
        {DEPARTMENTS.map((dept) => {
          const Icon = dept.icon;
          const count = ticketCounts[dept.id] || 0;
          const isActive = selectedDepartment === dept.id;
          
          return (
            <button
              key={dept.id}
              onClick={() => onDepartmentChange(dept.id)}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2.5 rounded-full font-medium text-sm transition-all duration-200 ease-out",
                "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/50",
                isActive ? dept.colorClasses.active : dept.colorClasses.inactive,
                isActive && "scale-[1.02]"
              )}
            >
              <Icon className={cn(
                "h-4.5 w-4.5 transition-transform",
                isActive && "scale-110"
              )} />
              <span className="hidden sm:inline">{dept.label}</span>
              {count > 0 && (
                <Badge 
                  variant="secondary" 
                  className={cn(
                    "h-5 min-w-[22px] px-1.5 text-xs font-semibold rounded-full",
                    isActive ? "bg-white/20 text-current" : dept.colorClasses.badge
                  )}
                >
                  {count}
                </Badge>
              )}
            </button>
          );
        })}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
};

export default DepartmentPills;
