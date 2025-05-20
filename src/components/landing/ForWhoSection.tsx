
import React from 'react';
import { Users, ShieldCheck, Clock } from 'lucide-react';

interface ForWhoSectionProps {
  id?: string;
}

export const ForWhoSection: React.FC<ForWhoSectionProps> = ({ id }) => {
  const audiences = [
    {
      icon: <ShieldCheck className="h-12 w-12 text-corporate-red" />,
      title: 'Profesionales de Seguridad',
      description: 'Perfecta para quienes tienen experiencia en seguridad y buscan ampliar su cartera de clientes.'
    },
    {
      icon: <Clock className="h-12 w-12 text-corporate-red" />,
      title: 'Personas con Horarios Flexibles',
      description: 'Ideal para quienes buscan ingresos extra y tienen disponibilidad de tiempo variable.'
    },
    {
      icon: <Users className="h-12 w-12 text-corporate-red" />,
      title: 'Conductores y Acompañantes',
      description: 'Excelente para choferes con experiencia que quieren expandir sus servicios al área de custodia.'
    }
  ];

  return (
    <section id={id} className="py-20 bg-background">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center space-y-4 text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight text-corporate-black sm:text-4xl md:text-5xl">¿Para quién es ideal?</h2>
          <p className="mx-auto max-w-[700px] text-corporate-gray md:text-xl">
            Si te identificas con alguno de estos perfiles, nuestro programa de custodios es perfecto para ti
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
          {audiences.map((audience, index) => (
            <div key={index} className="flex flex-col items-center text-center space-y-6 p-6 rounded-xl corporate-card hover-lift">
              <div className="rounded-full bg-corporate-red/10 p-5">
                {audience.icon}
              </div>
              <h3 className="text-2xl font-bold text-corporate-black">{audience.title}</h3>
              <p className="text-corporate-gray text-lg max-w-xs">{audience.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
