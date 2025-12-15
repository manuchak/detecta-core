import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Ticket, AlertTriangle, Clock, CheckCircle, X, Plus, List } from 'lucide-react';
import { useCustodianProfile } from '@/hooks/useCustodianProfile';
import { useCustodianTicketsEnhanced, CustodianTicket } from '@/hooks/useCustodianTicketsEnhanced';
import { CreateCustodianTicketForm } from '@/components/custodian/CreateCustodianTicketForm';
import { CustodianTicketsList } from '@/components/custodian/CustodianTicketsList';
import { CustodianTicketDetail } from '@/components/custodian/CustodianTicketDetail';
import { MobileTicketWizard } from '@/components/custodian/MobileTicketWizard';
import { MobileTicketsList } from '@/components/custodian/MobileTicketsList';
import { MobileBottomNav } from '@/components/custodian/MobileBottomNav';
import { useIsMobile } from '@/hooks/use-mobile';

type MobileView = 'home' | 'create' | 'list';

const CustodianTickets = () => {
  const { profile } = useCustodianProfile();
  const custodianPhone = profile?.phone || '';
  const { tickets, stats, loading, refetch } = useCustodianTicketsEnhanced(custodianPhone);
  const isMobile = useIsMobile();
  
  // Desktop state
  const [activeTab, setActiveTab] = useState<'create' | 'list'>('list');
  const [selectedTicket, setSelectedTicket] = useState<CustodianTicket | null>(null);

  // Mobile state
  const [mobileView, setMobileView] = useState<MobileView>('home');

  const handleTicketCreated = () => {
    setActiveTab('list');
    setMobileView('list');
    refetch();
  };

  const handleSelectTicket = (ticket: CustodianTicket) => {
    setSelectedTicket(ticket);
  };

  const handleBackToList = () => {
    setSelectedTicket(null);
    refetch();
  };

  const pendingCount = tickets.filter(t => ['abierto', 'en_progreso'].includes(t.status)).length;

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="min-h-screen bg-background pb-24">
        {/* Mobile Home View */}
        {mobileView === 'home' && (
          <div className="p-4 space-y-6">
            {/* Header */}
            <div className="pt-4">
              <h1 className="text-2xl font-bold text-foreground">Centro de Ayuda</h1>
              <p className="text-muted-foreground">¿En qué podemos ayudarte?</p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                icon={<AlertTriangle className="w-5 h-5 text-amber-500" />}
                label="Pendientes"
                value={stats.abiertos + stats.en_progreso}
              />
              <StatCard
                icon={<CheckCircle className="w-5 h-5 text-green-500" />}
                label="Resueltos"
                value={stats.resueltos}
              />
            </div>

            {/* Quick Actions */}
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">Acciones rápidas</h2>
              
              <button
                onClick={() => setMobileView('create')}
                className="w-full bg-primary text-primary-foreground p-5 rounded-2xl flex items-center gap-4 active:scale-[0.98] transition-transform touch-manipulation"
              >
                <div className="w-12 h-12 bg-primary-foreground/20 rounded-xl flex items-center justify-center">
                  <Plus className="w-7 h-7" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-lg">Reportar un Problema</p>
                  <p className="text-primary-foreground/80 text-sm">Crea una nueva queja</p>
                </div>
              </button>

              <button
                onClick={() => setMobileView('list')}
                className="w-full bg-card border border-border p-5 rounded-2xl flex items-center gap-4 active:scale-[0.98] transition-transform touch-manipulation"
              >
                <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center relative">
                  <List className="w-6 h-6 text-foreground" />
                  {pendingCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs font-bold rounded-full flex items-center justify-center">
                      {pendingCount}
                    </span>
                  )}
                </div>
                <div className="text-left">
                  <p className="font-semibold text-lg text-foreground">Mis Quejas</p>
                  <p className="text-muted-foreground text-sm">
                    {tickets.length === 0 ? 'Sin quejas' : `${tickets.length} quejas registradas`}
                  </p>
                </div>
              </button>
            </div>

            {/* Recent tickets preview */}
            {tickets.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-lg font-semibold text-foreground">Recientes</h2>
                {tickets.slice(0, 3).map(ticket => (
                  <MiniTicketCard
                    key={ticket.id}
                    ticket={ticket}
                    onClick={() => {
                      setSelectedTicket(ticket);
                      setMobileView('list');
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Mobile Create View */}
        {mobileView === 'create' && (
          <MobileTicketWizard
            custodianPhone={custodianPhone}
            onSuccess={() => {
              setMobileView('list');
              refetch();
            }}
            onCancel={() => setMobileView('home')}
          />
        )}

        {/* Mobile List View */}
        {mobileView === 'list' && (
          selectedTicket ? (
            <CustodianTicketDetail
              ticket={selectedTicket}
              custodianPhone={custodianPhone}
              onBack={() => {
                setSelectedTicket(null);
                refetch();
              }}
            />
          ) : (
            <MobileTicketsList
              tickets={tickets}
              loading={loading}
              custodianPhone={custodianPhone}
              onRefresh={refetch}
            />
          )
        )}

        {/* Bottom Navigation */}
        <MobileBottomNav
          activeItem={mobileView}
          onNavigate={(item) => {
            setSelectedTicket(null);
            setMobileView(item);
          }}
          pendingCount={pendingCount}
        />
      </div>
    );
  }

  // Desktop Layout (original)
  if (selectedTicket) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <CustodianTicketDetail
            ticket={selectedTicket}
            custodianPhone={custodianPhone}
            onBack={handleBackToList}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Centro de Atención</h1>
            <p className="text-muted-foreground">Gestiona tus tickets y solicitudes de soporte</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Ticket className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Abiertos</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.abiertos}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En Progreso</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.en_progreso}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resueltos</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.resueltos}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">SLA Vencido</CardTitle>
              <X className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats.sla_vencidos}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'create' | 'list')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="list" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              Mis Tickets
            </TabsTrigger>
            <TabsTrigger value="create" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nuevo Ticket
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="mt-6">
            <CustodianTicketsList
              tickets={tickets}
              loading={loading}
              onSelectTicket={handleSelectTicket}
            />
          </TabsContent>

          <TabsContent value="create" className="mt-6">
            <CreateCustodianTicketForm
              custodianPhone={custodianPhone}
              onSuccess={handleTicketCreated}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// Helper components for mobile
interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
}

const StatCard = ({ icon, label, value }: StatCardProps) => (
  <div className="bg-card border border-border rounded-xl p-4">
    <div className="flex items-center gap-2 mb-1">
      {icon}
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
    <p className="text-2xl font-bold text-foreground">{value}</p>
  </div>
);

interface MiniTicketCardProps {
  ticket: CustodianTicket;
  onClick: () => void;
}

const MiniTicketCard = ({ ticket, onClick }: MiniTicketCardProps) => {
  const statusEmoji: Record<string, string> = {
    abierto: '🟡',
    en_progreso: '🔵',
    resuelto: '🟢',
    cerrado: '⚪',
  };

  return (
    <button
      onClick={onClick}
      className="w-full bg-card border border-border rounded-xl p-3 flex items-center gap-3 text-left active:scale-[0.98] transition-transform touch-manipulation"
    >
      <span className="text-xl">{statusEmoji[ticket.status] || '🟡'}</span>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground truncate">{ticket.categoria?.nombre || 'Sin categoría'}</p>
        <p className="text-sm text-muted-foreground truncate">{ticket.subject}</p>
      </div>
    </button>
  );
};

export default CustodianTickets;
