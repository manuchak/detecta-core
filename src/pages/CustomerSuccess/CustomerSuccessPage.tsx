import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { HeartHandshake, Plus } from 'lucide-react';
import { CSPanorama } from './components/CSPanorama';
import { CSCartera } from './components/CSCartera';
import { CSOperativo } from './components/CSOperativo';
import { CSQuejaForm } from './components/CSQuejaForm';
import { ClientAnalytics } from '@/components/executive/ClientAnalytics';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const CustomerSuccessPage = () => {
  const [showNewQueja, setShowNewQueja] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'panorama';

  const handleTabChange = (value: string) => {
    if (value === 'panorama') {
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
              Gestión de cartera, satisfacción y mejora continua · ISO 9001:2015
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
          <TabsTrigger value="panorama">Panorama</TabsTrigger>
          <TabsTrigger value="cartera">Cartera</TabsTrigger>
          <TabsTrigger value="operativo">Operativo</TabsTrigger>
          <TabsTrigger value="analisis">Análisis Clientes</TabsTrigger>
        </TabsList>

        <TabsContent value="panorama"><CSPanorama /></TabsContent>
        <TabsContent value="cartera"><CSCartera /></TabsContent>
        <TabsContent value="operativo"><CSOperativo /></TabsContent>
        <TabsContent value="analisis"><ClientAnalytics /></TabsContent>
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
