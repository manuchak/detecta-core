import { useParams, useLocation } from 'react-router-dom';
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
import { DocumentacionTab } from './components/tabs/DocumentacionTab';
import { CapacitacionTab } from './components/tabs/CapacitacionTab';
import { useOperativeProfile, type OperativeProfileFull } from './hooks/useOperativeProfile';

export default function PerfilForense() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const tipo = location.pathname.includes('/armado/') ? 'armado' : 'custodio';
  
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

  const PlaceholderTab = ({ icon: Icon, title }: { icon: any; title: string }) => (
    <Card>
      <CardContent className="text-center py-12 text-muted-foreground">
        <Icon className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>{title} en desarrollo</p>
        <p className="text-sm mt-2">Esta sección estará disponible próximamente</p>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6 space-y-6">
      <PerfilHeader profile={profile} tipo={tipo} isLoading={isLoading} />
      
      <Tabs defaultValue="info" className="space-y-6">
        <TabsList className="flex flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="info" className="flex items-center gap-1.5">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Información</span>
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Performance</span>
          </TabsTrigger>
          <TabsTrigger value="economics" className="flex items-center gap-1.5">
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">Economics</span>
          </TabsTrigger>
          <TabsTrigger value="evaluaciones" className="flex items-center gap-1.5">
            <ClipboardCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Evaluaciones</span>
          </TabsTrigger>
          <TabsTrigger value="documentacion" className="flex items-center gap-1.5">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Docs</span>
          </TabsTrigger>
          <TabsTrigger value="capacitacion" className="flex items-center gap-1.5">
            <GraduationCap className="h-4 w-4" />
            <span className="hidden sm:inline">LMS</span>
          </TabsTrigger>
          <TabsTrigger value="cumplimiento" className="flex items-center gap-1.5">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Cumplimiento</span>
          </TabsTrigger>
          <TabsTrigger value="historico" className="flex items-center gap-1.5">
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">Histórico</span>
          </TabsTrigger>
          <TabsTrigger value="calificaciones" className="flex items-center gap-1.5">
            <Star className="h-4 w-4" />
            <span className="hidden sm:inline">Ratings</span>
          </TabsTrigger>
          <TabsTrigger value="notas" className="flex items-center gap-1.5">
            <StickyNote className="h-4 w-4" />
            <span className="hidden sm:inline">Notas</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="info">
          <InformacionPersonalTab profile={profile} tipo={tipo} />
        </TabsContent>
        
        <TabsContent value="performance">
          <PerformanceServiciosTab 
            custodioId={id!} 
            nombre={profile.nombre} 
            telefono={profile.telefono}
            profile={custodioProfile || undefined}
          />
        </TabsContent>
        
        <TabsContent value="economics">
          <EconomicsTab custodioId={id!} tipo={tipo} />
        </TabsContent>
        
        <TabsContent value="evaluaciones">
          <EvaluacionesTab 
            candidatoId={candidatoId} 
            candidatoNombre={profile.nombre} 
          />
        </TabsContent>
        
        <TabsContent value="documentacion">
          <DocumentacionTab candidatoId={candidatoId} />
        </TabsContent>
        
        <TabsContent value="capacitacion">
          <CapacitacionTab userId={candidatoId} />
        </TabsContent>
        
        <TabsContent value="cumplimiento">
          <PlaceholderTab icon={Shield} title="Cumplimiento y Vencimientos" />
        </TabsContent>
        
        <TabsContent value="historico">
          <PlaceholderTab icon={History} title="Histórico de Actividad" />
        </TabsContent>
        
        <TabsContent value="calificaciones">
          <PlaceholderTab icon={Star} title="Calificaciones de Servicios" />
        </TabsContent>
        
        <TabsContent value="notas">
          <PlaceholderTab icon={StickyNote} title="Notas Internas" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
