import { useNavigate } from "react-router-dom";
import { ArrowLeft, Gauge, Settings } from "lucide-react";
import { useCustodianProfile } from "@/hooks/useCustodianProfile";
import { useCustodianServices } from "@/hooks/useCustodianServices";
import { useCustodianMaintenance, MAINTENANCE_INTERVALS } from "@/hooks/useCustodianMaintenance";
import RecordMaintenanceDialog from "@/components/custodian/RecordMaintenanceDialog";
import MaintenanceSettingsDialog from "@/components/custodian/MaintenanceSettingsDialog";
import MobileBottomNavNew from "@/components/custodian/MobileBottomNavNew";
import { useState } from "react";
import { cn } from "@/lib/utils";

const CustodianVehiclePage = () => {
  const navigate = useNavigate();
  const { profile } = useCustodianProfile();
  const { stats } = useCustodianServices(profile?.phone);
  const { maintenanceStatus, createMaintenance, records, refetchIntervals } = useCustodianMaintenance(profile?.phone, stats.km_totales);
  const [selectedMaintenance, setSelectedMaintenance] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleRecordMaintenance = async (data: any) => {
    const success = await createMaintenance(data);
    if (success) {
      setDialogOpen(false);
      setSelectedMaintenance(null);
    }
    return success;
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/custodian')} className="p-2 -ml-2 rounded-full hover:bg-muted">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold">Mi Vehículo</h1>
        </div>
      </header>

      <main className="px-4 py-4 space-y-6">
        {/* KM Card */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Gauge className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm opacity-80">Kilometraje total</p>
              <p className="text-3xl font-bold">{stats.km_totales.toLocaleString()} km</p>
            </div>
          </div>
        </div>

        {/* Maintenance Status */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Estado de Mantenimiento</h2>
            <button 
              onClick={() => setSettingsOpen(true)}
              className="p-2 rounded-full hover:bg-muted active:scale-95 transition-all"
              title="Configurar intervalos"
            >
              <Settings className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
          <div className="space-y-2">
            {maintenanceStatus.map((item) => (
              <button
                key={item.tipo}
                onClick={() => { setSelectedMaintenance(item); setDialogOpen(true); }}
                className="w-full bg-card border border-border rounded-xl p-4 flex items-center gap-3 text-left active:scale-[0.98] transition-transform"
              >
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center text-lg",
                  item.estado === 'vencido' ? "bg-red-500/10" :
                  item.estado === 'proximo' ? "bg-amber-500/10" : "bg-green-500/10"
                )}>
                  {item.icono}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{item.nombre}</p>
                  <p className={cn(
                    "text-xs",
                    item.estado === 'vencido' ? "text-red-600" :
                    item.estado === 'proximo' ? "text-amber-600" : "text-muted-foreground"
                  )}>
                    {item.estado === 'vencido' 
                      ? `Vencido hace ${Math.abs(item.km_restantes).toLocaleString()} km`
                      : `Próximo en ${item.km_restantes.toLocaleString()} km`
                    }
                  </p>
                </div>
                <div className="w-12 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full rounded-full",
                      item.estado === 'vencido' ? "bg-red-500" :
                      item.estado === 'proximo' ? "bg-amber-500" : "bg-green-500"
                    )}
                    style={{ width: `${Math.max(0, item.porcentaje_vida)}%` }}
                  />
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Recent Records */}
        {records.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold mb-3">Historial Reciente</h2>
            <div className="space-y-2">
              {records.slice(0, 5).map((record) => {
                const interval = MAINTENANCE_INTERVALS.find(i => i.tipo === record.tipo_mantenimiento);
                return (
                  <div key={record.id} className="bg-muted/50 rounded-xl p-3 flex items-center gap-3">
                    <span className="text-lg">{interval?.icono || '🔧'}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{interval?.nombre || record.tipo_mantenimiento}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(record.fecha_realizacion).toLocaleDateString('es-MX')} • {record.km_al_momento.toLocaleString()} km
                      </p>
                    </div>
                    {record.costo_estimado && (
                      <span className="text-sm text-green-600 font-medium">${record.costo_estimado}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>

      <RecordMaintenanceDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        maintenance={selectedMaintenance}
        currentKm={stats.km_totales}
        onConfirm={handleRecordMaintenance}
      />

      <MaintenanceSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        custodianPhone={profile?.phone}
        onSaved={refetchIntervals}
      />

      <MobileBottomNavNew activeItem="vehicle" onNavigate={(item) => {
        if (item === 'home') navigate('/custodian');
        else if (item === 'services') navigate('/custodian/services');
        else if (item === 'support') navigate('/custodian/support');
      }} />
    </div>
  );
};

export default CustodianVehiclePage;
