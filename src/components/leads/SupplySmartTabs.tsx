import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
      count: counts?.total || 0,
    },
    {
      id: 'pending',
      label: 'Pendientes',
      count: counts?.pending || 0,
    },
    {
      id: 'approved',
      label: 'Aprobados',
      count: counts?.approved || 0,
    },
    {
      id: 'rejected',
      label: 'Archivo',
      count: counts?.rejected || 0,
    },
  ];

  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <TabsList className="h-8 bg-muted/30 rounded-lg p-0.5 w-auto inline-flex">
        {tabs.map((tab) => (
          <TabsTrigger 
            key={tab.id} 
            value={tab.id}
            className="text-xs h-7 px-3 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md"
          >
            {tab.label}
            <span className="ml-1.5 text-[10px] tabular-nums opacity-60">
              {isLoading ? '...' : tab.count.toLocaleString()}
            </span>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
};