import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CSQuejasList } from './CSQuejasList';
import { CSCAPAKanban } from './CSCAPAKanban';
import { CSMejoraContinua } from './CSMejoraContinua';
import { CSNPSSurvey } from './CSNPSSurvey';
import { CSExportButton } from './CSExportButton';

export function CSOperativo() {
  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-2">
        <div />
        <CSExportButton />
      </div>
      <Tabs defaultValue="quejas" className="w-full">
        <TabsList>
          <TabsTrigger value="quejas">Quejas</TabsTrigger>
          <TabsTrigger value="capa">CAPA</TabsTrigger>
          <TabsTrigger value="nps">NPS</TabsTrigger>
          <TabsTrigger value="mejora">Mejora Continua</TabsTrigger>
        </TabsList>

        <TabsContent value="quejas"><CSQuejasList /></TabsContent>
        <TabsContent value="capa"><CSCAPAKanban /></TabsContent>
        <TabsContent value="nps"><CSNPSSurvey /></TabsContent>
        <TabsContent value="mejora"><CSMejoraContinua /></TabsContent>
      </Tabs>
    </div>
  );
}
