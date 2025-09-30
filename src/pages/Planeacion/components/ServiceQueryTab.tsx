import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useServiceQuery } from '@/hooks/useServiceQuery';
import { ServiceQueryCard } from './ServiceQueryCard';
import { ServiceDetailsModal } from './ServiceDetailsModal';
import { Search, Calendar, X, Loader2, AlertCircle } from 'lucide-react';
import type { ServiceQueryResult } from '@/hooks/useServiceQuery';
import { Skeleton } from '@/components/ui/skeleton';

export function ServiceQueryTab() {
  const [searchMode, setSearchMode] = useState<'id' | 'client'>('id');
  const [serviceId, setServiceId] = useState('');
  const [clientName, setClientName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedService, setSelectedService] = useState<ServiceQueryResult | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

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
      searchByServiceId(serviceId);
    } else {
      const start = startDate ? new Date(startDate) : undefined;
      const end = endDate ? new Date(endDate) : undefined;
      searchByClientAndDate(clientName, start, end);
    }
  }, [searchMode, serviceId, clientName, startDate, endDate, searchByServiceId, searchByClientAndDate]);

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
            variant={searchMode === 'id' ? 'default' : 'ghost'}
            onClick={() => setSearchMode('id')}
            className="apple-button-ghost"
          >
            <Search className="h-4 w-4 mr-2" />
            Por ID de Servicio
          </Button>
          <Button
            variant={searchMode === 'client' ? 'default' : 'ghost'}
            onClick={() => setSearchMode('client')}
            className="apple-button-ghost"
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

      {/* Results Section */}
      {loading && (
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
          <div className="apple-text-body text-muted-foreground">
            Intenta con otros criterios de búsqueda
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
