
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
  BadgeCheck
} from 'lucide-react';
import { useToast } from '@/hooks';
import { useBenefits, Benefit } from '@/hooks/useBenefits';

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
      } else {
        // Adding new benefit
        await createBenefit(benefitToSave);
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
    }
  };

  // Edit a benefit
  const editBenefit = (benefit: Benefit) => {
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
      } catch (error) {
        console.error('Error deleting benefit:', error);
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
            <p className="text-center py-4">Cargando beneficios...</p>
          ) : (
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
                  <TableRow key={benefit.id}>
                    <TableCell>
                      <div className="bg-orange-100 p-2 rounded-full inline-flex items-center justify-center text-orange-500">
                        {renderIcon(benefit.icon)}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{benefit.title}</TableCell>
                    <TableCell className="hidden md:table-cell max-w-xs truncate">
                      {benefit.description}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => editBenefit(benefit)}
                      >
                        Editar
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleDeleteBenefit(benefit.id)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{selectedBenefit ? 'Editar Beneficio' : 'Agregar Nuevo Beneficio'}</CardTitle>
          <CardDescription>
            {selectedBenefit 
              ? 'Modifica los datos del beneficio seleccionado' 
              : 'Completa el formulario para agregar un nuevo beneficio'}
          </CardDescription>
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
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Icono
            </label>
            <div className="grid grid-cols-4 gap-2">
              {availableIcons.map((icon) => (
                <div 
                  key={icon.name}
                  className={`cursor-pointer p-3 rounded-md flex items-center justify-center ${
                    newIcon === icon.name 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted hover:bg-accent'
                  }`}
                  onClick={() => setNewIcon(icon.name)}
                >
                  {icon.icon}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={cancelEdit}
          >
            Cancelar
          </Button>
          <Button 
            variant="default"
            onClick={saveBenefit}
          >
            {selectedBenefit ? 'Actualizar' : 'Agregar'} Beneficio
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};
