import { useState } from 'react';
import { useCustodioLiberacion } from '@/hooks/useCustodioLiberacion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Search, Loader2 } from 'lucide-react';
import LiberacionStats from '@/components/liberacion/LiberacionStats';
import LiberacionTable from '@/components/liberacion/LiberacionTable';
import LiberacionChecklistModal from '@/components/liberacion/LiberacionChecklistModal';
import { CustodioLiberacion, TipoOperativo } from '@/types/liberacion';
import { SupplyPipelineBreadcrumb } from '@/components/leads/supply/SupplyPipelineBreadcrumb';

const LiberacionPage = () => {
  const { liberaciones, isLoading } = useCustodioLiberacion();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState('en_proceso');
  const [selectedLiberacion, setSelectedLiberacion] = useState<CustodioLiberacion | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tipoOperativo, setTipoOperativo] = useState<TipoOperativo>('custodio');

  // Filtrar liberaciones por tab
  const getFilteredLiberaciones = () => {
    if (!liberaciones) return [];

    // Filter by tipo_operativo first
    let filtered = liberaciones.filter(l => (l.tipo_operativo || 'custodio') === tipoOperativo);

    // Filtrar por estado según tab
    switch (selectedTab) {
      case 'en_proceso':
        filtered = liberaciones.filter(l => 
          !['liberado', 'rechazado'].includes(l.estado_liberacion)
        );
        break;
      case 'pendientes_gps':
        filtered = liberaciones.filter(l => 
          !l.instalacion_gps_completado && l.estado_liberacion !== 'liberado'
        );
        break;
      case 'completados':
        filtered = liberaciones.filter(l => l.estado_liberacion === 'liberado');
        break;
    }

    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(l =>
        l.candidato?.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.candidato?.telefono?.includes(searchTerm)
      );
    }

    return filtered;
  };

  const filteredLiberaciones = getFilteredLiberaciones();

  const handleOpenModal = (liberacion: CustodioLiberacion) => {
    setSelectedLiberacion(liberacion);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedLiberacion(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Pipeline Breadcrumb */}
      <SupplyPipelineBreadcrumb />

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Liberación de Custodios</h1>
        <p className="text-muted-foreground mt-1">
          Gestiona el proceso de liberación desde aprobación hasta activación
        </p>
      </div>

      {/* Stats */}
      <LiberacionStats liberaciones={liberaciones || []} />

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <CardTitle>Pipeline de Liberación</CardTitle>
              <div className="flex items-center gap-1 bg-secondary/50 rounded-lg p-0.5 border border-border/50">
                <button
                  type="button"
                  onClick={() => setTipoOperativo('custodio')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    tipoOperativo === 'custodio'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Custodios
                </button>
                <button
                  type="button"
                  onClick={() => setTipoOperativo('armado')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    tipoOperativo === 'armado'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Armados
                </button>
              </div>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o teléfono..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="en_proceso">
                En Proceso ({liberaciones?.filter(l => (l.tipo_operativo || 'custodio') === tipoOperativo && !['liberado', 'rechazado'].includes(l.estado_liberacion)).length || 0})
              </TabsTrigger>
              <TabsTrigger value="pendientes_gps">
                Pendientes GPS ({liberaciones?.filter(l => (l.tipo_operativo || 'custodio') === tipoOperativo && !l.instalacion_gps_completado && l.estado_liberacion !== 'liberado').length || 0})
              </TabsTrigger>
              <TabsTrigger value="completados">
                Completados ({liberaciones?.filter(l => (l.tipo_operativo || 'custodio') === tipoOperativo && l.estado_liberacion === 'liberado').length || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={selectedTab} className="mt-6">
              <LiberacionTable 
                liberaciones={filteredLiberaciones}
                onViewDetails={handleOpenModal}
                isLoading={isLoading}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Modal de Checklist */}
      {selectedLiberacion && (
        <LiberacionChecklistModal
          liberacion={selectedLiberacion}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSuccess={handleCloseModal}
        />
      )}
    </div>
  );
};

export default LiberacionPage;
