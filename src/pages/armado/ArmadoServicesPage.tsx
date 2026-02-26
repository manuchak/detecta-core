import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useArmadoProfile } from "@/hooks/useArmadoProfile";
import { useArmadoServices } from "@/hooks/useArmadoServices";
import ArmadoBottomNav from "@/components/armado/ArmadoBottomNav";

const ArmadoServicesPage = () => {
  const navigate = useNavigate();
  const { profile } = useArmadoProfile();
  const { services, loading } = useArmadoServices(profile?.armado_operativo_id);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<'all' | 'completado' | 'pendiente'>('all');

  const filteredServices = services.filter(s => {
    const matchesSearch = !search ||
      s.nombre_cliente?.toLowerCase().includes(search.toLowerCase()) ||
      s.origen?.toLowerCase().includes(search.toLowerCase()) ||
      s.destino?.toLowerCase().includes(search.toLowerCase());

    const matchesFilter = filter === 'all' ||
      (filter === 'completado' && ['completado', 'finalizado', 'Completado', 'Finalizado'].includes(s.estado_asignacion)) ||
      (filter === 'pendiente' && ['pendiente', 'confirmado', 'asignado', 'en_ruta'].includes(s.estado_asignacion));

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b px-4 py-3">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => navigate('/armado')} className="p-2 -ml-2 rounded-full hover:bg-muted">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold">Historial de Servicios</h1>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por cliente o ruta..."
            className="pl-9 h-10"
          />
        </div>

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
            <Card key={service.id}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm truncate">{service.nombre_cliente}</h4>
                  <Badge variant={
                    ['completado', 'finalizado'].includes(service.estado_asignacion) ? "default" : "secondary"
                  } className="text-[10px]">
                    {service.estado_asignacion}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground space-y-0.5">
                  <p>{service.tipo_servicio}</p>
                  {service.origen && <p>{service.origen} → {service.destino}</p>}
                  <p>Fecha: {service.fecha_hora_cita ? new Date(service.fecha_hora_cita).toLocaleDateString('es-MX') : '—'}</p>
                  {service.punto_encuentro && <p>📍 {service.punto_encuentro}</p>}
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-muted-foreground">{service.tipo_asignacion}</span>
                  {service.tarifa_acordada != null && (
                    <span className="text-sm font-semibold">${service.tarifa_acordada.toLocaleString()} MXN</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </main>

      <ArmadoBottomNav activeItem="services" onNavigate={(item) => {
        if (item === 'home') navigate('/armado');
        else if (item === 'support') navigate('/armado/support');
      }} />
    </div>
  );
};

export default ArmadoServicesPage;
