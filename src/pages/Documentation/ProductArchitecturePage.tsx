import React, { useState, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Map, 
  Layers, 
  GitBranch, 
  Search, 
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  Users,
  Target,
  Workflow
} from 'lucide-react';
import UnifiedLayout from '@/layouts/UnifiedLayout';
import { ProductMap } from '@/components/documentation/ProductMap';
import { ModuleCard } from '@/components/documentation/ModuleCard';
import { ConnectionsMap } from '@/components/documentation/ConnectionsMap';
import { SwimlaneDiagram } from '@/components/documentation/SwimlaneDiagram';
import { RACIMatrix } from '@/components/documentation/RACIMatrix';
import { SLACompliancePanel } from '@/components/documentation/SLACompliancePanel';
import { productArchitecture, getModuleById } from '@/data/productArchitecture';

// Product Architecture Documentation Center
const ProductArchitecturePage: React.FC = () => {
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('map');
  const moduleRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const modules = Object.values(productArchitecture.modules);

  // Calculate global stats
  const totalPhases = modules.reduce((sum, m) => sum + m.phases.length, 0);
  const completedPhases = modules.reduce(
    (sum, m) => sum + m.phases.filter(p => p.status === 'complete').length, 
    0
  );
  const inProgressPhases = modules.reduce(
    (sum, m) => sum + m.phases.filter(p => p.status === 'in-progress').length, 
    0
  );
  const pendingPhases = totalPhases - completedPhases - inProgressPhases;

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => {
      const newSet = new Set(prev);
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId);
      } else {
        newSet.add(moduleId);
      }
      return newSet;
    });
  };

  const handleModuleClick = (moduleId: string) => {
    setSelectedModule(moduleId);
    setExpandedModules(new Set([moduleId]));
    setActiveTab('modules');
    
    // Scroll to module after tab change
    setTimeout(() => {
      moduleRefs.current[moduleId]?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }, 150);
  };

  // Collect all in-progress and pending phases
  const inProgressItems = modules.flatMap(m => 
    m.phases.filter(p => p.status === 'in-progress').map(p => ({ module: m, phase: p }))
  );
  const pendingItems = modules.flatMap(m => 
    m.phases.filter(p => p.status === 'pending').map(p => ({ module: m, phase: p }))
  );

  // Filter modules based on search
  const filteredModules = modules.filter(module => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      module.name.toLowerCase().includes(query) ||
      module.description.toLowerCase().includes(query) ||
      module.phases.some(p => p.name.toLowerCase().includes(query))
    );
  });

  return (
    <UnifiedLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BookOpen className="text-primary" />
              Arquitectura del Producto
            </h1>
            <p className="text-muted-foreground mt-1">
              Documentación interactiva de módulos, flujos y conexiones del sistema
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <Calendar size={14} />
              v{productArchitecture.version}
            </Badge>
            <Badge variant="secondary">
              Actualizado: {productArchitecture.lastUpdated}
            </Badge>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Layers size={20} className="text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{modules.length}</p>
                  <p className="text-sm text-muted-foreground">Módulos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <CheckCircle2 size={20} className="text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{completedPhases}/{totalPhases}</p>
                  <p className="text-sm text-muted-foreground">Fases Completadas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 rounded-lg">
                  <Clock size={20} className="text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{inProgressPhases}</p>
                  <p className="text-sm text-muted-foreground">En Desarrollo</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-500/10 rounded-lg">
                  <GitBranch size={20} className="text-cyan-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{productArchitecture.globalConnections.length}</p>
                  <p className="text-sm text-muted-foreground">Integraciones</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Development Status Alerts */}
        {(inProgressItems.length > 0 || pendingItems.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* In Progress Alert */}
            {inProgressItems.length > 0 && (
              <Card className="border-amber-500/50 bg-amber-500/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2 text-amber-600">
                    <Clock size={16} />
                    En Desarrollo ({inProgressItems.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {inProgressItems.map(({ module, phase }) => (
                    <button 
                      key={phase.id}
                      onClick={() => handleModuleClick(module.id)}
                      className="flex items-center gap-2 text-sm hover:bg-amber-500/10 p-1 rounded w-full text-left transition-colors"
                    >
                      <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                      <span className="font-medium">{module.shortName}:</span>
                      <span className="text-muted-foreground flex-1">{phase.name}</span>
                      <ArrowRight size={14} className="text-muted-foreground" />
                    </button>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Pending Alert */}
            {pendingItems.length > 0 && (
              <Card className="border-destructive/50 bg-destructive/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2 text-destructive">
                    <AlertCircle size={16} />
                    Pendientes ({pendingItems.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {pendingItems.map(({ module, phase }) => (
                    <button 
                      key={phase.id}
                      onClick={() => handleModuleClick(module.id)}
                      className="flex items-center gap-2 text-sm hover:bg-destructive/10 p-1 rounded w-full text-left transition-colors"
                    >
                      <div className="w-2 h-2 rounded-full bg-destructive" />
                      <span className="font-medium">{module.shortName}:</span>
                      <span className="text-muted-foreground flex-1">{phase.name}</span>
                      <ArrowRight size={14} className="text-muted-foreground" />
                    </button>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <TabsList className="flex-wrap h-auto gap-1">
              <TabsTrigger value="map" className="gap-2">
                <Map size={16} />
                Vista General
              </TabsTrigger>
              <TabsTrigger value="swimlane" className="gap-2">
                <Workflow size={16} />
                Swimlane
              </TabsTrigger>
              <TabsTrigger value="modules" className="gap-2">
                <Layers size={16} />
                Módulos
              </TabsTrigger>
              <TabsTrigger value="raci" className="gap-2">
                <Users size={16} />
                RACI
              </TabsTrigger>
              <TabsTrigger value="sla" className="gap-2">
                <Target size={16} />
                SLAs
              </TabsTrigger>
              <TabsTrigger value="integrations" className="gap-2">
                <GitBranch size={16} />
                Integraciones
              </TabsTrigger>
            </TabsList>

            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Input
                placeholder="Buscar módulo o proceso..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Map View */}
          <TabsContent value="map" className="space-y-6">
            <ProductMap 
              onModuleClick={handleModuleClick}
              selectedModule={selectedModule}
            />
            
            {/* Selected Module Detail */}
            {selectedModule && (
              <div className="animate-fade-in">
                <ModuleCard 
                  module={getModuleById(selectedModule)!}
                  isExpanded={true}
                  onToggle={() => setSelectedModule(null)}
                />
              </div>
            )}
          </TabsContent>

          {/* Modules List View */}
          <TabsContent value="modules" className="space-y-4">
            {filteredModules.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <AlertCircle className="mx-auto text-muted-foreground mb-2" size={32} />
                  <p className="text-muted-foreground">
                    No se encontraron módulos que coincidan con "{searchQuery}"
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredModules.map(module => (
                <div 
                  key={module.id}
                  ref={(el) => { moduleRefs.current[module.id] = el; }}
                >
                  <ModuleCard 
                    module={module}
                    isExpanded={expandedModules.has(module.id)}
                    onToggle={() => toggleModule(module.id)}
                  />
                </div>
              ))
            )}
          </TabsContent>

          {/* Integrations View */}
          <TabsContent value="integrations" className="space-y-6">
            <ConnectionsMap highlightModule={selectedModule} />

            {/* Edge Functions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Edge Functions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {modules
                    .filter(m => m.edgeFunctions && m.edgeFunctions.length > 0)
                    .map(module => (
                      <div key={module.id} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: module.color }}
                          />
                          <span className="text-sm font-medium">{module.shortName}</span>
                        </div>
                        <div className="flex flex-wrap gap-1 pl-4">
                          {module.edgeFunctions!.map(fn => (
                            <Badge key={fn} variant="secondary" className="text-xs font-mono">
                              {fn}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))
                  }
                </div>
              </CardContent>
            </Card>

            {/* Database Tables Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tablas de Base de Datos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {modules
                    .filter(m => m.tables && m.tables.length > 0)
                    .map(module => (
                      <div key={module.id} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: module.color }}
                          />
                          <span className="text-sm font-medium">{module.shortName}</span>
                          <Badge variant="outline" className="text-xs">
                            {module.tables!.length} tablas
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-1 pl-4">
                          {module.tables!.slice(0, 5).map(table => (
                            <Badge key={table} variant="outline" className="text-xs font-mono">
                              {table}
                            </Badge>
                          ))}
                          {module.tables!.length > 5 && (
                            <Badge variant="secondary" className="text-xs">
                              +{module.tables!.length - 5} más
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))
                  }
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </UnifiedLayout>
  );
};

export default ProductArchitecturePage;
