
import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { 
  DollarSign, 
  Clock, 
  Shield, 
  Briefcase,
  Trash,
  Award,
  Trophy,
  Star,
  BadgeCheck,
  Pencil,
  Plus,
  X,
  Save
} from 'lucide-react';
import { useToast } from '@/hooks';
import { useBenefits, Benefit } from '@/hooks/useBenefits';
import { Badge } from '@/components/ui/badge';

// Available icons for benefits
const availableIcons = [
  { name: 'DollarSign', icon: <DollarSign className="h-6 w-6" /> },
  { name: 'Clock', icon: <Clock className="h-6 w-6" /> },
  { name: 'Shield', icon: <Shield className="h-6 w-6" /> },
  { name: 'Briefcase', icon: <Briefcase className="h-6 w-6" /> },
  { name: 'Award', icon: <Award className="h-6 w-6" /> },
  { name: 'Trophy', icon: <Trophy className="h-6 w-6" /> },
  { name: 'Star', icon: <Star className="h-6 w-6" /> },
  { name: 'BadgeCheck', icon: <BadgeCheck className="h-6 w-6" /> },
];

export const BenefitsManager = () => {
  const [selectedBenefit, setSelectedBenefit] = useState<Benefit | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newIcon, setNewIcon] = useState('DollarSign');
  const { toast } = useToast();
  const { benefits, loading, createBenefit, updateBenefit, deleteBenefit, fetchBenefits } = useBenefits();

  // Save a new benefit or update an existing one
  const saveBenefit = async () => {
    if (!newTitle || !newDescription) {
      toast({
        title: 'Campos requeridos',
        description: 'Por favor completa todos los campos.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const benefitToSave = {
        title: newTitle,
        description: newDescription,
        icon: newIcon,
        order: selectedBenefit ? selectedBenefit.order : benefits.length + 1,
      };

      if (selectedBenefit) {
        // Updating existing benefit
        await updateBenefit(selectedBenefit.id, benefitToSave);
        toast({
          title: 'Beneficio actualizado',
          description: 'El beneficio ha sido actualizado correctamente.',
        });
      } else {
        // Adding new benefit
        await createBenefit(benefitToSave);
        toast({
          title: 'Beneficio creado',
          description: 'El beneficio ha sido creado correctamente.',
        });
      }

      // Reset form
      setSelectedBenefit(null);
      setNewTitle('');
      setNewDescription('');
      setNewIcon('DollarSign');
      
      // Refresh benefits list
      fetchBenefits();
    } catch (error) {
      console.error('Error saving benefit:', error);
      toast({
        title: 'Error',
        description: 'No se pudo guardar el beneficio. Inténtalo de nuevo.',
        variant: 'destructive',
      });
    }
  };

  // Edit a benefit
  const editBenefit = (benefit: Benefit) => {
    console.log("Editing benefit:", benefit);
    setSelectedBenefit(benefit);
    setNewTitle(benefit.title);
    setNewDescription(benefit.description);
    setNewIcon(benefit.icon);
  };

  // Cancel editing
  const cancelEdit = () => {
    setSelectedBenefit(null);
    setNewTitle('');
    setNewDescription('');
    setNewIcon('DollarSign');
  };

  // Handle benefit deletion
  const handleDeleteBenefit = async (id: string) => {
    if (window.confirm('¿Estás seguro que deseas eliminar este beneficio?')) {
      try {
        await deleteBenefit(id);
        // Refresh benefits list
        fetchBenefits();
        
        // If we're editing the benefit that was just deleted, reset the form
        if (selectedBenefit && selectedBenefit.id === id) {
          cancelEdit();
        }
        
        toast({
          title: 'Beneficio eliminado',
          description: 'El beneficio ha sido eliminado correctamente.',
        });
      } catch (error) {
        console.error('Error deleting benefit:', error);
        toast({
          title: 'Error',
          description: 'No se pudo eliminar el beneficio. Inténtalo de nuevo.',
          variant: 'destructive',
        });
      }
    }
  };

  // Render icon based on icon name
  const renderIcon = (iconName: string) => {
    const iconInfo = availableIcons.find(i => i.name === iconName);
    return iconInfo ? iconInfo.icon : <DollarSign className="h-6 w-6" />;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gestión de Beneficios</CardTitle>
          <CardDescription>
            Configura los beneficios que se mostrarán en la landing page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-pulse flex flex-col items-center">
                <div className="h-10 w-10 bg-primary/20 rounded-full mb-4"></div>
                <div className="h-4 w-40 bg-muted rounded"></div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex justify-end mb-4">
                <Button 
                  onClick={() => {
                    cancelEdit(); // Ensure form is clean
                    window.scrollTo({
                      top: document.documentElement.scrollHeight,
                      behavior: 'smooth'
                    });
                  }}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Nuevo Beneficio
                </Button>
              </div>
              
              {benefits.length === 0 ? (
                <div className="text-center py-8 border border-dashed rounded-lg bg-muted/10">
                  <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                    <Star className="h-6 w-6 text-primary/60" />
                  </div>
                  <h3 className="text-lg font-medium mb-1">No hay beneficios</h3>
                  <p className="text-muted-foreground text-sm">
                    Agrega tu primer beneficio para mostrar en la landing page.
                  </p>
                </div>
              ) : (
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Icono</TableHead>
                        <TableHead>Título</TableHead>
                        <TableHead className="hidden md:table-cell">Descripción</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {benefits.map((benefit) => (
                        <TableRow key={benefit.id} className={selectedBenefit?.id === benefit.id ? 'bg-muted/20' : ''}>
                          <TableCell>
                            <Badge variant="outline" className="bg-orange-100 border-0 p-2 rounded-full inline-flex items-center justify-center text-orange-500">
                              {renderIcon(benefit.icon)}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">{benefit.title}</TableCell>
                          <TableCell className="hidden md:table-cell max-w-xs truncate">
                            {benefit.description}
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button 
                              variant={selectedBenefit?.id === benefit.id ? "secondary" : "outline"} 
                              size="sm" 
                              className="gap-1"
                              onClick={() => editBenefit(benefit)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Editar
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              className="gap-1"
                              onClick={() => handleDeleteBenefit(benefit.id)}
                            >
                              <Trash className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card id="benefit-form">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{selectedBenefit ? 'Editar Beneficio' : 'Agregar Nuevo Beneficio'}</CardTitle>
              <CardDescription>
                {selectedBenefit 
                  ? 'Modifica los datos del beneficio seleccionado' 
                  : 'Completa el formulario para agregar un nuevo beneficio'}
              </CardDescription>
            </div>
            {selectedBenefit && (
              <Badge variant="outline" className="px-2 py-1">
                Editando ID: {selectedBenefit.id.substring(0, 8)}...
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="title">
              Título
            </label>
            <Input
              id="title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Ej. Horarios Flexibles"
              className="w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="description">
              Descripción
            </label>
            <Textarea
              id="description"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Describe el beneficio en pocas palabras"
              rows={3}
              className="w-full resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-3">
              Icono
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {availableIcons.map((icon) => (
                <div 
                  key={icon.name}
                  className={`cursor-pointer p-3 rounded-md flex items-center justify-center transition-all ${
                    newIcon === icon.name 
                      ? 'bg-primary text-primary-foreground shadow-sm' 
                      : 'bg-muted hover:bg-accent'
                  }`}
                  onClick={() => setNewIcon(icon.name)}
                  title={icon.name}
                >
                  {icon.icon}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t p-6">
          <Button 
            variant="outline" 
            onClick={cancelEdit}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Cancelar
          </Button>
          <Button 
            variant="default"
            onClick={saveBenefit}
            className="gap-2"
            disabled={!newTitle || !newDescription}
          >
            <Save className="h-4 w-4" />
            {selectedBenefit ? 'Actualizar' : 'Guardar'} Beneficio
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};
