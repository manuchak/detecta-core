import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MinimalSectionHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function MinimalSectionHeader({
  title,
  description,
  actions
}: MinimalSectionHeaderProps) {
  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-light text-gray-900 tracking-tight">
            {title}
          </h1>
          {description && (
            <p className="text-base text-gray-500 max-w-2xl">
              {description}
            </p>
          )}
        </div>
        
        {actions && (
          <div className="flex gap-3">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}