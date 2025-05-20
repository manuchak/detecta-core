
import React, { useState, useEffect } from 'react';
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
  Plus,
  Award,
  Trophy,
  Star,
  BadgeCheck
} from 'lucide-react';
import { useToast } from '@/hooks';
import { supabase } from '@/integrations/supabase/client';

// Type for the benefit item
interface Benefit {
  id: string;
  title: string;
  description: string;
  icon: string;
  order: number;
}

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
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBenefit, setSelectedBenefit] = useState<Benefit | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newIcon, setNewIcon] = useState('DollarSign');
  const { toast } = useToast();

  // Initial benefits if none are found in the database
  const defaultBenefits = [
    {
      id: '1',
      title: 'Ingresos Competitivos',
      description: 'Gana dinero extra con pagos atractivos por cada servicio de custodia completado.',
      icon: 'DollarSign',
      order: 1
    },
    {
      id: '2',
      title: 'Horarios Flexibles',
      description: 'Trabaja cuando puedas. Tú decides cuándo y cuántos servicios tomar.',
      icon: 'Clock',
      order: 2
    },
    {
      id: '3',
      title: 'Equipo y Capacitación',
      description: 'Recibe todo el equipo necesario y capacitación profesional para realizar tu trabajo.',
      icon: 'Shield',
      order: 3
    },
    {
      id: '4',
      title: 'Crecimiento Profesional',
      description: 'Desarrolla habilidades valoradas en el mercado y construye una carrera en seguridad.',
      icon: 'Briefcase',
      order: 4
    }
  ];

  // Fetch benefits from database
  useEffect(() => {
    const fetchBenefits = async () => {
      try {
        let { data: benefitsData, error } = await supabase
          .from('benefits')
          .select('*')
          .order('order');

        if (error) {
          throw error;
        }

        if (benefitsData && benefitsData.length > 0) {
          setBenefits(benefitsData);
        } else {
          // If no benefits exist in the database, use the default ones
          // and insert them into the database
          await insertDefaultBenefits();
          setBenefits(defaultBenefits);
        }
      } catch (error) {
        console.error('Error fetching benefits:', error);
        toast({
          title: 'Error',
          description: 'No se pudieron cargar los beneficios.',
          variant: 'destructive',
        });
        // Use default benefits on error
        setBenefits(defaultBenefits);
      } finally {
        setLoading(false);
      }
    };

    fetchBenefits();
  }, [toast]);

  // Insert default benefits into the database if none exist
  const insertDefaultBenefits = async () => {
    try {
      const { error } = await supabase
        .from('benefits')
        .insert(defaultBenefits);
        
      if (error) throw error;
      
      toast({
        title: 'Beneficios inicializados',
        description: 'Se han creado beneficios predeterminados.',
      });
    } catch (error) {
      console.error('Error inserting default benefits:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron crear los beneficios predeterminados.',
        variant: 'destructive',
      });
    }
  };

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
      let benefitToSave = {
        title: newTitle,
        description: newDescription,
        icon: newIcon,
        order: selectedBenefit ? selectedBenefit.order : benefits.length + 1,
      };

      if (selectedBenefit) {
        // Updating existing benefit
        const { error } = await supabase
          .from('benefits')
          .update(benefitToSave)
          .eq('id', selectedBenefit.id);

        if (error) throw error;

        setBenefits(benefits.map(b => 
          b.id === selectedBenefit.id ? { ...b, ...benefitToSave } : b
        ));

        toast({
          title: 'Beneficio actualizado',
          description: 'El beneficio ha sido actualizado exitosamente.',
        });
      } else {
        // Adding new benefit
        const { data, error } = await supabase
          .from('benefits')
          .insert([benefitToSave])
          .select();

        if (error) throw error;

        if (data) {
          setBenefits([...benefits, data[0]]);
          toast({
            title: 'Beneficio agregado',
            description: 'El nuevo beneficio ha sido agregado exitosamente.',
          });
        }
      }

      // Reset form
      setSelectedBenefit(null);
      setNewTitle('');
      setNewDescription('');
      setNewIcon('DollarSign');
    } catch (error) {
      console.error('Error saving benefit:', error);
      toast({
        title: 'Error',
        description: 'No se pudo guardar el beneficio.',
        variant: 'destructive',
      });
    }
  };

  // Delete a benefit
  const deleteBenefit = async (id: string) => {
    try {
      const { error } = await supabase
        .from('benefits')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setBenefits(benefits.filter(b => b.id !== id));
      
      toast({
        title: 'Beneficio eliminado',
        description: 'El beneficio ha sido eliminado exitosamente.',
      });
    } catch (error) {
      console.error('Error deleting benefit:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el beneficio.',
        variant: 'destructive',
      });
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
                        onClick={() => deleteBenefit(benefit.id)}
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
