import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Phone, Rocket, Archive, List } from "lucide-react";
import { LeadsCounts } from "@/hooks/useLeadsCounts";

interface SupplySmartTabsProps {
  counts: LeadsCounts | undefined;
  isLoading: boolean;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const SupplySmartTabs = ({
  counts,
  isLoading,
  activeTab,
  onTabChange
}: SupplySmartTabsProps) => {
  const tabs = [
    {
      id: 'all',
      label: 'Todos',
      icon: List,
      count: counts?.total || 0,
    },
    {
      id: 'pending',
      label: 'Por Contactar',
      icon: Phone,
      count: counts?.pending || 0,
    },
    {
      id: 'approved',
      label: 'Listos',
      icon: Rocket,
      count: counts?.approved || 0,
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
      <TabsList className="grid w-full grid-cols-4 h-auto p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <TabsTrigger 
              key={tab.id} 
              value={tab.id}
              className="flex items-center gap-1.5 py-2 px-3 data-[state=active]:bg-background"
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              <Badge 
                variant="secondary" 
                className="ml-1 px-1.5 py-0 text-xs font-medium bg-muted"
              >
                {isLoading ? '...' : tab.count.toLocaleString()}
              </Badge>
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
};
