import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, MessageSquarePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCustodianProfile } from "@/hooks/useCustodianProfile";
import { MobileTicketsList } from "@/components/custodian/MobileTicketsList";
import { MobileTicketWizard } from "@/components/custodian/MobileTicketWizard";
import MobileBottomNavNew from "@/components/custodian/MobileBottomNavNew";
import { useCustodianTicketsEnhanced } from "@/hooks/useCustodianTicketsEnhanced";

const CustodianSupportPage = () => {
  const navigate = useNavigate();
  const { profile } = useCustodianProfile();
  const { tickets, loading, refetch } = useCustodianTicketsEnhanced(profile?.phone || '');
  const [showWizard, setShowWizard] = useState(false);

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
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/custodian')} className="p-2 -ml-2 rounded-full hover:bg-muted">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold">Soporte</h1>
        </div>
      </header>

      <main className="px-4 py-4 space-y-6">
        {/* Hero para crear nuevo ticket */}
        <section className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl p-6 border border-primary/10">
          <div className="text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <MessageSquarePlus className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">¿Tienes algún problema?</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Reporta cualquier incidencia y te ayudaremos
              </p>
            </div>
            <Button onClick={() => setShowWizard(true)} className="w-full gap-2">
              <Plus className="w-4 h-4" />
              Crear Nueva Queja
            </Button>
          </div>
        </section>

        {/* Lista de Tickets */}
        <MobileTicketsList 
          tickets={tickets}
          loading={loading}
          custodianPhone={profile?.phone || ''}
          onRefresh={refetch}
        />
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
