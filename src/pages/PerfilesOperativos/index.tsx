import { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CustomBreadcrumb } from '@/components/ui/custom-breadcrumb';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserRole } from '@/hooks/useUserRole';
import { 
  Users, Shield, Archive, UserCheck, TrendingUp, AlertTriangle, CheckCircle, UserX,
  Ban, CalendarOff
} from 'lucide-react';
import { CustodiosDataTable } from './components/CustodiosDataTable';
import { ArmadosDataTable } from './components/ArmadosDataTable';
import { ArchivadosDataTable } from './components/ArchivadosDataTable';
import { BajasDataTable } from './components/BajasDataTable';
import { useOperativeProfiles } from './hooks/useOperativeProfiles';

export default function PerfilesOperativos() {
  const { hasAnyRole, loading: roleLoading } = useUserRole();
  const [activeTab, setActiveTab] = useState('custodios');
  
  const { 
    custodios, 
    armados,
    archivados,
    bajas,
    stats,
    loading,
    refetch
  } = useOperativeProfiles();
  
  const canManageArchive = hasAnyRole(['admin', 'owner', 'supply_admin', 'supply_lead']);
  
  if (roleLoading || loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }
  
  return (
    <div className="p-6 space-y-6">
      <CustomBreadcrumb 
        items={[
          { label: 'Supply & Talento', href: '/leads', icon: Users },
          { label: 'Perfiles Operativos', icon: UserCheck }
        ]}
      />

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <UserCheck className="h-8 w-8 text-corporate-blue" />
          <h1 className="text-3xl font-bold">Perfiles Operativos</h1>
        </div>
        <p className="text-muted-foreground">
          Gestión integral de custodios y personal armado activos
        </p>
      </div>
      
      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9 gap-4">
        <Card className="border-l-4 border-l-corporate-blue">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Custodios</p>
                <p className="text-2xl font-bold">{stats.totalCustodios}</p>
              </div>
              <Shield className="h-5 w-5 text-corporate-blue" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Disponibles</p>
                <p className="text-2xl font-bold">{stats.custodiosDisponibles}</p>
              </div>
              <UserCheck className="h-5 w-5 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Activos 30d</p>
                <p className="text-2xl font-bold">{stats.activosUltimos30Dias}</p>
              </div>
              <TrendingUp className="h-5 w-5 text-emerald-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Sancionados</p>
                <p className="text-2xl font-bold">{stats.custodiosSancionados}</p>
              </div>
              <Ban className="h-5 w-5 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">No Disponibles</p>
                <p className="text-2xl font-bold">{stats.custodiosNoDisponibles}</p>
              </div>
              <CalendarOff className="h-5 w-5 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Inactivos +60d</p>
                <p className="text-2xl font-bold">{stats.inactivosMas60Dias}</p>
              </div>
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Docs OK</p>
                <p className="text-2xl font-bold">{stats.documentosCompletos}</p>
              </div>
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Armados</p>
                <p className="text-2xl font-bold">{stats.totalArmados}</p>
              </div>
              <Shield className="h-5 w-5 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Bajas</p>
                <p className="text-2xl font-bold">{stats.totalBajas}</p>
              </div>
              <UserX className="h-5 w-5 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-slate-400">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Archivados</p>
                <p className="text-2xl font-bold">{stats.totalArchivados}</p>
              </div>
              <Archive className="h-5 w-5 text-slate-400" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-2xl grid-cols-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-apple-soft border border-border/50">
          <TabsTrigger 
            value="custodios"
            className="flex items-center gap-2 data-[state=active]:bg-corporate-blue data-[state=active]:text-white"
          >
            <Shield className="h-4 w-4" />
            <span>Custodios</span>
            <Badge variant="secondary" className="ml-1 text-xs">
              {custodios.length}
            </Badge>
          </TabsTrigger>
          
          <TabsTrigger 
            value="armados"
            className="flex items-center gap-2 data-[state=active]:bg-corporate-blue data-[state=active]:text-white"
          >
            <Users className="h-4 w-4" />
            <span>Armados</span>
            <Badge variant="secondary" className="ml-1 text-xs">
              {armados.length}
            </Badge>
          </TabsTrigger>
          
          <TabsTrigger 
            value="bajas"
            className="flex items-center gap-2 data-[state=active]:bg-orange-500 data-[state=active]:text-white"
          >
            <UserX className="h-4 w-4" />
            <span>Bajas</span>
            <Badge variant="secondary" className="ml-1 text-xs">
              {bajas.length}
            </Badge>
          </TabsTrigger>
          
          {canManageArchive && (
            <TabsTrigger 
              value="archivados"
              className="flex items-center gap-2 data-[state=active]:bg-slate-600 data-[state=active]:text-white"
            >
              <Archive className="h-4 w-4" />
              <span>Archivados</span>
              <Badge variant="outline" className="ml-1 text-xs">
                {archivados.length}
              </Badge>
            </TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="custodios">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Custodios Operativos
              </CardTitle>
              <CardDescription>
                Personal de custodia activo y suspendido temporalmente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CustodiosDataTable data={custodios} onRefresh={refetch} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="armados">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Personal Armado
              </CardTitle>
              <CardDescription>
                Guardias armados internos y de proveedores externos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ArmadosDataTable data={armados} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="bajas">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserX className="h-5 w-5" />
                Bajas Definitivas
              </CardTitle>
              <CardDescription>
                Personal que ya no trabaja con nosotros
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BajasDataTable data={bajas} onRefresh={refetch} />
            </CardContent>
          </Card>
        </TabsContent>
        
        {canManageArchive && (
          <TabsContent value="archivados">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Archive className="h-5 w-5" />
                  Personal Archivado
                </CardTitle>
                <CardDescription>
                  Historial de personal dado de baja del sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ArchivadosDataTable data={archivados} />
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
