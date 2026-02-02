/**
 * CustodianList - Optimized list with windowing
 * Uses native IntersectionObserver for lightweight virtualization
 * Memoized for minimal re-renders on i3/8GB hardware
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Loader2, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CustodianCard } from './CustodianCard';
import type { CustodioConProximidad } from '@/hooks/useProximidadOperacional';
import type { CustodianCommunicationState } from '../types';

interface CustodianListProps {
  custodians: CustodioConProximidad[];
  isLoading: boolean;
  selectedId: string;
  highlightedIndex: number;
  comunicaciones: Record<string, CustodianCommunicationState>;
  onSelect: (custodio: CustodioConProximidad) => void;
  onContact: (custodio: CustodioConProximidad, method: 'whatsapp' | 'llamada') => void;
  onReportUnavailability?: (custodio: CustodioConProximidad) => void;
  onReportRejection?: (custodio: CustodioConProximidad) => void;
}

// Configuration for windowing
const INITIAL_VISIBLE = 8; // Render first 8 immediately
const LOAD_MORE_THRESHOLD = 4; // Load more when 4 from end
const BATCH_SIZE = 6; // Load 6 more at a time

export function CustodianList({
  custodians,
  isLoading,
  selectedId,
  highlightedIndex,
  comunicaciones,
  onSelect,
  onContact,
  onReportUnavailability,
  onReportRejection,
}: CustodianListProps) {
  // Auto-collapse when a custodian is selected
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Progressive rendering: start with first batch, load more on scroll
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);
  const containerRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (selectedId) {
      setIsCollapsed(true);
    }
  }, [selectedId]);

  // Reset visible count when custodians change
  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE);
  }, [custodians.length]);

  // IntersectionObserver for lazy loading more items
  useEffect(() => {
    if (!loadMoreRef.current || visibleCount >= custodians.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount(prev => Math.min(prev + BATCH_SIZE, custodians.length));
        }
      },
      { rootMargin: '100px' }
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [visibleCount, custodians.length]);

  // Memoize callbacks to prevent re-renders
  const handleSelect = useCallback((custodio: CustodioConProximidad) => {
    onSelect(custodio);
  }, [onSelect]);

  const handleContact = useCallback((custodio: CustodioConProximidad, method: 'whatsapp' | 'llamada') => {
    onContact(custodio, method);
  }, [onContact]);

  const handleReportUnavailability = useCallback((custodio: CustodioConProximidad) => {
    onReportUnavailability?.(custodio);
  }, [onReportUnavailability]);

  const handleReportRejection = useCallback((custodio: CustodioConProximidad) => {
    onReportRejection?.(custodio);
  }, [onReportRejection]);

  // Memoized visible slice
  const visibleCustodians = useMemo(() => 
    custodians.slice(0, visibleCount),
    [custodians, visibleCount]
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin mb-3" />
        <p className="text-sm">Cargando custodios...</p>
      </div>
    );
  }

  if (custodians.length === 0) {
    return null;
  }

  // When collapsed, show a toggle button
  if (isCollapsed && selectedId) {
    const otherCount = custodians.filter(c => c.id !== selectedId).length;
    
    return (
      <Button
        variant="ghost"
        className="w-full justify-between h-auto py-3 px-4 text-muted-foreground hover:text-foreground"
        onClick={() => setIsCollapsed(false)}
      >
        <span className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          Ver otros {otherCount} custodios disponibles
        </span>
        <ChevronDown className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <div className="space-y-3">
      {/* Collapse toggle when expanded with selection */}
      {selectedId && !isCollapsed && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-between text-muted-foreground hover:text-foreground"
          onClick={() => setIsCollapsed(true)}
        >
          <span>Ocultar lista</span>
          <ChevronUp className="h-4 w-4" />
        </Button>
      )}
      
      {/* Scrollable list with progressive loading */}
      <div 
        ref={containerRef}
        className="space-y-3 max-h-[400px] overflow-y-auto pr-1"
      >
        {visibleCustodians.map((custodio, index) => (
          <CustodianCard
            key={custodio.id}
            custodio={custodio}
            selected={selectedId === custodio.id}
            highlighted={highlightedIndex === index}
            comunicacion={comunicaciones[custodio.id]}
            onSelect={() => handleSelect(custodio)}
            onContact={(method) => handleContact(custodio, method)}
            onReportUnavailability={onReportUnavailability ? () => handleReportUnavailability(custodio) : undefined}
            onReportRejection={onReportRejection ? () => handleReportRejection(custodio) : undefined}
          />
        ))}
        
        {/* Sentinel for loading more */}
        {visibleCount < custodians.length && (
          <div ref={loadMoreRef} className="h-4 flex items-center justify-center">
            <span className="text-xs text-muted-foreground">
              Cargando más... ({visibleCount}/{custodians.length})
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
