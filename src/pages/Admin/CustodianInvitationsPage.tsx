import { GenerateCustodianInvitation } from '@/components/admin/GenerateCustodianInvitation';
import { CustodianInvitationsList } from '@/components/admin/CustodianInvitationsList';
import { BulkInvitationWizard } from '@/components/admin/BulkInvitationWizard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserPlus, ListChecks, Upload } from 'lucide-react';

export const CustodianInvitationsPage = () => {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Invitaciones de Custodios</h1>
        <p className="text-muted-foreground mt-2">
          Genera links de registro únicos para nuevos custodios con rol pre-asignado
        </p>
      </div>
      
      <Tabs defaultValue="generate" className="space-y-6">
        <TabsList>
          <TabsTrigger value="generate" className="gap-2">
            <UserPlus className="h-4 w-4" />
            Individual
          </TabsTrigger>
          <TabsTrigger value="bulk" className="gap-2">
            <Upload className="h-4 w-4" />
            Masivo
          </TabsTrigger>
          <TabsTrigger value="list" className="gap-2">
            <ListChecks className="h-4 w-4" />
            Historial
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="generate" className="flex justify-center">
          <GenerateCustodianInvitation />
        </TabsContent>
        
        <TabsContent value="bulk">
          <BulkInvitationWizard />
        </TabsContent>
        
        <TabsContent value="list">
          <CustodianInvitationsList />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CustodianInvitationsPage;
