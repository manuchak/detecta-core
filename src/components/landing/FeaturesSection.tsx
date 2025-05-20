
import React from 'react';
import { Check } from 'lucide-react';

interface FeaturesSectionProps {
  id?: string;
}

export const FeaturesSection: React.FC<FeaturesSectionProps> = ({ id }) => {
  const features = [
    {
      title: 'Gestión Integral de Leads',
      description: 'Captura, organiza y da seguimiento a tus leads de manera eficiente con nuestro sistema intuitivo.'
    },
    {
      title: 'Monitoreo en Tiempo Real',
      description: 'Visualiza el estado de tus operaciones en tiempo real con dashboards personalizables y alertas.'
    },
    {
      title: 'Asignación Inteligente',
      description: 'Asigna automáticamente leads y tareas basado en reglas predefinidas y cargas de trabajo.'
    },
    {
      title: 'Seguimiento de Servicios',
      description: 'Mantén un control completo sobre tus servicios y estado de cada instalación GPS.'
    },
    {
      title: 'Reportes Avanzados',
      description: 'Genera reportes detallados y analiza tu rendimiento con gráficas interactivas.'
    },
    {
      title: 'Soporte Integrado',
      description: 'Sistema de tickets integrado para resolución de problemas y seguimiento de incidencias.'
    }
  ];

  return (
    <section id={id} className="py-16 bg-muted/50">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center space-y-4 text-center mb-10">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">Funcionalidades que amarás</h2>
          <p className="mx-auto max-w-[700px] text-muted-foreground md:text-lg">
            Diseñadas para optimizar tu flujo de trabajo y mejorar la eficiencia operativa.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          {features.map((feature, index) => (
            <div key={index} className="border rounded-lg p-6 bg-card shadow-sm">
              <div className="flex items-center mb-4">
                <div className="rounded-full bg-primary/10 p-1 mr-3">
                  <Check className="h-4 w-4 text-primary" />
                </div>
                <h3 className="font-semibold">{feature.title}</h3>
              </div>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
