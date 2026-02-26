import { useState } from 'react';
import { GenerateCustodianInvitation } from '@/components/admin/GenerateCustodianInvitation';
import { CustodianInvitationsList } from '@/components/admin/CustodianInvitationsList';
import { BulkInvitationWizard } from '@/components/admin/BulkInvitationWizard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { UserPlus, ListChecks, Upload, Shield, Car } from 'lucide-react';

export type OperativeType = 'custodio' | 'armado';

export const CustodianInvitationsPage = () => {
  const [operativeType, setOperativeType] = useState<OperativeType>('custodio');

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Invitaciones de Operativos</h1>
        <p className="text-muted-foreground mt-2">
          Genera links de registro únicos para nuevos operativos con rol pre-asignado
        </p>
      </div>

      <div className="mb-6">
        <ToggleGroup
          type="single"
          value={operativeType}
          onValueChange={(v) => v && setOperativeType(v as OperativeType)}
          className="justify-start"
        >
          <ToggleGroupItem value="custodio" className="gap-2 px-4">
            <Car className="h-4 w-4" />
            Custodio
          </ToggleGroupItem>
          <ToggleGroupItem value="armado" className="gap-2 px-4">
            <Shield className="h-4 w-4" />
            Armado
          </ToggleGroupItem>
        </ToggleGroup>
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
          <GenerateCustodianInvitation operativeType={operativeType} />
        </TabsContent>
        
        <TabsContent value="bulk">
          <BulkInvitationWizard operativeType={operativeType} />
        </TabsContent>
        
        <TabsContent value="list">
          <CustodianInvitationsList operativeType={operativeType} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CustodianInvitationsPage;
