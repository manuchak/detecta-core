import React, { useState } from 'react';

interface MobileChartBlockProps {
  tabs: { label: string; content: React.ReactNode }[];
}

export const MobileChartBlock: React.FC<MobileChartBlockProps> = ({ tabs }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div className="space-y-2">
      {/* Compact tab bar */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {tabs.map((tab, i) => (
          <button
            key={i}
            onClick={() => setActiveIndex(i)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap min-h-[36px] transition-colors ${
              i === activeIndex
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-accent'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {/* Active chart */}
      <div className="[&_.h-\\[280px\\]]:h-[220px] [&_.h-\\[300px\\]]:h-[220px]">
        {tabs[activeIndex]?.content}
      </div>
      {/* Dot indicators */}
      <div className="flex justify-center gap-1.5">
        {tabs.map((_, i) => (
          <button
            key={i}
            onClick={() => setActiveIndex(i)}
            className={`w-1.5 h-1.5 rounded-full transition-colors ${
              i === activeIndex ? 'bg-primary' : 'bg-muted-foreground/30'
            }`}
          />
        ))}
      </div>
    </div>
  );
};
