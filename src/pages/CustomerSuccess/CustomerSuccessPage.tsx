import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { HeartHandshake, Plus } from 'lucide-react';
import { CSDashboard } from './components/CSDashboard';
import { CSRetentionDashboard } from './components/CSRetentionDashboard';
import { CSQuejasList } from './components/CSQuejasList';
import { CSClientesList } from './components/CSClientesList';
import { CSCAPAKanban } from './components/CSCAPAKanban';
import { CSMejoraContinua } from './components/CSMejoraContinua';
import { CSQuejaForm } from './components/CSQuejaForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const CustomerSuccessPage = () => {
  const [showNewQueja, setShowNewQueja] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'dashboard';

  const handleTabChange = (value: string) => {
    if (value === 'dashboard') {
      setSearchParams({});
    } else {
      setSearchParams({ tab: value });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <HeartHandshake className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Customer Success</h1>
            <p className="text-muted-foreground text-sm">
              Gestión de quejas, satisfacción y mejora continua · ISO 9001:2015
            </p>
          </div>
        </div>
        <Button onClick={() => setShowNewQueja(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nueva Queja
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="retencion">Retención</TabsTrigger>
          <TabsTrigger value="quejas">Quejas</TabsTrigger>
          <TabsTrigger value="clientes">Clientes</TabsTrigger>
          <TabsTrigger value="capa">CAPA</TabsTrigger>
          <TabsTrigger value="mejora">Mejora Continua</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard"><CSDashboard /></TabsContent>
        <TabsContent value="retencion"><CSRetentionDashboard /></TabsContent>
        <TabsContent value="quejas"><CSQuejasList /></TabsContent>
        <TabsContent value="clientes"><CSClientesList /></TabsContent>
        <TabsContent value="capa"><CSCAPAKanban /></TabsContent>
        <TabsContent value="mejora"><CSMejoraContinua /></TabsContent>
      </Tabs>

      <Dialog open={showNewQueja} onOpenChange={setShowNewQueja}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registrar Nueva Queja</DialogTitle>
          </DialogHeader>
          <CSQuejaForm onSuccess={() => setShowNewQueja(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomerSuccessPage;
