import { useParams, useLocation, useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { 
  User, 
  TrendingUp, 
  DollarSign, 
  ClipboardCheck,
  FileText,
  GraduationCap,
  Shield,
  History,
  Star,
  StickyNote,
  Loader2
} from 'lucide-react';
import { PerfilHeader } from './components/PerfilHeader';
import { InformacionPersonalTab } from './components/tabs/InformacionPersonalTab';
import { PerformanceServiciosTab } from './components/tabs/PerformanceServiciosTab';
import { EconomicsTab } from './components/tabs/EconomicsTab';
import { EvaluacionesTab } from './components/tabs/EvaluacionesTab';
import { ArmadoEvaluacionesTab } from './components/tabs/ArmadoEvaluacionesTab';
import { DocumentacionTab } from './components/tabs/DocumentacionTab';
import { CapacitacionTab } from './components/tabs/CapacitacionTab';
import { HistoricoTab } from './components/tabs/HistoricoTab';
import { CumplimientoTab } from './components/tabs/CumplimientoTab';
import { CalificacionesTab } from './components/tabs/CalificacionesTab';
import { NotasTab } from './components/tabs/NotasTab';
import { useOperativeProfile, type OperativeProfileFull } from './hooks/useOperativeProfile';

export default function PerfilForense() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const tipo = location.pathname.includes('/armado/') ? 'armado' : 'custodio';
  
  const [searchParams, setSearchParams] = useSearchParams();
  const isCustodio = tipo === 'custodio';
  const validArmadoTabs = ['info', 'economics', 'evaluaciones', 'historico', 'notas'];
  const rawTab = searchParams.get('tab') || 'info';
  const activeTab = !isCustodio && !validArmadoTabs.includes(rawTab) ? 'info' : rawTab;
  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value }, { replace: true });
  };

  const { data: profile, isLoading, isError } = useOperativeProfile(id, tipo);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">
              Error al cargar el perfil. El registro puede no existir.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const custodioProfile = tipo === 'custodio' ? profile as OperativeProfileFull : null;
  const candidatoId = custodioProfile?.pc_custodio_id || null;

  return (
    <div className="p-6 space-y-6">
      <PerfilHeader profile={profile} tipo={tipo} isLoading={isLoading} />
      
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="flex flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="info" className="flex items-center gap-1.5">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Información</span>
          </TabsTrigger>
          {isCustodio && (
            <TabsTrigger value="performance" className="flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Performance</span>
            </TabsTrigger>
          )}
          <TabsTrigger value="economics" className="flex items-center gap-1.5">
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">Economics</span>
          </TabsTrigger>
          <TabsTrigger value="evaluaciones" className="flex items-center gap-1.5">
            <ClipboardCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Evaluaciones</span>
          </TabsTrigger>
          {isCustodio && (
            <TabsTrigger value="documentacion" className="flex items-center gap-1.5">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Docs</span>
            </TabsTrigger>
          )}
          {isCustodio && (
            <TabsTrigger value="capacitacion" className="flex items-center gap-1.5">
              <GraduationCap className="h-4 w-4" />
              <span className="hidden sm:inline">LMS</span>
            </TabsTrigger>
          )}
          {isCustodio && (
            <TabsTrigger value="cumplimiento" className="flex items-center gap-1.5">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Cumplimiento</span>
            </TabsTrigger>
          )}
          <TabsTrigger value="historico" className="flex items-center gap-1.5">
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">Histórico</span>
          </TabsTrigger>
          {isCustodio && (
            <TabsTrigger value="calificaciones" className="flex items-center gap-1.5">
              <Star className="h-4 w-4" />
              <span className="hidden sm:inline">Ratings</span>
            </TabsTrigger>
          )}
          <TabsTrigger value="notas" className="flex items-center gap-1.5">
            <StickyNote className="h-4 w-4" />
            <span className="hidden sm:inline">Notas</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="info">
          <InformacionPersonalTab profile={profile} tipo={tipo} />
        </TabsContent>
        
        {isCustodio && (
          <TabsContent value="performance">
            <PerformanceServiciosTab 
              custodioId={id!} 
              nombre={profile.nombre} 
              profile={custodioProfile || undefined}
            />
          </TabsContent>
        )}
        
        <TabsContent value="economics">
          <EconomicsTab nombre={profile.nombre} tipo={tipo} custodioId={id} />
        </TabsContent>
        
        <TabsContent value="evaluaciones">
          {isCustodio ? (
            <EvaluacionesTab 
              candidatoId={candidatoId} 
              candidatoNombre={profile.nombre} 
            />
          ) : (
            <ArmadoEvaluacionesTab 
              armadoId={id!} 
              armadoNombre={profile.nombre}
            />
          )}
        </TabsContent>
        
        {isCustodio && (
          <TabsContent value="documentacion">
            <DocumentacionTab candidatoId={candidatoId} telefono={profile.telefono || null} />
          </TabsContent>
        )}
        
        {isCustodio && (
          <TabsContent value="capacitacion">
            <CapacitacionTab userId={candidatoId} />
          </TabsContent>
        )}
        
        {isCustodio && (
          <TabsContent value="cumplimiento">
            <CumplimientoTab 
              custodioId={id!} 
              telefono={profile.telefono || null}
              nombre={profile.nombre}
            />
          </TabsContent>
        )}
        
        <TabsContent value="historico">
          <HistoricoTab 
            custodioId={id!} 
            nombre={profile.nombre} 
            telefono={profile.telefono || undefined}
          />
        </TabsContent>
        
        {isCustodio && (
          <TabsContent value="calificaciones">
            <CalificacionesTab
              custodioId={id!}
              nombre={profile.nombre}
              telefono={profile.telefono || null}
              profile={custodioProfile || undefined}
            />
          </TabsContent>
        )}
        
        <TabsContent value="notas">
          <NotasTab operativoId={id!} operativoTipo={tipo} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
