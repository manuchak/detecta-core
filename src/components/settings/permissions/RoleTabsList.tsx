
import React from 'react';
import { Role } from '@/types/roleTypes';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';

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
  return (
    <Tabs defaultValue={activeTab} value={activeTab} onValueChange={onTabChange}>
      <TabsList className="grid grid-cols-5 mb-4">
        {Array.isArray(roles) && roles.slice(0, 5).map((role) => (
          <TabsTrigger key={role} value={role}>{role}</TabsTrigger>
        ))}
      </TabsList>
      {children}
    </Tabs>
  );
};
