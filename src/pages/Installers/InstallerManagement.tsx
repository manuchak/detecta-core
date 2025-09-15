// @ts-nocheck
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Users, 
  UserCheck, 
  Clock, 
  UserX, 
  Plus, 
  Search,
  ExternalLink,
  Shield,
  CreditCard,
  ClipboardList,
  Building
} from 'lucide-react';
import { useInstaladores } from '@/hooks/useInstaladores';
import { useEmpresasInstaladora } from '@/hooks/useEmpresasInstaladora';
import { RegistroInstaladorFormularioRobusto } from './components/RegistroInstaladorFormularioRobusto';
import { RegistroEmpresaDialog } from './components/RegistroEmpresaDialog';

const InstallerManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showRegistroDialog, setShowRegistroDialog] = useState(false);
  const [showRegistroEmpresaDialog, setShowRegistroEmpresaDialog] = useState(false);
  const [vistaActual, setVistaActual] = useState<'instaladores' | 'empresas'>('instaladores');

  const { instaladores, isLoadingInstaladores } = useInstaladores();
  const { empresas, isLoadingEmpresas } = useEmpresasInstaladora();

  const filteredInstaladores = instaladores?.filter(instalador => {
    const matchesSearch = instalador.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         instalador.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         instalador.telefono.includes(searchTerm);
    
    const matchesStatus = selectedStatus === 'all' || instalador.estado_afiliacion === selectedStatus;
    
    return matchesSearch && matchesStatus;
  }) || [];

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'activo': return 'default';
      case 'pendiente': return 'secondary';
      case 'suspendido': return 'destructive';
      default: return 'outline';
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'activo': return <UserCheck className="h-3 w-3" />;
      case 'pendiente': return <Clock className="h-3 w-3" />;
      case 'suspendido': return <UserX className="h-3 w-3" />;
      default: return null;
    }
  };

  if (isLoadingInstaladores || isLoadingEmpresas) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Cargando datos...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Instaladores</h1>
          <p className="text-muted-foreground">
            Administra instaladores individuales y empresas integradoras
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={vistaActual} onValueChange={(value: 'instaladores' | 'empresas') => setVistaActual(value)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="instaladores">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Instaladores
                </div>
              </SelectItem>
              <SelectItem value="empresas">
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Empresas
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          
          {vistaActual === 'instaladores' ? (
            <Button 
              onClick={() => setShowRegistroDialog(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Registrar Instalador
            </Button>
          ) : (
            <Button 
              onClick={() => setShowRegistroEmpresaDialog(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Registrar Empresa
            </Button>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      {vistaActual === 'instaladores' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{instaladores?.length || 0}</div>
              <p className="text-xs text-muted-foreground">instaladores registrados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Activos</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {instaladores?.filter(i => i.estado_afiliacion === 'activo').length || 0}
              </div>
              <p className="text-xs text-muted-foreground">instaladores activos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {instaladores?.filter(i => i.estado_afiliacion === 'pendiente').length || 0}
              </div>
              <p className="text-xs text-muted-foreground">en revisión</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Suspendidos</CardTitle>
              <UserX className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {instaladores?.filter(i => i.estado_afiliacion === 'suspendido').length || 0}
              </div>
              <p className="text-xs text-muted-foreground">suspendidos</p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{empresas?.length || 0}</div>
              <p className="text-xs text-muted-foreground">empresas registradas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Activas</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {empresas?.filter(e => e.estado_contrato === 'activo').length || 0}
              </div>
              <p className="text-xs text-muted-foreground">empresas activas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inactivas</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {empresas?.filter(e => e.estado_contrato === 'inactivo').length || 0}
              </div>
              <p className="text-xs text-muted-foreground">en pausa</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Suspendidas</CardTitle>
              <UserX className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {empresas?.filter(e => e.estado_contrato === 'suspendido').length || 0}
              </div>
              <p className="text-xs text-muted-foreground">suspendidas</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Registration Dialogs */}
      {showRegistroDialog && (
        <RegistroInstaladorFormularioRobusto
          open={showRegistroDialog}
          onOpenChange={setShowRegistroDialog}
        />
      )}
      
      {showRegistroEmpresaDialog && (
        <RegistroEmpresaDialog
          open={showRegistroEmpresaDialog}
          onOpenChange={setShowRegistroEmpresaDialog}
        />
      )}
    </div>
  );
};

export default InstallerManagement;