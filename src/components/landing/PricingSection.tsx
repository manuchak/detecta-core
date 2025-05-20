
import React from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface PricingSectionProps {
  id?: string;
}

export const PricingSection: React.FC<PricingSectionProps> = ({ id }) => {
  const earningPlans = [
    {
      name: 'Custodio Inicial',
      earnings: '$5,000 - $10,000',
      period: 'mensuales',
      description: 'Para custodios que están comenzando',
      features: [
        'Hasta 15 servicios mensuales',
        'Capacitación básica',
        'Equipo estándar',
        'Soporte por app'
      ],
      cta: 'Comenzar Ahora',
      popular: false
    },
    {
      name: 'Custodio Profesional',
      earnings: '$12,000 - $20,000',
      period: 'mensuales',
      description: 'Para custodios con experiencia',
      features: [
        'Hasta 30 servicios mensuales',
        'Capacitación avanzada',
        'Equipo premium',
        'Servicios de mayor valor',
        'Prioridad en asignaciones',
        'Bonificaciones por excelencia'
      ],
      cta: 'Únete como Profesional',
      popular: true
    }
  ];

  return (
    <section id={id} className="py-20 bg-muted/30">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center space-y-4 text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">Potencial de Ingresos</h2>
          <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
            Estos son los ingresos promedio que puedes generar como parte de nuestro equipo de custodios
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {earningPlans.map((plan, index) => (
            <div key={index} className={`flex flex-col p-8 rounded-xl ${plan.popular ? 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200' : 'bg-card border-border/40'} border shadow-lg`}>
              {plan.popular && (
                <div className="py-1 px-3 text-xs bg-orange-500 text-white rounded-full self-start mb-4 font-medium">
                  Más Demandado
                </div>
              )}
              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <div className="flex items-baseline mb-4">
                <span className="text-3xl font-bold">{plan.earnings}</span>
                <span className="text-muted-foreground ml-2">{plan.period}</span>
              </div>
              <p className="text-muted-foreground mb-6">{plan.description}</p>
              <ul className="space-y-3 mb-8 flex-grow">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center">
                    <Check className="h-5 w-5 text-orange-500 mr-3" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Link to="/register">
                <Button className={`w-full ${plan.popular ? 'bg-orange-500 hover:bg-orange-600' : 'bg-muted hover:bg-muted/80'}`}>
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
