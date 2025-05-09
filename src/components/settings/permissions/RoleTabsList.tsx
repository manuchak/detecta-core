
import React from 'react';
import { Role } from '@/types/roleTypes';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

interface RoleTabsListProps {
  roles: Role[] | undefined;
  activeTab: string;
  onTabChange: (value: string) => void;
  children: React.ReactNode;
}

export const RoleTabsList = ({ 
  roles, 
  activeTab, 
  onTabChange,
  children 
}: RoleTabsListProps) => {
  
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
      case 'admin':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      case 'supply_admin':
      case 'monitoring_supervisor':
        return 'bg-amber-100 text-amber-800 hover:bg-amber-200';
      case 'supply':
      case 'soporte':
      case 'bi':
      case 'monitoring':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case 'unverified':
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  return (
    <Tabs defaultValue={activeTab} value={activeTab} onValueChange={onTabChange} className="w-full">
      <TabsList className="grid grid-cols-5 gap-2 bg-muted/50 p-1 rounded-xl mb-6">
        {Array.isArray(roles) && roles.slice(0, 5).map((role) => (
          <TabsTrigger 
            key={role} 
            value={role}
            className="data-[state=active]:shadow-sm flex items-center gap-2 py-2.5"
          >
            <Badge variant="outline" className={`${getRoleBadgeColor(role)} font-medium px-2 py-0.5`}>
              {role}
            </Badge>
          </TabsTrigger>
        ))}
      </TabsList>
      {children}
    </Tabs>
  );
};
