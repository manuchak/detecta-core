import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Clock, Users, AlertCircle, CheckCircle } from "lucide-react";
import { AssignedLead } from "@/types/leadTypes";
import { usePoolReserva } from "@/hooks/usePoolReserva";
import { PoolCandidateCard } from "./PoolCandidateCard";
import { ZoneCapacityManagement } from "./ZoneCapacityManagement";
import { BulkActionsPanel } from "./BulkActionsPanel";

interface PoolReservaViewProps {
  searchTerm?: string;
}

export const PoolReservaView = ({ searchTerm = "" }: PoolReservaViewProps) => {
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
  const [showZoneManagement, setShowZoneManagement] = useState(false);
  
  const {
    poolCandidates,
    zoneCapacities,
    loading,
    reactivateFromPool,
    bulkReactivateFromPool,
    refreshAll
  } = usePoolReserva();

  // Filter candidates based on search term
  const filteredCandidates = poolCandidates.filter(candidate =>
    candidate.lead_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    candidate.lead_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    candidate.zona_nombre?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate statistics
  const totalInPool = poolCandidates.length;
  const oldCandidates = poolCandidates.filter(c => {
    const daysInPool = c.fecha_entrada_pool 
      ? Math.floor((Date.now() - new Date(c.fecha_entrada_pool).getTime()) / (1000 * 60 * 60 * 24))
      : 0;
    return daysInPool > 30;
  }).length;

  const handleSelectCandidate = (leadId: string, selected: boolean) => {
    if (selected) {
      setSelectedCandidates(prev => [...prev, leadId]);
    } else {
      setSelectedCandidates(prev => prev.filter(id => id !== leadId));
    }
  };

  const handleSelectAll = (selectAll: boolean) => {
    if (selectAll) {
      setSelectedCandidates(filteredCandidates.map(c => c.lead_id));
    } else {
      setSelectedCandidates([]);
    }
  };

  const handleBulkReactivate = async () => {
    if (selectedCandidates.length === 0) return;
    
    await bulkReactivateFromPool(selectedCandidates);
    setSelectedCandidates([]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Cargando pool de candidatos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total en Pool</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalInPool}</div>
            <p className="text-xs text-muted-foreground">
              Candidatos aprobados en espera
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Candidatos antiguos</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{oldCandidates}</div>
            <p className="text-xs text-muted-foreground">
              Más de 30 días en pool
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Zonas saturadas</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {zoneCapacities.filter(z => z.zona_saturada).length}
            </div>
            <p className="text-xs text-muted-foreground">
              De {zoneCapacities.length} zonas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Seleccionados</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{selectedCandidates.length}</div>
            <p className="text-xs text-muted-foreground">
              Para acciones masivas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        <Button
          variant="outline"
          onClick={() => setShowZoneManagement(!showZoneManagement)}
        >
          {showZoneManagement ? 'Ocultar' : 'Gestionar'} Capacidades por Zona
        </Button>
        
        <Button
          onClick={refreshAll}
          variant="outline"
        >
          Actualizar
        </Button>
        
        {selectedCandidates.length > 0 && (
          <>
            <Separator orientation="vertical" className="h-6" />
            <Badge variant="secondary">
              {selectedCandidates.length} seleccionado{selectedCandidates.length !== 1 ? 's' : ''}
            </Badge>
          </>
        )}
      </div>

      {/* Zone capacity management */}
      {showZoneManagement && (
        <ZoneCapacityManagement 
          zoneCapacities={zoneCapacities}
          onClose={() => setShowZoneManagement(false)}
        />
      )}

      {/* Bulk actions panel */}
      {selectedCandidates.length > 0 && (
        <BulkActionsPanel
          selectedCount={selectedCandidates.length}
          onReactivateAll={handleBulkReactivate}
          onDeselectAll={() => setSelectedCandidates([])}
        />
      )}

      {/* Pool candidates list */}
      <div className="space-y-4">
        {filteredCandidates.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground">
                {totalInPool === 0 ? (
                  <>
                    <Users className="mx-auto h-12 w-12 mb-4 text-muted-foreground/50" />
                    <h3 className="text-lg font-semibold mb-2">No hay candidatos en el pool</h3>
                    <p>Los candidatos aprobados en zonas saturadas aparecerán aquí.</p>
                  </>
                ) : (
                  <>
                    <AlertCircle className="mx-auto h-12 w-12 mb-4 text-muted-foreground/50" />
                    <h3 className="text-lg font-semibold mb-2">No se encontraron candidatos</h3>
                    <p>Intenta con un término de búsqueda diferente.</p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Select all option */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="select-all"
                checked={selectedCandidates.length === filteredCandidates.length}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="rounded border-input"
              />
              <label htmlFor="select-all" className="text-sm font-medium">
                Seleccionar todos ({filteredCandidates.length})
              </label>
            </div>

            {filteredCandidates.map((candidate) => (
              <PoolCandidateCard
                key={candidate.lead_id}
                candidate={candidate}
                selected={selectedCandidates.includes(candidate.lead_id)}
                onSelect={(selected) => handleSelectCandidate(candidate.lead_id, selected)}
                onReactivate={() => reactivateFromPool(candidate.lead_id)}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
};