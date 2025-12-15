import { useNavigate } from "react-router-dom";
import { ArrowLeft, Gauge, Settings, Wrench } from "lucide-react";
import { useCustodianProfile } from "@/hooks/useCustodianProfile";
import { useCustodianServices } from "@/hooks/useCustodianServices";
import { useCustodianMaintenance, MAINTENANCE_INTERVALS } from "@/hooks/useCustodianMaintenance";
import RecordMaintenanceDialog from "@/components/custodian/RecordMaintenanceDialog";
import MaintenanceSettingsDialog from "@/components/custodian/MaintenanceSettingsDialog";
import BatchMaintenanceDialog from "@/components/custodian/BatchMaintenanceDialog";
import VehicleHealthSummary from "@/components/custodian/VehicleHealthSummary";
import UrgentMaintenanceAlert from "@/components/custodian/UrgentMaintenanceAlert";
import MaintenanceListCollapsible from "@/components/custodian/MaintenanceListCollapsible";
import MobileBottomNavNew from "@/components/custodian/MobileBottomNavNew";
import { useState } from "react";

const CustodianVehiclePage = () => {
  const navigate = useNavigate();
  const { profile } = useCustodianProfile();
  const { stats } = useCustodianServices(profile?.phone);
  const { maintenanceStatus, createMaintenance, createBatchMaintenance, records, refetchIntervals } = useCustodianMaintenance(profile?.phone, stats.km_totales);
  const [selectedMaintenance, setSelectedMaintenance] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleRecordMaintenance = async (data: any) => {
    const success = await createMaintenance(data);
    if (success) {
      setDialogOpen(false);
      setSelectedMaintenance(null);
    }
    return success;
  };

  const handleSelectMaintenanceItem = (item: any) => {
    setSelectedMaintenance(item);
    setDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/custodian')} className="p-2 -ml-2 rounded-full hover:bg-muted">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold">Mi Vehículo</h1>
          </div>
          <button 
            onClick={() => setSettingsOpen(true)}
            className="p-2 rounded-full hover:bg-muted active:scale-95 transition-all"
            title="Configurar intervalos"
          >
            <Settings className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </header>

      <main className="px-4 py-4 space-y-5">
        {/* KM Card - Compact */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 text-white flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <Gauge className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm opacity-80">Kilometraje total</p>
            <p className="text-2xl font-bold">{stats.km_totales.toLocaleString()} km</p>
          </div>
        </div>

        {/* HERO: Urgent Maintenance Alert */}
        <UrgentMaintenanceAlert 
          maintenanceStatus={maintenanceStatus}
          onRegisterService={() => setBatchDialogOpen(true)}
        />

        {/* Health Summary - Traffic Light */}
        <VehicleHealthSummary maintenanceStatus={maintenanceStatus} />

        {/* CTA Button - Prominent */}
        <button
          onClick={() => setBatchDialogOpen(true)}
          className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-semibold flex flex-col items-center justify-center gap-1 active:scale-[0.98] transition-transform shadow-lg"
        >
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5" />
            <span>Registrar Servicio de Taller</span>
          </div>
          <span className="text-xs opacity-80 font-normal">Agrupa varios mantenimientos en un paso</span>
        </button>

        {/* Collapsible Maintenance List */}
        <MaintenanceListCollapsible 
          maintenanceStatus={maintenanceStatus}
          onSelectItem={handleSelectMaintenanceItem}
        />

        {/* Recent Records */}
        {records.length > 0 && (
          <section>
            <h2 className="text-base font-semibold mb-3">Historial Reciente</h2>
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

      <BatchMaintenanceDialog
        open={batchDialogOpen}
        onOpenChange={setBatchDialogOpen}
        currentKm={stats.km_totales}
        onConfirm={createBatchMaintenance}
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
