
import React from 'react';
import { Clock, DollarSign, Shield, Briefcase } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface BenefitsSectionProps {
  id?: string;
}

export const BenefitsSection: React.FC<BenefitsSectionProps> = ({ id }) => {
  const benefits = [
    {
      icon: <DollarSign className="h-10 w-10 text-orange-500" />,
      title: 'Ingresos Competitivos',
      description: 'Gana dinero extra con pagos atractivos por cada servicio de custodia completado.'
    },
    {
      icon: <Clock className="h-10 w-10 text-orange-500" />,
      title: 'Horarios Flexibles',
      description: 'Trabaja cuando puedas. Tú decides cuándo y cuántos servicios tomar.'
    },
    {
      icon: <Shield className="h-10 w-10 text-orange-500" />,
      title: 'Equipo y Capacitación',
      description: 'Recibe todo el equipo necesario y capacitación profesional para realizar tu trabajo.'
    },
    {
      icon: <Briefcase className="h-10 w-10 text-orange-500" />,
      title: 'Crecimiento Profesional',
      description: 'Desarrolla habilidades valoradas en el mercado y construye una carrera en seguridad.'
    }
  ];

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
          {benefits.map((benefit, index) => (
            <Card key={index} className="bg-card border-border/40 transition-all hover:shadow-md group overflow-hidden">
              <CardContent className="flex flex-col items-center p-6 text-center space-y-4">
                <div className="rounded-full bg-orange-100 p-4 group-hover:bg-orange-200 transition-colors">
                  {benefit.icon}
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
