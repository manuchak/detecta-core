import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  Wallet, 
  Truck, 
  MapPin, 
  Users, 
  HelpCircle,
  LayoutGrid
} from "lucide-react";

export interface DepartmentConfig {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
}

export const DEPARTMENTS: DepartmentConfig[] = [
  { id: 'todos', label: 'Todos', icon: LayoutGrid, color: 'slate' },
  { id: 'finanzas', label: 'Finanzas', icon: Wallet, color: 'green' },
  { id: 'planeacion', label: 'Planeación', icon: Truck, color: 'blue' },
  { id: 'instaladores', label: 'Instaladores', icon: MapPin, color: 'purple' },
  { id: 'supply', label: 'Supply', icon: Users, color: 'amber' },
  { id: 'soporte', label: 'Soporte', icon: HelpCircle, color: 'gray' },
];

interface DepartmentTabsProps {
  selectedDepartment: string;
  onDepartmentChange: (department: string) => void;
  ticketCounts: Record<string, number>;
}

export const DepartmentTabs = ({
  selectedDepartment,
  onDepartmentChange,
  ticketCounts
}: DepartmentTabsProps) => {
  return (
    <Tabs value={selectedDepartment} onValueChange={onDepartmentChange} className="w-full">
      <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 h-auto gap-1 p-1 bg-muted/50">
        {DEPARTMENTS.map((dept) => {
          const Icon = dept.icon;
          const count = ticketCounts[dept.id] || 0;
          
          return (
            <TabsTrigger
              key={dept.id}
              value={dept.id}
              className="flex items-center gap-1.5 py-2 px-3 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline text-sm">{dept.label}</span>
              {count > 0 && (
                <Badge 
                  variant="secondary" 
                  className="h-5 min-w-[20px] px-1.5 text-xs"
                >
                  {count}
                </Badge>
              )}
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
};

export default DepartmentTabs;
