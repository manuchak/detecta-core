
import React from 'react';
import { Check, Shield, Clock, DollarSign, Briefcase, Users } from 'lucide-react';

interface FeaturesSectionProps {
  id?: string;
}

export const FeaturesSection: React.FC<FeaturesSectionProps> = ({ id }) => {
  const features = [
    {
      icon: <Shield className="h-6 w-6 text-orange-500" />,
      title: 'Capacitación Profesional',
      description: 'Recibe entrenamiento especializado en seguridad, manejo de situaciones de riesgo y protocolos de custodia.'
    },
    {
      icon: <Clock className="h-6 w-6 text-orange-500" />,
      title: 'Planificación Inteligente',
      description: 'Nuestra plataforma optimiza rutas y asigna servicios según tu ubicación y disponibilidad.'
    },
    {
      icon: <DollarSign className="h-6 w-6 text-orange-500" />,
      title: 'Pagos Semanales',
      description: 'Recibe tus ganancias de forma puntual cada semana directamente en tu cuenta bancaria.'
    },
    {
      icon: <Users className="h-6 w-6 text-orange-500" />,
      title: 'Comunidad de Apoyo',
      description: 'Forma parte de un equipo profesional con comunicación constante y apoyo mutuo.'
    },
    {
      icon: <Briefcase className="h-6 w-6 text-orange-500" />,
      title: 'Equipo Completo',
      description: 'Te proporcionamos todo el equipamiento necesario para realizar tu trabajo con seguridad.'
    },
    {
      icon: <Check className="h-6 w-6 text-orange-500" />,
      title: 'Seguro de Responsabilidad',
      description: 'Estás protegido con un seguro integral durante todos tus servicios de custodia.'
    }
  ];

  return (
    <section id={id} className="py-20 bg-gradient-to-b from-muted/30 to-background">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center space-y-4 text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">Características que amarás</h2>
          <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
            Nuestra plataforma está diseñada para facilitar tu trabajo como custodio y maximizar tus ganancias
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10 mt-12">
          {features.map((feature, index) => (
            <div key={index} className="flex gap-4 items-start">
              <div className="rounded-full bg-orange-100 p-3 mt-1 flex-shrink-0">
                {feature.icon}
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
