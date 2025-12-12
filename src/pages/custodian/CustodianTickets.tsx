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

const CustodianTickets = () => {
  const { profile } = useCustodianProfile();
  const custodianPhone = profile?.phone || '';
  const { tickets, stats, loading, refetch } = useCustodianTicketsEnhanced(custodianPhone);
  
  const [activeTab, setActiveTab] = useState<'create' | 'list'>('list');
  const [selectedTicket, setSelectedTicket] = useState<CustodianTicket | null>(null);

  const handleTicketCreated = () => {
    setActiveTab('list');
    refetch();
  };

  const handleSelectTicket = (ticket: CustodianTicket) => {
    setSelectedTicket(ticket);
  };

  const handleBackToList = () => {
    setSelectedTicket(null);
    refetch();
  };

  // If viewing a ticket detail
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

export default CustodianTickets;
