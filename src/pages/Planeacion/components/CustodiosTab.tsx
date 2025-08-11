import { useState } from 'react';
import { Plus, Search, Edit, Trash2, MapPin, Star, Shield, Smartphone } from 'lucide-react';
import { useCustodios, useCreateCustodio, useUpdateCustodio, useDeleteCustodio } from '@/hooks/usePlaneacion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Custodio, CustodioForm } from '@/types/planeacion';
import CustodioDialog from './CustodioDialog';
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

export default function CustodiosTab() {
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCustodio, setEditingCustodio] = useState<Custodio | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [custodioToDelete, setCustodioToDelete] = useState<Custodio | null>(null);

  const { data: custodios = [], isLoading } = useCustodios();
  const createMutation = useCreateCustodio();
  const updateMutation = useUpdateCustodio();
  const deleteMutation = useDeleteCustodio();

  const filteredCustodios = custodios.filter(custodio =>
    custodio.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    custodio.tel.includes(searchTerm) ||
    custodio.zona_base?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = async (data: CustodioForm) => {
    await createMutation.mutateAsync(data);
    setDialogOpen(false);
  };

  const handleUpdate = async (data: CustodioForm) => {
    if (editingCustodio) {
      await updateMutation.mutateAsync({ 
        id: editingCustodio.id, 
        custodio: data 
      });
      setEditingCustodio(null);
      setDialogOpen(false);
    }
  };

  const handleDelete = async () => {
    if (custodioToDelete) {
      await deleteMutation.mutateAsync(custodioToDelete.id);
      setCustodioToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  const openEditDialog = (custodio: Custodio) => {
    setEditingCustodio(custodio);
    setDialogOpen(true);
  };

  const openDeleteDialog = (custodio: Custodio) => {
    setCustodioToDelete(custodio);
    setDeleteDialogOpen(true);
  };

  const getDisponibilidadBadge = (disponibilidad: string): "default" | "secondary" | "destructive" | "outline" => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      'disponible': 'default',
      'ocupado': 'secondary',
      'off': 'destructive'
    };
    return variants[disponibilidad] || 'default';
  };

  const getEstadoBadge = (estado: string): "default" | "secondary" | "destructive" | "outline" => {
    return estado === 'activo' ? 'default' : 'secondary';
  };

  const columns: ColumnDef<Custodio>[] = [
    {
      accessorKey: 'nombre',
      header: 'Custodio',
      cell: ({ row }) => (
        <div className="space-y-1">
          <div className="font-medium">{row.original.nombre}</div>
          <div className="text-sm text-muted-foreground">{row.original.tel}</div>
          {row.original.email && (
            <div className="text-sm text-muted-foreground">{row.original.email}</div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'rating_promedio',
      header: 'Rating',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
          <span className="font-medium">{row.original.rating_promedio.toFixed(1)}</span>
        </div>
      ),
    },
    {
      accessorKey: 'zona_base',
      header: 'Zona Base',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span>{row.original.zona_base || 'No asignada'}</span>
        </div>
      ),
    },
    {
      accessorKey: 'tipo_custodia',
      header: 'Tipo',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-muted-foreground" />
          <Badge variant="outline">
            {row.original.tipo_custodia === 'armado' ? 'Armado' : 'No Armado'}
          </Badge>
        </div>
      ),
    },
    {
      accessorKey: 'tiene_gadgets',
      header: 'Gadgets',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Smartphone className="h-4 w-4 text-muted-foreground" />
          <Badge variant={row.original.tiene_gadgets ? 'default' : 'secondary'}>
            {row.original.tiene_gadgets ? 'Sí' : 'No'}
          </Badge>
        </div>
      ),
    },
    {
      accessorKey: 'disponibilidad',
      header: 'Disponibilidad',
      cell: ({ row }) => (
        <Badge variant={getDisponibilidadBadge(row.original.disponibilidad)}>
          {row.original.disponibilidad.charAt(0).toUpperCase() + row.original.disponibilidad.slice(1)}
        </Badge>
      ),
    },
    {
      accessorKey: 'estado',
      header: 'Estado',
      cell: ({ row }) => (
        <Badge variant={getEstadoBadge(row.original.estado)}>
          {row.original.estado.charAt(0).toUpperCase() + row.original.estado.slice(1)}
        </Badge>
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
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => openDeleteDialog(row.original)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const custodiosActivos = custodios.filter(c => c.estado === 'activo');
  const custodiosDisponibles = custodios.filter(c => c.disponibilidad === 'disponible');
  const custodiosConGadgets = custodios.filter(c => c.tiene_gadgets);
  const ratingPromedio = custodios.length > 0 
    ? custodios.reduce((sum, c) => sum + c.rating_promedio, 0) / custodios.length
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Gestión de Custodios</h2>
          <p className="text-muted-foreground">
            Administra tu red de custodios y su disponibilidad
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Custodio
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar custodios..."
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
              Total Custodios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{custodios.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Custodios Activos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{custodiosActivos.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Disponibles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{custodiosDisponibles.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Rating Promedio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-1">
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              {ratingPromedio.toFixed(1)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Custodios</CardTitle>
          <CardDescription>
            {filteredCustodios.length} custodio(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={filteredCustodios}
            loading={isLoading}
          />
        </CardContent>
      </Card>

      {/* Custodio Dialog */}
      <CustodioDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingCustodio(null);
        }}
        custodio={editingCustodio}
        onSubmit={editingCustodio ? handleUpdate : handleCreate}
        loading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el custodio
              "{custodioToDelete?.nombre}" y todos sus datos asociados.
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
    </div>
  );
}