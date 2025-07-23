import React from 'react';
import { cn } from '@/lib/utils';

interface MinimalGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4 | 5;
  className?: string;
}

const columnStyles = {
  2: 'grid-cols-1 lg:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3',
  4: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4',
  5: 'grid-cols-1 md:grid-cols-3 xl:grid-cols-5',
};

export function MinimalGrid({ 
  children, 
  columns = 3,
  className 
}: MinimalGridProps) {
  return (
    <div className={cn(
      'grid gap-8 w-full items-stretch',
      columnStyles[columns],
      className
    )}>
      {children}
    </div>
  );
}