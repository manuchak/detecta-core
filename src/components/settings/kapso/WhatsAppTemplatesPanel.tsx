import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  Search, 
  RefreshCw, 
  Database, 
  Truck, 
  ClipboardCheck, 
  Ticket, 
  UserPlus, 
  Brain, 
  GraduationCap, 
  Target, 
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  CircleDot,
  AlertTriangle,
  Download
} from 'lucide-react';
import { useWhatsAppTemplatesAdmin } from '@/hooks/useWhatsAppTemplatesAdmin';
import { TEMPLATE_CATEGORIES, WhatsAppTemplateRecord, MetaApprovalStatus, TemplateCategoryKey } from '@/types/kapso';
import { TemplateCard } from './TemplateCard';
import { TemplateTestDialog } from './TemplateTestDialog';
import { TemplateExportDialog } from './TemplateExportDialog';

const categoryIcons: Record<TemplateCategoryKey, React.ReactNode> = {
  servicios: <Truck className="h-4 w-4" />,
  checklist: <ClipboardCheck className="h-4 w-4" />,
  tickets: <Ticket className="h-4 w-4" />,
  onboarding: <UserPlus className="h-4 w-4" />,
  siercp: <Brain className="h-4 w-4" />,
  lms: <GraduationCap className="h-4 w-4" />,
  leads: <Target className="h-4 w-4" />,
  supply: <Users className="h-4 w-4" />
};

const EXPECTED_TEMPLATE_COUNT = 34;
const VALID_CATEGORIES = ['servicios', 'checklist', 'tickets', 'onboarding', 'siercp', 'lms', 'leads', 'supply'];

export const WhatsAppTemplatesPanel = () => {
  const {
    templates,
    isLoading,
    refetch,
    templatesByCategory,
    statusCounts,
    seedTemplates,
    isSeedingTemplates,
    reseedTemplates,
    isReseedingTemplates,
    updateStatus,
    sendTest,
    isSendingTest
  } = useWhatsAppTemplatesAdmin();

  // Check if templates use legacy categories
  const hasLegacyCategories = useMemo(() => {
    if (templates.length === 0) return false;
    const templatesWithValidCategories = templates.filter(t => 
      VALID_CATEGORIES.includes(t.category)
    );
    return templatesWithValidCategories.length === 0 || templates.length !== EXPECTED_TEMPLATE_COUNT;
  }, [templates]);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<MetaApprovalStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<TemplateCategoryKey | 'all'>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<WhatsAppTemplateRecord | null>(null);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  // Filter templates
  const filteredTemplates = useMemo(() => {
    return templates.filter(t => {
      const matchesSearch = search === '' || 
        t.name.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || t.meta_status === statusFilter;
      const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [templates, search, statusFilter, categoryFilter]);

  // Group filtered templates by category
  const filteredByCategory = useMemo(() => {
    const grouped: Record<TemplateCategoryKey, WhatsAppTemplateRecord[]> = {
      servicios: [],
      checklist: [],
      tickets: [],
      onboarding: [],
      siercp: [],
      lms: [],
      leads: [],
      supply: []
    };

    filteredTemplates.forEach(template => {
      const cat = template.category as TemplateCategoryKey;
      if (grouped[cat]) {
        grouped[cat].push(template);
      }
    });

    return grouped;
  }, [filteredTemplates]);

  const handleTest = (template: WhatsAppTemplateRecord) => {
    setSelectedTemplate(template);
    setTestDialogOpen(true);
  };

  const handleSendTest = async (phone: string, variables: Record<string, string>) => {
    if (!selectedTemplate) return;
    await sendTest({
      templateName: selectedTemplate.name,
      phone,
      variables
    });
  };

  // Show seed button if no templates
  if (!isLoading && templates.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Inicializar Templates
          </CardTitle>
          <CardDescription>
            No hay templates en la base de datos. Haz clic para crear los 34 templates predefinidos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => seedTemplates()}
            disabled={isSeedingTemplates}
            className="w-full"
          >
            {isSeedingTemplates ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Creando templates...
              </>
            ) : (
              <>
                <Database className="h-4 w-4 mr-2" />
                Crear 34 Templates
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Show reseed banner if legacy categories detected
  const LegacyCategoriesBanner = () => {
    if (!hasLegacyCategories) return null;

    return (
      <Card className="border-amber-500/50 bg-amber-500/10">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-3 flex-1">
              <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
              <div>
                <p className="font-medium text-amber-700 dark:text-amber-400">
                  Esquema de templates desactualizado
                </p>
                <p className="text-sm text-muted-foreground">
                  Se detectaron {templates.length} templates con categorías antiguas. 
                  Reinicializa para usar los 34 templates actuales.
                </p>
              </div>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="border-amber-500/50 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20"
                  disabled={isReseedingTemplates}
                >
                  {isReseedingTemplates ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Reinicializando...
                    </>
                  ) : (
                    <>
                      <Database className="h-4 w-4 mr-2" />
                      Reinicializar 34 Templates
                    </>
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Reinicializar todos los templates?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción eliminará los {templates.length} templates actuales y creará 
                    los 34 templates del nuevo esquema con las categorías correctas.
                    <br /><br />
                    <strong>Esta acción no se puede deshacer.</strong>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={() => reseedTemplates()}
                    className="bg-amber-600 hover:bg-amber-700"
                  >
                    Sí, reinicializar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Legacy Categories Banner */}
      <LegacyCategoriesBanner />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card className="p-3">
          <div className="text-2xl font-bold">{statusCounts.total}</div>
          <div className="text-xs text-muted-foreground">Total</div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-1">
            <CircleDot className="h-4 w-4 text-muted-foreground" />
            <span className="text-2xl font-bold">{statusCounts.not_submitted}</span>
          </div>
          <div className="text-xs text-muted-foreground">Sin enviar</div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4 text-amber-500" />
            <span className="text-2xl font-bold">{statusCounts.pending}</span>
          </div>
          <div className="text-xs text-muted-foreground">Pendientes</div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4 text-success" />
            <span className="text-2xl font-bold">{statusCounts.approved}</span>
          </div>
          <div className="text-xs text-muted-foreground">Aprobados</div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-1">
            <XCircle className="h-4 w-4 text-destructive" />
            <span className="text-2xl font-bold">{statusCounts.rejected}</span>
          </div>
          <div className="text-xs text-muted-foreground">Rechazados</div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar template..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as any)}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {(Object.entries(TEMPLATE_CATEGORIES) as [TemplateCategoryKey, typeof TEMPLATE_CATEGORIES[TemplateCategoryKey]][]).map(([key, cat]) => (
                  <SelectItem key={key} value={key}>
                    {cat.label} ({cat.count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="not_submitted">Sin enviar</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="approved">Aprobado</SelectItem>
                <SelectItem value="rejected">Rechazado</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={() => setExportDialogOpen(true)}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>

            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Templates by Category */}
      {isLoading ? (
        <Card className="p-8">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Cargando templates...
          </div>
        </Card>
      ) : (
        <Accordion type="multiple" defaultValue={Object.keys(TEMPLATE_CATEGORIES)} className="space-y-2">
          {(Object.entries(TEMPLATE_CATEGORIES) as [TemplateCategoryKey, typeof TEMPLATE_CATEGORIES[TemplateCategoryKey]][]).map(([key, category]) => {
            const categoryTemplates = filteredByCategory[key] || [];
            const approvedCount = categoryTemplates.filter(t => t.meta_status === 'approved').length;
            
            if (categoryFilter !== 'all' && categoryFilter !== key) return null;
            if (categoryTemplates.length === 0 && search) return null;

            return (
              <AccordionItem key={key} value={key} className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline py-3">
                <div className="flex items-center gap-3 flex-1">
                  <div className="p-2 bg-muted rounded-lg">
                    {categoryIcons[key]}
                  </div>
                  <div className="flex-1 text-left">
                    <span className="font-medium">{category.label}</span>
                  </div>
                  <div className="flex items-center gap-2 mr-4">
                      <Badge variant="secondary" className="text-xs">
                        {categoryTemplates.length}/{category.count}
                      </Badge>
                      {approvedCount > 0 && (
                        <Badge variant="outline" className="text-xs bg-success/10 text-success border-success/30">
                          {approvedCount} aprobados
                        </Badge>
                      )}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <div className="space-y-2">
                    {categoryTemplates.length > 0 ? (
                      categoryTemplates.map(template => (
                        <TemplateCard
                          key={template.id}
                          template={template}
                          onTest={handleTest}
                          onUpdateStatus={(name, status) => updateStatus({ templateName: name, status })}
                        />
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No hay templates en esta categoría
                      </p>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}

      {/* Test Dialog */}
      <TemplateTestDialog
        open={testDialogOpen}
        onOpenChange={setTestDialogOpen}
        template={selectedTemplate}
        onSend={handleSendTest}
        isSending={isSendingTest}
      />

      {/* Export Dialog */}
      <TemplateExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
      />
    </div>
  );
};
