
import React, { useEffect, useState } from 'react';
import { 
  Clock, 
  DollarSign, 
  Shield, 
  Briefcase, 
  Award, 
  Trophy, 
  Star,
  BadgeCheck
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

interface BenefitsSectionProps {
  id?: string;
}

interface Benefit {
  id: string;
  title: string;
  description: string;
  icon: string;
  order: number;
}

export const BenefitsSection: React.FC<BenefitsSectionProps> = ({ id }) => {
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [loading, setLoading] = useState(true);

  // Default benefits to show if no data is fetched
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
        const { data, error } = await supabase
          .from('benefits')
          .select('*')
          .order('order');

        if (error) throw error;

        if (data && data.length > 0) {
          setBenefits(data);
        } else {
          setBenefits(defaultBenefits);
        }
      } catch (error) {
        console.error('Error fetching benefits:', error);
        setBenefits(defaultBenefits);
      } finally {
        setLoading(false);
      }
    };

    fetchBenefits();
  }, []);

  // Map icon name to component
  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'DollarSign':
        return <DollarSign className="h-10 w-10 text-orange-500" />;
      case 'Clock':
        return <Clock className="h-10 w-10 text-orange-500" />;
      case 'Shield':
        return <Shield className="h-10 w-10 text-orange-500" />;
      case 'Briefcase':
        return <Briefcase className="h-10 w-10 text-orange-500" />;
      case 'Award':
        return <Award className="h-10 w-10 text-orange-500" />;
      case 'Trophy':
        return <Trophy className="h-10 w-10 text-orange-500" />;
      case 'Star':
        return <Star className="h-10 w-10 text-orange-500" />;
      case 'BadgeCheck':
        return <BadgeCheck className="h-10 w-10 text-orange-500" />;
      default:
        return <DollarSign className="h-10 w-10 text-orange-500" />;
    }
  };

  return (
    <section id={id} className="py-20 bg-muted/30">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center space-y-4 text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">Lo que obtienes</h2>
          <p className="mx-auto max-w-[800px] text-muted-foreground md:text-xl">
            Únete a nuestra red de custodios y disfruta de estos beneficios exclusivos
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((benefit) => (
            <Card key={benefit.id} className="bg-card border-border/40 transition-all hover:shadow-md group overflow-hidden">
              <CardContent className="flex flex-col items-center p-6 text-center space-y-4">
                <div className="rounded-full bg-orange-100 p-4 group-hover:bg-orange-200 transition-colors">
                  {getIconComponent(benefit.icon)}
                </div>
                <h3 className="text-xl font-bold">{benefit.title}</h3>
                <p className="text-muted-foreground">{benefit.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
