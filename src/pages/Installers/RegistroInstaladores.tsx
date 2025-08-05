import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Users, 
  Plus, 
  Search, 
  Filter,
  UserPlus,
  FileText,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  Eye
} from 'lucide-react';
import { useInstaladorData } from '@/hooks/useInstaladorData';
import { InstaladorCard } from './components/InstaladorCard';
import { RegistroInstaladorFormularioRobusto } from './components/RegistroInstaladorFormularioRobusto';
import { DatosFiscalesDialog } from './components/DatosFiscalesDialog';
import { PagosInstaladorDialog } from './components/PagosInstaladorDialog';
import { AuditoriaDialog } from './components/AuditoriaDialog';

export const RegistroInstaladores = () => {
  const { instaladores, loading } = useInstaladorData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('todos');
  const [showRegistroDialog, setShowRegistroDialog] = useState(false);
  const [showDatosFiscalesDialog, setShowDatosFiscalesDialog] = useState(false);
  const [showPagosDialog, setShowPagosDialog] = useState(false);
  const [showAuditoriaDialog, setShowAuditoriaDialog] = useState(false);
  const [selectedInstalador, setSelectedInstalador] = useState<any>(null);

  // Filtrar instaladores
  const filteredInstaladores = instaladores.filter(instalador => {
    const matchesSearch = instalador.nombre_completo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         instalador.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         instalador.codigo_instalador?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === 'todos' || 
                         (selectedStatus === 'activo' && instalador.activo) ||
                         (selectedStatus === 'inactivo' && !instalador.activo);

    return matchesSearch && matchesStatus;
  });

  // Métricas
  const totalInstaladores = instaladores.length;
  const instaladoresActivos = instaladores.filter(i => i.activo).length;
  const instaladoresInactivos = instaladores.filter(i => !i.activo).length;
  const promedioCalificacion = instaladores.length > 0 
    ? instaladores.reduce((sum, i) => sum + (i.calificacion_promedio || 0), 0) / instaladores.length 
    : 0;

  const handleOpenDatosFiscales = (instalador: any) => {
    setSelectedInstalador(instalador);
    setShowDatosFiscalesDialog(true);
  };

  const handleOpenPagos = (instalador: any) => {
    setSelectedInstalador(instalador);
    setShowPagosDialog(true);
  };

  const handleOpenAuditoria = (instalador: any) => {
    setSelectedInstalador(instalador);
    setShowAuditoriaDialog(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando instaladores...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Registro de Instaladores</h1>
          <p className="text-muted-foreground">
            Gestiona el registro completo de instaladores, datos fiscales, pagos y auditorías
          </p>
        </div>
        <Button onClick={() => setShowRegistroDialog(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Registrar Instalador
        </Button>
      </div>

      {/* Métricas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Instaladores</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalInstaladores}</div>
            <p className="text-xs text-muted-foreground">
              Instaladores registrados en el sistema
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{instaladoresActivos}</div>
            <p className="text-xs text-muted-foreground">
              Instaladores disponibles para asignación
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactivos</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{instaladoresInactivos}</div>
            <p className="text-xs text-muted-foreground">
              Instaladores no disponibles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Calificación Promedio</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{promedioCalificacion.toFixed(1)}/5</div>
            <p className="text-xs text-muted-foreground">
              Calificación general del equipo
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros y Búsqueda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, email o código..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant={selectedStatus === 'todos' ? 'default' : 'outline'}
                onClick={() => setSelectedStatus('todos')}
                size="sm"
              >
                Todos
              </Button>
              <Button 
                variant={selectedStatus === 'activo' ? 'default' : 'outline'}
                onClick={() => setSelectedStatus('activo')}
                size="sm"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Activos
              </Button>
              <Button 
                variant={selectedStatus === 'inactivo' ? 'default' : 'outline'}
                onClick={() => setSelectedStatus('inactivo')}
                size="sm"
              >
                <XCircle className="h-4 w-4 mr-1" />
                Inactivos
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Instaladores */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredInstaladores.map((instalador) => (
          <InstaladorCard
            key={instalador.id}
            instalador={instalador}
            onOpenDatosFiscales={handleOpenDatosFiscales}
            onOpenPagos={handleOpenPagos}
            onOpenAuditoria={handleOpenAuditoria}
          />
        ))}
      </div>

      {filteredInstaladores.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No se encontraron instaladores</h3>
            <p className="text-muted-foreground text-center mb-4">
              No hay instaladores que coincidan con los criterios de búsqueda.
            </p>
            <Button onClick={() => setShowRegistroDialog(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Registrar Primer Instalador
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Diálogos */}
      <RegistroInstaladorFormularioRobusto
        open={showRegistroDialog}
        onOpenChange={setShowRegistroDialog}
      />

      <DatosFiscalesDialog
        open={showDatosFiscalesDialog}
        onOpenChange={setShowDatosFiscalesDialog}
        instalador={selectedInstalador}
      />

      <PagosInstaladorDialog
        open={showPagosDialog}
        onOpenChange={setShowPagosDialog}
        instalador={selectedInstalador}
      />

      <AuditoriaDialog
        open={showAuditoriaDialog}
        onOpenChange={setShowAuditoriaDialog}
        instalador={selectedInstalador}
      />
    </div>
  );
};