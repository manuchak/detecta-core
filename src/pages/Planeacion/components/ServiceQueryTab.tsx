import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useServiceQuery } from '@/hooks/useServiceQuery';
import { ServiceQueryCard } from './ServiceQueryCard';
import { ServiceDetailsModal } from './ServiceDetailsModal';
import { Search, Calendar, X, Loader2, AlertCircle, Clock, UserCircle } from 'lucide-react';
import type { ServiceQueryResult } from '@/hooks/useServiceQuery';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// Manejo de búsquedas recientes en sessionStorage
const RECENT_SEARCHES_KEY = 'planeacion_recent_searches';
const MAX_RECENT_SEARCHES = 5;

function getRecentSearches(): string[] {
  try {
    const stored = sessionStorage.getItem(RECENT_SEARCHES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function addRecentSearch(search: string) {
  if (!search.trim()) return;
  const recent = getRecentSearches();
  const filtered = recent.filter(s => s !== search);
  const updated = [search, ...filtered].slice(0, MAX_RECENT_SEARCHES);
  sessionStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
}

type SortOption = 'recent' | 'oldest' | 'client';

export function ServiceQueryTab() {
  const [searchMode, setSearchMode] = useState<'id' | 'client' | 'custodian'>('id');
  const [serviceId, setServiceId] = useState('');
  const [clientName, setClientName] = useState('');
  const [custodianName, setCustodianName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedService, setSelectedService] = useState<ServiceQueryResult | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [sortOption, setSortOption] = useState<SortOption>('recent');

  // Cargar búsquedas recientes al montar
  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  const {
    results,
    loading,
    error,
    searchByServiceId,
    searchByClientAndDate,
    searchByCustodian,
    clearResults
  } = useServiceQuery();

  // Sorted results
  const sortedResults = useMemo(() => {
    if (!results.length) return results;
    
    const sorted = [...results];
    switch (sortOption) {
      case 'recent':
        return sorted.sort((a, b) => 
          new Date(b.fecha_hora_cita).getTime() - new Date(a.fecha_hora_cita).getTime()
        );
      case 'oldest':
        return sorted.sort((a, b) => 
          new Date(a.fecha_hora_cita).getTime() - new Date(b.fecha_hora_cita).getTime()
        );
      case 'client':
        return sorted.sort((a, b) => 
          (a.nombre_cliente || '').localeCompare(b.nombre_cliente || '')
        );
      default:
        return sorted;
    }
  }, [results, sortOption]);

  const handleSearch = useCallback(() => {
    if (searchMode === 'id') {
      if (serviceId.trim()) {
        addRecentSearch(serviceId.trim());
        setRecentSearches(getRecentSearches());
      }
      searchByServiceId(serviceId);
    } else if (searchMode === 'client') {
      if (clientName.trim()) {
        addRecentSearch(clientName.trim());
        setRecentSearches(getRecentSearches());
      }
      const start = startDate ? new Date(startDate) : undefined;
      const end = endDate ? new Date(endDate) : undefined;
      searchByClientAndDate(clientName, start, end);
    } else if (searchMode === 'custodian') {
      if (custodianName.trim()) {
        addRecentSearch(custodianName.trim());
        setRecentSearches(getRecentSearches());
      }
      searchByCustodian(custodianName);
    }
  }, [searchMode, serviceId, clientName, custodianName, startDate, endDate, searchByServiceId, searchByClientAndDate, searchByCustodian]);

  const handleRecentSearchClick = useCallback((search: string) => {
    if (searchMode === 'id') {
      setServiceId(search);
      searchByServiceId(search);
    } else if (searchMode === 'client') {
      setClientName(search);
      searchByClientAndDate(search);
    } else if (searchMode === 'custodian') {
      setCustodianName(search);
      searchByCustodian(search);
    }
  }, [searchMode, searchByServiceId, searchByClientAndDate, searchByCustodian]);

  const handleClear = useCallback(() => {
    setServiceId('');
    setClientName('');
    setCustodianName('');
    setStartDate('');
    setEndDate('');
    clearResults();
  }, [clearResults]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    } else if (e.key === 'Escape') {
      handleClear();
    }
  }, [handleSearch, handleClear]);

  const handleCardDoubleClick = useCallback((service: ServiceQueryResult) => {
    setSelectedService(service);
    setDetailsModalOpen(true);
  }, []);

  const isSearchDisabled = loading || (
    searchMode === 'id' ? !serviceId.trim() : 
    searchMode === 'client' ? !clientName.trim() : 
    !custodianName.trim()
  );

  const hasSearchInput = serviceId || clientName || custodianName;

  return (
    <div className="apple-container space-y-4">
      {/* Header with Recent Searches */}
      <div className="apple-section-header">
        <div className="flex-1">
          <h1 className="apple-text-largetitle text-foreground">Consultas de Servicios</h1>
          <p className="apple-text-body text-muted-foreground">
            Busca por ID, cliente o custodio
          </p>
        </div>
        {recentSearches.length > 0 && (
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            {recentSearches.slice(0, 3).map((search, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="cursor-pointer hover:bg-primary/10 transition-colors text-xs"
                onClick={() => handleRecentSearchClick(search)}
              >
                {search.length > 12 ? search.slice(0, 12) + '...' : search}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Search Interface */}
      <div className="apple-card p-5">
        {/* Segmented Control for Search Mode */}
        <div className="inline-flex bg-muted/50 rounded-lg p-1 border border-border/50 mb-5">
          <button
            onClick={() => setSearchMode('id')}
            className={cn(
              "px-3 py-1.5 text-sm rounded-md transition-all flex items-center gap-1.5",
              searchMode === 'id' 
                ? "bg-background shadow-sm text-foreground font-medium" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Search className="h-3.5 w-3.5" />
            Por ID
          </button>
          <button
            onClick={() => setSearchMode('client')}
            className={cn(
              "px-3 py-1.5 text-sm rounded-md transition-all flex items-center gap-1.5",
              searchMode === 'client' 
                ? "bg-background shadow-sm text-foreground font-medium" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Calendar className="h-3.5 w-3.5" />
            Cliente/Fecha
          </button>
          <button
            onClick={() => setSearchMode('custodian')}
            className={cn(
              "px-3 py-1.5 text-sm rounded-md transition-all flex items-center gap-1.5",
              searchMode === 'custodian' 
                ? "bg-background shadow-sm text-foreground font-medium" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <UserCircle className="h-3.5 w-3.5" />
            Custodio
          </button>
        </div>

        {/* Search by Service ID - Compact Layout */}
        {searchMode === 'id' && (
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="ID del servicio (ej: YONSYGU-131)"
                  value={serviceId}
                  onChange={(e) => setServiceId(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="apple-input"
                  autoFocus
                />
              </div>
              <Button
                onClick={handleSearch}
                disabled={isSearchDisabled}
                className="apple-button-primary"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                <span className="ml-2">Buscar</span>
              </Button>
              {hasSearchInput && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClear}
                  className="shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              ↵ Enter para buscar · Esc para limpiar
            </p>
          </div>
        )}

        {/* Search by Client and Date - Compact Layout */}
        {searchMode === 'client' && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Nombre del cliente (ej: SAMSUNG)"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="apple-input"
                  autoFocus
                />
              </div>
              <Button
                onClick={handleSearch}
                disabled={isSearchDisabled}
                className="apple-button-primary"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                <span className="ml-2">Buscar</span>
              </Button>
              {hasSearchInput && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClear}
                  className="shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 flex-1">
                <span className="text-xs text-muted-foreground whitespace-nowrap">Rango:</span>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="apple-input h-8 text-xs"
                />
                <span className="text-muted-foreground">—</span>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="apple-input h-8 text-xs"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              ↵ Enter para buscar · Esc para limpiar · Fechas opcionales
            </p>
          </div>
        )}

        {/* Search by Custodian - Compact Layout */}
        {searchMode === 'custodian' && (
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Nombre o teléfono del custodio"
                  value={custodianName}
                  onChange={(e) => setCustodianName(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="apple-input"
                  autoFocus
                />
              </div>
              <Button
                onClick={handleSearch}
                disabled={isSearchDisabled}
                className="apple-button-primary"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                <span className="ml-2">Buscar</span>
              </Button>
              {hasSearchInput && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClear}
                  className="shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              ↵ Enter para buscar · Esc para limpiar
            </p>
          </div>
        )}
      </div>

      {/* Results Section */}
      {loading && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="apple-text-body">Buscando en servicios planificados y de custodia...</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="apple-card p-4 space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
                <Skeleton className="h-3 w-full" />
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && error && (
        <div className="apple-empty-state">
          <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-3" />
          <div className="apple-text-headline text-destructive">Error al buscar</div>
          <div className="apple-text-body text-muted-foreground">{error}</div>
        </div>
      )}

      {!loading && !error && results.length === 0 && hasSearchInput && (
        <div className="apple-empty-state">
          <Search className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <div className="apple-text-headline text-foreground">No se encontraron resultados</div>
          <div className="apple-text-body text-muted-foreground mb-4">
            Verifica el término o amplía tu búsqueda
          </div>
        </div>
      )}

      {/* Contextual Empty State with Examples */}
      {!loading && !error && results.length === 0 && !hasSearchInput && (
        <div className="apple-empty-state">
          <Search className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <div className="apple-text-headline text-foreground">Comienza tu búsqueda</div>
          <div className="mt-4 text-sm text-muted-foreground space-y-2">
            <p className="font-medium text-foreground">Ejemplos:</p>
            <div className="flex flex-col gap-1.5">
              <p>
                <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">YONSYGU-131</code>
                <span className="ml-2 text-xs">ID de servicio</span>
              </p>
              <p>
                <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">SAMSUNG</code>
                <span className="ml-2 text-xs">Nombre de cliente</span>
              </p>
              <p>
                <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">Abel Cruz</code>
                <span className="ml-2 text-xs">Nombre de custodio</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {!loading && sortedResults.length > 0 && (
        <>
          {/* Results Counter with Sorting */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              <strong className="text-foreground">{sortedResults.length}</strong> {sortedResults.length === 1 ? 'resultado' : 'resultados'}
            </span>
            <Select value={sortOption} onValueChange={(v) => setSortOption(v as SortOption)}>
              <SelectTrigger className="w-[160px] h-8 text-xs">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Más recientes</SelectItem>
                <SelectItem value="oldest">Más antiguos</SelectItem>
                <SelectItem value="client">Por cliente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedResults.map((service, index) => (
              <ServiceQueryCard
                key={`${service.id}-${index}`}
                service={service}
                onDoubleClick={handleCardDoubleClick}
              />
            ))}
          </div>
        </>
      )}

      {/* Details Modal */}
      <ServiceDetailsModal
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
        service={selectedService}
      />
    </div>
  );
}
