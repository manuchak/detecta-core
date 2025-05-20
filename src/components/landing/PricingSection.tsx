
import React from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface PricingSectionProps {
  id?: string;
}

export const PricingSection: React.FC<PricingSectionProps> = ({ id }) => {
  const plans = [
    {
      name: 'Básico',
      price: '$0',
      description: 'Para pequeños equipos que están comenzando',
      features: [
        'Hasta 100 leads por mes',
        'Dashboard básico',
        'Acceso a 1 usuario',
        'Soporte por email'
      ],
      cta: 'Comenzar Gratis',
      popular: false
    },
    {
      name: 'Profesional',
      price: '$30',
      description: 'Para empresas en crecimiento',
      features: [
        'Leads ilimitados',
        'Dashboard avanzado',
        'Hasta 5 usuarios',
        'Monitoreo en tiempo real',
        'Soporte prioritario',
        'Integraciones personalizadas'
      ],
      cta: 'Suscribirse Ahora',
      popular: true
    }
  ];

  return (
    <section id={id} className="py-16 bg-background">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center space-y-4 text-center mb-10">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">Precios</h2>
          <p className="mx-auto max-w-[700px] text-muted-foreground md:text-lg">
            Planes flexibles que crecen con tu negocio
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan, index) => (
            <div key={index} className={`flex flex-col p-6 bg-card rounded-lg border ${plan.popular ? 'border-primary shadow-lg' : 'border-border/40 shadow-sm'}`}>
              {plan.popular && (
                <div className="py-1 px-3 text-xs bg-primary text-primary-foreground rounded-full self-start mb-4">
                  Más Popular
                </div>
              )}
              <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
              <div className="flex items-baseline mb-4">
                <span className="text-3xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground ml-2">/mes por usuario</span>
              </div>
              <p className="text-muted-foreground mb-6">{plan.description}</p>
              <ul className="space-y-3 mb-8 flex-grow">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center">
                    <Check className="h-4 w-4 text-primary mr-3" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Link to="/register">
                <Button className={`w-full ${plan.popular ? 'bg-primary' : 'bg-muted'}`}>
                  {plan.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
