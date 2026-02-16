import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CSQuejasList } from './CSQuejasList';
import { CSCAPAKanban } from './CSCAPAKanban';
import { CSMejoraContinua } from './CSMejoraContinua';
import { CSNPSSurvey } from './CSNPSSurvey';
import { CSNPSCampaign } from './CSNPSCampaign';
import { CSCSATSurveys } from './CSCSATSurveys';
import { CSExportButton } from './CSExportButton';
import { CSTouchpointsList } from './CSTouchpointsList';
import { CSClienteProfileModal } from './CSClienteProfileModal';
import { useState } from 'react';

export function CSOperativo() {
  const [searchParams] = useSearchParams();
  const subtab = searchParams.get('subtab') || 'quejas';
  const [selectedClienteId, setSelectedClienteId] = useState<string | null>(null);

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-2">
        <div />
        <CSExportButton />
      </div>
      <Tabs defaultValue={subtab} className="w-full">
        <TabsList>
          <TabsTrigger value="quejas">Quejas</TabsTrigger>
          <TabsTrigger value="touchpoints">Touchpoints</TabsTrigger>
          <TabsTrigger value="capa">CAPA</TabsTrigger>
          <TabsTrigger value="nps">NPS</TabsTrigger>
          <TabsTrigger value="campanas">Campañas NPS</TabsTrigger>
          <TabsTrigger value="csat">CSAT</TabsTrigger>
          <TabsTrigger value="mejora">Mejora Continua</TabsTrigger>
        </TabsList>

        <TabsContent value="quejas"><CSQuejasList /></TabsContent>
        <TabsContent value="touchpoints">
          <CSTouchpointsList
            onClienteClick={id => setSelectedClienteId(id)}
            initialTab={searchParams.get('tpTab') || undefined}
          />
        </TabsContent>
        <TabsContent value="capa"><CSCAPAKanban /></TabsContent>
        <TabsContent value="nps"><CSNPSSurvey /></TabsContent>
        <TabsContent value="campanas"><CSNPSCampaign /></TabsContent>
        <TabsContent value="csat"><CSCSATSurveys /></TabsContent>
        <TabsContent value="mejora"><CSMejoraContinua /></TabsContent>
      </Tabs>

      <CSClienteProfileModal
        clienteId={selectedClienteId}
        onClose={() => setSelectedClienteId(null)}
        defaultTab="touchpoints"
      />
    </div>
  );
}
