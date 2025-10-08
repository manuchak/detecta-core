import { useState } from 'react';
import ImportWizard from './ImportWizard';
import { Plus, Search, Edit, Trash2, Calendar, MapPin, Shield, Clock, Upload, User } from 'lucide-react';
import { useServicios, useCreateServicio, useUpdateServicio, useDeleteServicio } from '@/hooks/usePlaneacion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Servicio, ServicioForm } from '@/types/planeacion';
import ServicioDialog from './ServicioDialog';
import { PendingAssignmentModal } from '@/components/planeacion/PendingAssignmentModal';
import { useServiceTransformations } from '@/hooks/useServiceTransformations';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';

export default function ServiciosTab() {
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingServicio, setEditingServicio] = useState<Servicio | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [servicioToDelete, setServicioToDelete] = useState<Servicio | null>(null);
  const [importWizardOpen, setImportWizardOpen] = useState(false);
  
  // Estados para asignación de personal
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [assignmentMode, setAssignmentMode] = useState<'auto' | 'direct_armed' | 'direct_custodian'>('auto');
  const [serviceForAssignment, setServiceForAssignment] = useState<Servicio | null>(null);

  const { data: servicios = [], isLoading } = useServicios();
  const createMutation = useCreateServicio();
  const updateMutation = useUpdateServicio();
  const deleteMutation = useDeleteServicio();
  const queryClient = useQueryClient();
  const { servicioToPending } = useServiceTransformations();

  const filteredServicios = servicios.filter(servicio => {
    const clienteNombre = typeof servicio.cliente === 'string'
      ? servicio.cliente
      : servicio.cliente?.nombre || '';
    return (
      servicio.folio.toLowerCase().includes(searchTerm.toLowerCase()) ||
      servicio.origen_texto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      servicio.destino_texto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clienteNombre.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleCreate = async (data: ServicioForm) => {
    await createMutation.mutateAsync(data);
    setDialogOpen(false);
  };

  const handleUpdate = async (data: ServicioForm) => {
    if (editingServicio) {
      await updateMutation.mutateAsync({ 
        id: editingServicio.id, 
        servicio: data 
      });
      setEditingServicio(null);
      setDialogOpen(false);
    }
  };

  const handleDelete = async () => {
    if (servicioToDelete) {
      await deleteMutation.mutateAsync(servicioToDelete.id);
      setServicioToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  const openEditDialog = (servicio: Servicio) => {
    setEditingServicio(servicio);
    setDialogOpen(true);
  };

  const openDeleteDialog = (servicio: Servicio) => {
    setServicioToDelete(servicio);
    setDeleteDialogOpen(true);
  };

  const openAssignmentModal = (
    servicio: Servicio, 
    mode: 'auto' | 'direct_armed' | 'direct_custodian' = 'auto'
  ) => {
    setServiceForAssignment(servicio);
    setAssignmentMode(mode);
    setAssignmentModalOpen(true);
  };

  const getEstadoBadge = (estado: string): "default" | "secondary" | "destructive" | "outline" => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      'nuevo': 'default',
      'en_oferta': 'secondary',
      'asignado': 'outline',
      'en_curso': 'default',
      'finalizado': 'default',
      'cancelado': 'destructive'
    };
    return variants[estado] || 'default';
  };

  const getTipoServicioBadge = (tipo: string): "default" | "secondary" | "destructive" | "outline" => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      'traslado': 'default',
      'custodia_local': 'secondary',
      'escolta': 'outline',
      'vigilancia': 'default'
    };
    return variants[tipo] || 'default';
  };

  const columns: ColumnDef<Servicio>[] = [
    {
      accessorKey: 'folio',
      header: 'Folio',
      cell: ({ row }) => (
        <div className="font-mono font-medium">{row.original.folio}</div>
      ),
    },
    {
      accessorKey: 'cliente',
      header: 'Cliente',
      cell: ({ row }) => {
        const c = row.original.cliente;
        const nombre = typeof c === 'string' ? c : c?.nombre;
        return (
          <div className="font-medium">{nombre || 'Sin cliente'}</div>
        );
      },
    },
    {
      accessorKey: 'fecha_programada',
      header: 'Fecha',
      cell: ({ row }) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{format(new Date(row.original.fecha_programada), 'dd MMM yyyy', { locale: es })}</span>
          </div>
          <div className="text-sm text-muted-foreground">
            {row.original.hora_ventana_inicio} - {row.original.hora_ventana_fin}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'ruta',
      header: 'Ruta',
      cell: ({ row }) => (
        <div className="space-y-1 max-w-xs">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-3 w-3 text-green-600" />
            <span className="truncate">{row.original.origen_texto}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-3 w-3 text-red-600" />
            <span className="truncate">{row.original.destino_texto}</span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'tipo_servicio',
      header: 'Tipo',
      cell: ({ row }) => (
        <Badge variant={getTipoServicioBadge(row.original.tipo_servicio)}>
          {row.original.tipo_servicio.replace('_', ' ').toUpperCase()}
        </Badge>
      ),
    },
    {
      accessorKey: 'estado',
      header: 'Estado',
      cell: ({ row }) => (
        <Badge variant={getEstadoBadge(row.original.estado)}>
          {row.original.estado.replace('_', ' ').toUpperCase()}
        </Badge>
      ),
    },
    {
      accessorKey: 'custodio_asignado',
      header: 'Custodio',
      cell: ({ row }) => (
        <div className="text-sm">
          {row.original.custodio_asignado?.nombre || 'Sin asignar'}
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => openEditDialog(row.original)}
            title="Editar datos del servicio"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => openAssignmentModal(row.original, 'auto')}
            title="Asignar custodio/armado"
          >
            <User className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => openDeleteDialog(row.original)}
            title="Eliminar servicio"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const serviciosNuevos = servicios.filter(s => s.estado === 'nuevo');
  const serviciosEnCurso = servicios.filter(s => s.estado === 'en_curso');
  const serviciosFinalizados = servicios.filter(s => s.estado === 'finalizado');
  const serviciosConGadgets = servicios.filter(s => s.requiere_gadgets);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Gestión de Servicios</h2>
          <p className="text-muted-foreground">
            Administra los servicios de custodia y su asignación
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setImportWizardOpen(true)} className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Importar Excel
          </Button>
          <Button onClick={() => setDialogOpen(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nuevo Servicio
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar servicios..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Servicios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{servicios.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Nuevos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{serviciosNuevos.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              En Curso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{serviciosEnCurso.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Finalizados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{serviciosFinalizados.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Servicios</CardTitle>
          <CardDescription>
            {filteredServicios.length} servicio(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={filteredServicios}
            loading={isLoading}
          />
        </CardContent>
      </Card>

      {/* Servicio Dialog - Edición de Datos Básicos */}
      <ServicioDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingServicio(null);
        }}
        servicio={editingServicio}
        onSubmit={editingServicio ? handleUpdate : handleCreate}
        loading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Assignment Modal - Asignación de Personal */}
      {serviceForAssignment && (
        <PendingAssignmentModal
          open={assignmentModalOpen}
          onOpenChange={(open) => {
            setAssignmentModalOpen(open);
            if (!open) setServiceForAssignment(null);
          }}
          service={servicioToPending(serviceForAssignment)}
          mode={assignmentMode}
          onAssignmentComplete={() => {
            setAssignmentModalOpen(false);
            setServiceForAssignment(null);
            queryClient.invalidateQueries({ queryKey: ['servicios'] });
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el servicio
              "{servicioToDelete?.folio}" y todos sus datos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Import Wizard */}
      <ImportWizard
        open={importWizardOpen}
        onOpenChange={setImportWizardOpen}
        onComplete={() => window.location.reload()}
      />
    </div>
  );
}