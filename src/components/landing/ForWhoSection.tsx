
import React from 'react';
import { Users, Briefcase, GitBranch } from 'lucide-react';

export const ForWhoSection = () => {
  const audiences = [
    {
      icon: <Users className="h-12 w-12 text-primary" />,
      title: 'Equipos de Ventas',
      description: 'Gestiona eficientemente tus leads y maximiza las conversiones.'
    },
    {
      icon: <Briefcase className="h-12 w-12 text-primary" />,
      title: 'Líderes de Operaciones',
      description: 'Supervisa el desempeño y optimiza tus procesos de negocio.'
    },
    {
      icon: <GitBranch className="h-12 w-12 text-primary" />,
      title: 'Empresas de Logística',
      description: 'Mejora la coordinación y seguimiento de tus servicios de transporte.'
    }
  ];

  return (
    <section className="py-16 bg-background">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center space-y-4 text-center mb-10">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">¿Para quién?</h2>
          <p className="mx-auto max-w-[700px] text-muted-foreground md:text-lg">
            Nuestra solución está diseñada para adaptarse a diferentes roles y necesidades empresariales.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
          {audiences.map((audience, index) => (
            <div key={index} className="flex flex-col items-center text-center space-y-4">
              <div className="rounded-full bg-primary/10 p-4">
                {audience.icon}
              </div>
              <h3 className="text-xl font-bold">{audience.title}</h3>
              <p className="text-muted-foreground max-w-xs">{audience.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
