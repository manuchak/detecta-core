import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCustodianProfile } from "@/hooks/useCustodianProfile";
import { useCustodioIndisponibilidades } from "@/hooks/useCustodioIndisponibilidades";
import { useToast } from "@/hooks/use-toast";
import ReportUnavailabilityCard from "@/components/custodian/ReportUnavailabilityCard";
import { MobileTicketsList } from "@/components/custodian/MobileTicketsList";
import { MobileTicketWizard } from "@/components/custodian/MobileTicketWizard";
import MobileBottomNavNew from "@/components/custodian/MobileBottomNavNew";
import { useCustodianTicketsEnhanced } from "@/hooks/useCustodianTicketsEnhanced";

const CustodianSupportPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile } = useCustodianProfile();
  const { tickets, loading, refetch } = useCustodianTicketsEnhanced(profile?.phone || '');
  const { crearIndisponibilidad } = useCustodioIndisponibilidades();
  const [showWizard, setShowWizard] = useState(false);

  const handleReportUnavailability = async (data: { tipo: string; motivo?: string; dias: number | null }) => {
    try {
      const fechaFin = data.dias 
        ? new Date(Date.now() + data.dias * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        : undefined;

      await crearIndisponibilidad.mutateAsync({
        custodio_id: profile?.id || '',
        tipo_indisponibilidad: data.tipo as any,
        motivo: data.motivo || '',
        fecha_fin_estimada: fechaFin,
      });

      toast({
        title: '✅ Indisponibilidad reportada',
        description: 'El equipo de planeación ha sido notificado',
      });
      return true;
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo reportar la indisponibilidad',
        variant: 'destructive',
      });
      return false;
    }
  };

  if (showWizard) {
    return (
      <MobileTicketWizard 
        custodianPhone={profile?.phone || ''} 
        onSuccess={() => {
          setShowWizard(false);
          refetch();
        }}
        onCancel={() => setShowWizard(false)} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/custodian')} className="p-2 -ml-2 rounded-full hover:bg-muted">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold">Soporte</h1>
          </div>
          <Button size="sm" onClick={() => setShowWizard(true)} className="gap-1">
            <Plus className="w-4 h-4" />
            Nueva Queja
          </Button>
        </div>
      </header>

      <main className="px-4 py-4 space-y-6">
        {/* Report Unavailability */}
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
            Estado de disponibilidad
          </h2>
          <ReportUnavailabilityCard onReportUnavailability={handleReportUnavailability} />
        </section>

        {/* Tickets */}
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
            Mis Tickets
          </h2>
          <MobileTicketsList 
            tickets={tickets}
            loading={loading}
            custodianPhone={profile?.phone || ''}
            onRefresh={refetch}
          />
        </section>
      </main>

      <MobileBottomNavNew activeItem="support" onNavigate={(item) => {
        if (item === 'home') navigate('/custodian');
        else if (item === 'services') navigate('/custodian/services');
        else if (item === 'vehicle') navigate('/custodian/vehicle');
      }} />
    </div>
  );
};

export default CustodianSupportPage;
