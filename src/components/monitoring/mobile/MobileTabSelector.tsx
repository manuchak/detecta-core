import React, { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

export interface MobileTab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: number;
  hidden?: boolean;
}

interface MobileTabSelectorProps {
  tabs: MobileTab[];
  activeTab: string;
  onTabChange: (id: string) => void;
}

export const MobileTabSelector: React.FC<MobileTabSelectorProps> = ({ tabs, activeTab, onTabChange }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  // Auto-scroll active pill into view
  useEffect(() => {
    if (activeRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const el = activeRef.current;
      const left = el.offsetLeft - container.offsetWidth / 2 + el.offsetWidth / 2;
      container.scrollTo({ left: Math.max(0, left), behavior: 'smooth' });
    }
  }, [activeTab]);

  const visibleTabs = tabs.filter(t => !t.hidden);

  return (
    <div
      ref={scrollRef}
      className="flex gap-1.5 overflow-x-auto scrollbar-hide px-3 py-2"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {visibleTabs.map(tab => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            ref={isActive ? activeRef : undefined}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium whitespace-nowrap shrink-0 transition-all duration-200 min-h-[36px] touch-manipulation relative',
              isActive
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted/50 text-muted-foreground hover:bg-muted'
            )}
          >
            {tab.icon}
            {tab.label}
            {tab.badge != null && tab.badge > 0 && (
              <span className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center font-bold">
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
