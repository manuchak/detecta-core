import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GraduationCap, Search, Filter, BookOpen, Clock, AlertTriangle, Award, Trophy, Route } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { CourseCard } from "@/components/lms/CourseCard";
import { CategoryProgressSummary } from "@/components/lms/CategoryProgressSummary";
import { CoursesByCategory } from "@/components/lms/CoursesByCategory";
import { GamificacionWidget } from "@/components/lms/gamificacion/GamificacionWidget";
import { BadgesGrid } from "@/components/lms/gamificacion/BadgesGrid";
import { MisCertificados } from "@/components/lms/certificados/MisCertificados";
import { OnboardingPath } from "@/components/lms/OnboardingPath";
import { useLMSCursosDisponibles, useLMSInscribirse } from "@/hooks/useLMSCursos";
import { useLMSOnboardingStatus } from "@/hooks/lms/useLMSInscripcionMasiva";
import { LMS_CATEGORIAS, LMS_NIVELES } from "@/types/lms";
import type { CursoDisponible } from "@/types/lms";

export default function LMSDashboard() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoriaFilter, setCategoriaFilter] = useState<string>("all");
  const [nivelFilter, setNivelFilter] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  const { data: cursos, isLoading, error } = useLMSCursosDisponibles();
  const { data: onboardingStatus } = useLMSOnboardingStatus();
  const inscribirse = useLMSInscribirse();
  
  const hasOnboarding = onboardingStatus && onboardingStatus.total_obligatorios > 0;
  const onboardingIncomplete = hasOnboarding && onboardingStatus.porcentaje_completado < 100;

  // Cursos del usuario: inscritos + obligatorios sin inscripcion
  const misCursos = cursos?.filter(c => 
    c.inscripcion_id || c.es_obligatorio
  ) || [];

  const cursosEnProgreso = cursos?.filter(c => 
    c.inscripcion_id && 
    c.inscripcion_estado === 'en_progreso'
  ) || [];

  const cursosCompletados = cursos?.filter(c => 
    c.inscripcion_estado === 'completado'
  ) || [];

  // Catalogo: solo cursos NO obligatorios sin inscripcion
  const cursosCatalogo = cursos?.filter(c => !c.inscripcion_id && !c.es_obligatorio) || [];

  // Badge count: en progreso + obligatorios pendientes sin inscripcion
  const misCursosCount = cursosEnProgreso.length + 
    (cursos?.filter(c => c.es_obligatorio && !c.inscripcion_id).length || 0);

  // Aplicar filtros al catálogo
  const cursosFiltrados = cursosCatalogo.filter(curso => {
    const matchSearch = !searchQuery || 
      curso.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      curso.descripcion?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchCategoria = categoriaFilter === "all" || curso.categoria === categoriaFilter;
    const matchNivel = nivelFilter === "all" || curso.nivel === nivelFilter;
    
    return matchSearch && matchCategoria && matchNivel;
  });

  const handleStartCourse = (cursoId: string) => {
    navigate(`/lms/curso/${cursoId}`);
  };

  const handleEnroll = (cursoId: string) => {
    inscribirse.mutate(cursoId, {
      onSuccess: () => {
        // Navegar al curso después de inscribirse
        navigate(`/lms/curso/${cursoId}`);
      }
    });
  };

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>Error al cargar los cursos. Por favor, intenta de nuevo.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <GraduationCap className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Capacitación</h1>
          </div>
          <p className="text-muted-foreground">
            Desarrolla tus habilidades con nuestros cursos
          </p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Resumen de progreso por categoría - SIEMPRE VISIBLE arriba de tabs */}
        {!isLoading && misCursos.length > 0 && (
          <CategoryProgressSummary
            cursos={cursos || []}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
        )}

        {/* Tabs principales */}
        <Tabs defaultValue={onboardingIncomplete ? "mi-onboarding" : "mis-cursos"} className="space-y-6">
          <TabsList className="flex-wrap">
            {hasOnboarding && (
              <TabsTrigger value="mi-onboarding" className="gap-2">
                <Route className="h-4 w-4" />
                Mi Onboarding
                {onboardingIncomplete && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 rounded-full">
                    {onboardingStatus.porcentaje_completado}%
                  </span>
                )}
              </TabsTrigger>
            )}
            <TabsTrigger value="mis-cursos" className="gap-2">
              <BookOpen className="h-4 w-4" />
              Mis Cursos
              {misCursosCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary/20 rounded-full">
                  {misCursosCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="catalogo" className="gap-2">
              <Search className="h-4 w-4" />
              Catálogo
            </TabsTrigger>
            <TabsTrigger value="completados" className="gap-2">
              <Clock className="h-4 w-4" />
              Completados
              {cursosCompletados.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-green-500/20 rounded-full">
                  {cursosCompletados.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="certificados" className="gap-2">
              <Award className="h-4 w-4" />
              Certificados
            </TabsTrigger>
            <TabsTrigger value="logros" className="gap-2">
              <Trophy className="h-4 w-4" />
              Logros
            </TabsTrigger>
          </TabsList>

          {/* Mi Onboarding */}
          {hasOnboarding && (
            <TabsContent value="mi-onboarding" className="space-y-6">
              <OnboardingPath />
            </TabsContent>
          )}

          {/* Mis Cursos (en progreso) */}
          <TabsContent value="mis-cursos" className="space-y-6">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-40 rounded-lg" />
                <Skeleton className="h-60 rounded-lg" />
              </div>
            ) : misCursos.length === 0 ? (
              <div className="text-center py-12 bg-muted/30 rounded-lg">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  No tienes cursos en progreso
                </h3>
                <p className="text-muted-foreground mb-4">
                  Explora el catálogo y comienza a aprender
                </p>
                <Button onClick={() => document.querySelector('[value="catalogo"]')?.dispatchEvent(new Event('click'))}>
                  Ver Catálogo
                </Button>
              </div>
            ) : (
              <>
                {/* Cursos agrupados por categoría */}
                <CoursesByCategory
                  cursos={misCursos}
                  onStartCourse={handleStartCourse}
                  filterCategory={selectedCategory}
                />

                {/* Gamificación */}
                <GamificacionWidget />
              </>
            )}
          </TabsContent>

          {/* Catálogo */}
          <TabsContent value="catalogo" className="space-y-6">
            {/* Filtros */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar cursos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {LMS_CATEGORIAS.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={nivelFilter} onValueChange={setNivelFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Nivel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los niveles</SelectItem>
                  {LMS_NIVELES.map(nivel => (
                    <SelectItem key={nivel.value} value={nivel.value}>{nivel.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Grid de cursos */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <Skeleton key={i} className="h-80 rounded-lg" />
                ))}
              </div>
            ) : cursosFiltrados.length === 0 ? (
              <div className="text-center py-12 bg-muted/30 rounded-lg">
                <Filter className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  No se encontraron cursos
                </h3>
                <p className="text-muted-foreground">
                  Intenta con otros filtros de búsqueda
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {cursosFiltrados.map(curso => (
                  <CourseCard
                    key={curso.id}
                    curso={curso}
                    onStartCourse={handleStartCourse}
                    onEnroll={handleEnroll}
                    isEnrolling={inscribirse.isPending}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Completados */}
          <TabsContent value="completados" className="space-y-6">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-80 rounded-lg" />
                ))}
              </div>
            ) : cursosCompletados.length === 0 ? (
              <div className="text-center py-12 bg-muted/30 rounded-lg">
                <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Aún no has completado ningún curso
                </h3>
                <p className="text-muted-foreground">
                  ¡Comienza tu aprendizaje hoy!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {cursosCompletados.map(curso => (
                  <CourseCard
                    key={curso.id}
                    curso={curso}
                    onStartCourse={handleStartCourse}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Certificados */}
          <TabsContent value="certificados" className="space-y-6">
            <MisCertificados />
          </TabsContent>

          {/* Logros */}
          <TabsContent value="logros" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <GamificacionWidget />
              </div>
              <div className="lg:col-span-2">
                <BadgesGrid />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
