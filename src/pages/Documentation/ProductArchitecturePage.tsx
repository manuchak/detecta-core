import React, { useState } from 'react';
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
  AlertCircle
} from 'lucide-react';
import UnifiedLayout from '@/layouts/UnifiedLayout';
import { ProductMap } from '@/components/documentation/ProductMap';
import { ModuleCard } from '@/components/documentation/ModuleCard';
import { ConnectionsMap } from '@/components/documentation/ConnectionsMap';
import { productArchitecture, getModuleById } from '@/data/productArchitecture';

const ProductArchitecturePage: React.FC = () => {
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

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
  };

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

        {/* Main Content Tabs */}
        <Tabs defaultValue="map" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <TabsList>
              <TabsTrigger value="map" className="gap-2">
                <Map size={16} />
                Vista General
              </TabsTrigger>
              <TabsTrigger value="modules" className="gap-2">
                <Layers size={16} />
                Módulos
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
                <ModuleCard 
                  key={module.id}
                  module={module}
                  isExpanded={expandedModules.has(module.id)}
                  onToggle={() => toggleModule(module.id)}
                />
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
