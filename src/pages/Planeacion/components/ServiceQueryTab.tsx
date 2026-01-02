import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useServiceQuery } from '@/hooks/useServiceQuery';
import { ServiceQueryCard } from './ServiceQueryCard';
import { ServiceDetailsModal } from './ServiceDetailsModal';
import { Search, Calendar, X, Loader2, AlertCircle, Clock, Lightbulb } from 'lucide-react';
import type { ServiceQueryResult } from '@/hooks/useServiceQuery';
import { Skeleton } from '@/components/ui/skeleton';

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

export function ServiceQueryTab() {
  const [searchMode, setSearchMode] = useState<'id' | 'client'>('id');
  const [serviceId, setServiceId] = useState('');
  const [clientName, setClientName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedService, setSelectedService] = useState<ServiceQueryResult | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

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
    clearResults
  } = useServiceQuery();

  const handleSearch = useCallback(() => {
    if (searchMode === 'id') {
      if (serviceId.trim()) {
        addRecentSearch(serviceId.trim());
        setRecentSearches(getRecentSearches());
      }
      searchByServiceId(serviceId);
    } else {
      if (clientName.trim()) {
        addRecentSearch(clientName.trim());
        setRecentSearches(getRecentSearches());
      }
      const start = startDate ? new Date(startDate) : undefined;
      const end = endDate ? new Date(endDate) : undefined;
      searchByClientAndDate(clientName, start, end);
    }
  }, [searchMode, serviceId, clientName, startDate, endDate, searchByServiceId, searchByClientAndDate]);

  const handleRecentSearchClick = useCallback((search: string) => {
    if (searchMode === 'id') {
      setServiceId(search);
      searchByServiceId(search);
    } else {
      setClientName(search);
      searchByClientAndDate(search);
    }
  }, [searchMode, searchByServiceId, searchByClientAndDate]);

  const handleClear = useCallback(() => {
    setServiceId('');
    setClientName('');
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

  return (
    <div className="apple-container space-y-6">
      {/* Header */}
      <div className="apple-section-header">
        <div>
          <h1 className="apple-text-largetitle text-foreground">Consultas de Servicios</h1>
          <p className="apple-text-body text-muted-foreground">
            Busca servicios por ID o por cliente y fecha
          </p>
        </div>
      </div>

      {/* Search Interface */}
      <div className="apple-card p-6">
        {/* Search Mode Toggle */}
        <div className="flex items-center space-x-2 mb-6">
          <Button
            variant="ghost"
            onClick={() => setSearchMode('id')}
            className={searchMode === 'id' ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'hover:bg-accent hover:text-accent-foreground'}
          >
            <Search className="h-4 w-4 mr-2" />
            Por ID de Servicio
          </Button>
          <Button
            variant="ghost"
            onClick={() => setSearchMode('client')}
            className={searchMode === 'client' ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'hover:bg-accent hover:text-accent-foreground'}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Por Cliente y Fecha
          </Button>
        </div>

        {/* Search by Service ID */}
        {searchMode === 'id' && (
          <div className="space-y-4">
            <div>
              <label className="apple-text-caption text-muted-foreground mb-2 block">
                ID de Servicio
              </label>
              <Input
                type="text"
                placeholder="Ingresa el ID del servicio..."
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                onKeyDown={handleKeyPress}
                className="apple-input"
                autoFocus
              />
            </div>
          </div>
        )}

        {/* Search by Client and Date */}
        {searchMode === 'client' && (
          <div className="space-y-4">
            <div>
              <label className="apple-text-caption text-muted-foreground mb-2 block">
                Nombre del Cliente
              </label>
              <Input
                type="text"
                placeholder="Ingresa el nombre del cliente..."
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                onKeyDown={handleKeyPress}
                className="apple-input"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="apple-text-caption text-muted-foreground mb-2 block">
                  Fecha Inicio (opcional)
                </label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="apple-input"
                />
              </div>

              <div>
                <label className="apple-text-caption text-muted-foreground mb-2 block">
                  Fecha Fin (opcional)
                </label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="apple-input"
                />
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center space-x-3 mt-6">
          <Button
            onClick={handleSearch}
            disabled={loading || (searchMode === 'id' ? !serviceId.trim() : !clientName.trim())}
            className="apple-button-primary"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Buscando...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Buscar
              </>
            )}
          </Button>

          <Button
            variant="ghost"
            onClick={handleClear}
            className="apple-button-ghost"
          >
            <X className="h-4 w-4 mr-2" />
            Limpiar
          </Button>
        </div>

        {/* Quick Tips */}
        <div className="mt-6 p-4 bg-muted/30 rounded-lg border border-border/30">
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="apple-text-caption text-muted-foreground">
              <strong>Atajos:</strong> Presiona <kbd className="px-1.5 py-0.5 bg-background rounded border border-border text-xs">Enter</kbd> para buscar,{' '}
              <kbd className="px-1.5 py-0.5 bg-background rounded border border-border text-xs">Esc</kbd> para limpiar. Doble clic en una tarjeta para ver detalles completos.
            </div>
          </div>
        </div>
      </div>

      {/* Búsquedas recientes */}
      {recentSearches.length > 0 && !loading && results.length === 0 && (
        <div className="apple-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="apple-text-caption text-muted-foreground font-medium">Búsquedas recientes</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {recentSearches.map((search, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="cursor-pointer hover:bg-primary/10 transition-colors"
                onClick={() => handleRecentSearchClick(search)}
              >
                {search}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Results Section */}
      {loading && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="apple-text-body">Buscando en servicios planificados y de custodia...</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="apple-card p-5 space-y-3">
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
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-3" />
          <div className="apple-text-headline text-red-700">Error al buscar</div>
          <div className="apple-text-body text-muted-foreground">{error}</div>
        </div>
      )}

      {!loading && !error && results.length === 0 && (serviceId || clientName) && (
        <div className="apple-empty-state">
          <Search className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <div className="apple-text-headline text-foreground">No se encontraron resultados</div>
          <div className="apple-text-body text-muted-foreground mb-4">
            No hay servicios que coincidan con tu búsqueda
          </div>
          
          {/* Sugerencias útiles */}
          <div className="bg-muted/30 rounded-lg p-4 text-left max-w-md mx-auto">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              <span className="apple-text-caption font-medium">Sugerencias</span>
            </div>
            <ul className="apple-text-caption text-muted-foreground space-y-2">
              <li>• Verifica que el ID esté escrito correctamente</li>
              <li>• Intenta con una parte del ID (búsqueda parcial)</li>
              {searchMode === 'id' && (
                <li>• Prueba buscando por nombre de cliente en su lugar</li>
              )}
              {searchMode === 'client' && (
                <li>• Amplía el rango de fechas o déjalas vacías</li>
              )}
            </ul>
          </div>
        </div>
      )}

      {!loading && !error && results.length === 0 && !serviceId && !clientName && (
        <div className="apple-empty-state">
          <Search className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <div className="apple-text-headline text-foreground">Comienza tu búsqueda</div>
          <div className="apple-text-body text-muted-foreground">
            Ingresa un ID de servicio o nombre de cliente para buscar
          </div>
        </div>
      )}

      {!loading && results.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <div className="apple-text-body text-muted-foreground">
              {results.length} {results.length === 1 ? 'resultado encontrado' : 'resultados encontrados'}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((service, index) => (
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
