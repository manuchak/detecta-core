import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Scale, FileText, GitBranch, ShieldCheck, BookOpen } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TemplatesList from './components/TemplatesList';
import TemplateVersionHistory from './components/TemplateVersionHistory';
import ComplianceChecklist from './components/ComplianceChecklist';
import VariablesCatalog from './components/VariablesCatalog';

const LegalHub = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'plantillas';

  const handleTabChange = (value: string) => {
    if (value === 'plantillas') {
      searchParams.delete('tab');
    } else {
      searchParams.set('tab', value);
    }
    setSearchParams(searchParams, { replace: true });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Scale className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Centro Legal</h1>
          <p className="text-muted-foreground text-sm">
            Gestión centralizada de plantillas, versionamiento y compliance de documentos legales
          </p>
        </div>
      </div>

      <Tabs value={currentTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="plantillas" className="gap-1.5">
            <FileText className="h-4 w-4" /> Plantillas
          </TabsTrigger>
          <TabsTrigger value="versiones" className="gap-1.5">
            <GitBranch className="h-4 w-4" /> Versiones
          </TabsTrigger>
          <TabsTrigger value="compliance" className="gap-1.5">
            <ShieldCheck className="h-4 w-4" /> Compliance
          </TabsTrigger>
          <TabsTrigger value="variables" className="gap-1.5">
            <BookOpen className="h-4 w-4" /> Variables
          </TabsTrigger>
        </TabsList>

        <TabsContent value="plantillas">
          <TemplatesList />
        </TabsContent>
        <TabsContent value="versiones">
          <TemplateVersionHistory />
        </TabsContent>
        <TabsContent value="compliance">
          <ComplianceChecklist />
        </TabsContent>
        <TabsContent value="variables">
          <VariablesCatalog />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LegalHub;
