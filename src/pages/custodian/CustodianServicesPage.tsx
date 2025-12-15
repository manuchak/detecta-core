import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useCustodianProfile } from "@/hooks/useCustodianProfile";
import { useCustodianServices } from "@/hooks/useCustodianServices";
import SimpleServiceCard from "@/components/custodian/SimpleServiceCard";
import MobileBottomNavNew from "@/components/custodian/MobileBottomNavNew";

const CustodianServicesPage = () => {
  const navigate = useNavigate();
  const { profile } = useCustodianProfile();
  const { services, loading } = useCustodianServices(profile?.phone);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<'all' | 'completado' | 'pendiente'>('all');

  const filteredServices = services.filter(s => {
    const matchesSearch = !search || 
      s.nombre_cliente?.toLowerCase().includes(search.toLowerCase()) ||
      s.origen?.toLowerCase().includes(search.toLowerCase()) ||
      s.destino?.toLowerCase().includes(search.toLowerCase());
    
    const matchesFilter = filter === 'all' || 
      (filter === 'completado' && ['completado', 'finalizado', 'Completado', 'Finalizado'].includes(s.estado)) ||
      (filter === 'pendiente' && ['pendiente', 'programado', 'Pendiente', 'Programado'].includes(s.estado));

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b px-4 py-3">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => navigate('/custodian')} className="p-2 -ml-2 rounded-full hover:bg-muted">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold">Historial de Servicios</h1>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por cliente o ruta..."
            className="pl-9 h-10"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 mt-3">
          {(['all', 'completado', 'pendiente'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filter === f 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {f === 'all' ? 'Todos' : f === 'completado' ? 'Completados' : 'Pendientes'}
            </button>
          ))}
        </div>
      </header>

      {/* List */}
      <main className="px-4 py-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No se encontraron servicios</p>
          </div>
        ) : (
          filteredServices.map((service) => (
            <SimpleServiceCard key={service.id_servicio} service={service} />
          ))
        )}
      </main>

      <MobileBottomNavNew activeItem="services" onNavigate={(item) => {
        if (item === 'home') navigate('/custodian');
        else if (item === 'vehicle') navigate('/custodian/vehicle');
        else if (item === 'support') navigate('/custodian/support');
      }} />
    </div>
  );
};

export default CustodianServicesPage;
