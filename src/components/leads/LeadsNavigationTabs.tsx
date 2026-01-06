import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Phone, Rocket, Clock, Archive } from "lucide-react";
import { LeadsCounts } from "@/hooks/useLeadsCounts";
import { cn } from "@/lib/utils";

interface LeadsNavigationTabsProps {
  counts: LeadsCounts | undefined;
  isLoading: boolean;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const LeadsNavigationTabs = ({
  counts,
  isLoading,
  activeTab,
  onTabChange
}: LeadsNavigationTabsProps) => {
  const tabs = [
    {
      id: 'uncontacted',
      label: 'Por Contactar',
      icon: Phone,
      count: counts?.uncontacted || 0,
    },
    {
      id: 'approved',
      label: 'Listos',
      icon: Rocket,
      count: counts?.approved || 0,
    },
    {
      id: 'pending',
      label: 'En Proceso',
      icon: Clock,
      count: counts?.pending || 0,
    },
    {
      id: 'rejected',
      label: 'Archivo',
      icon: Archive,
      count: counts?.rejected || 0,
    },
  ];

  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <TabsList className="h-9 bg-muted/30 backdrop-blur-sm rounded-lg p-1 w-auto inline-flex border border-border/30">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <TabsTrigger 
              key={tab.id} 
              value={tab.id}
              className={cn(
                "text-xs h-7 px-3 gap-1.5 rounded-md transition-all",
                "data-[state=active]:bg-background data-[state=active]:shadow-sm",
                "hover:bg-background/50"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="text-[10px] tabular-nums opacity-60">
                {isLoading ? '...' : tab.count.toLocaleString()}
              </span>
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
};
