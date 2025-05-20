
import React, { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface Price {
  id: string;
  name: string;
  earnings: string;
  period: string;
  description: string;
  cta: string;
  popular: boolean;
  features?: string[];
  order: number;
}

interface PricingSectionProps {
  id?: string;
}

export const PricingSection: React.FC<PricingSectionProps> = ({ id }) => {
  const [earningPlans, setEarningPlans] = useState<Price[]>([]);
  const [loading, setLoading] = useState(true);

  // Datos de ejemplo para features (ya que no están en la BD)
  const defaultFeatures = {
    basic: [
      'Hasta 15 servicios mensuales',
      'Capacitación básica',
      'Equipo estándar',
      'Soporte por app'
    ],
    pro: [
      'Hasta 30 servicios mensuales',
      'Capacitación avanzada',
      'Equipo premium',
      'Servicios de mayor valor',
      'Prioridad en asignaciones',
      'Bonificaciones por excelencia'
    ]
  };

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('prices')
          .select('*')
          .order('order', { ascending: true });

        if (error) {
          throw error;
        }

        // Asignar features según si es popular o no
        const plansWithFeatures = data?.map(plan => ({
          ...plan,
          features: plan.popular ? defaultFeatures.pro : defaultFeatures.basic
        })) || [];

        setEarningPlans(plansWithFeatures);
      } catch (error) {
        console.error('Error fetching prices:', error);
        // Datos de respaldo en caso de error
        setEarningPlans([
          {
            id: '1',
            name: 'Custodio Inicial',
            earnings: '$5,000 - $10,000',
            period: 'mensuales',
            description: 'Para custodios que están comenzando',
            features: defaultFeatures.basic,
            cta: 'Comenzar Ahora',
            popular: false,
            order: 1
          },
          {
            id: '2',
            name: 'Custodio Profesional',
            earnings: '$12,000 - $20,000',
            period: 'mensuales',
            description: 'Para custodios con experiencia',
            features: defaultFeatures.pro,
            cta: 'Únete como Profesional',
            popular: true,
            order: 2
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchPrices();
  }, []);

  return (
    <section id={id} className="py-20 bg-muted/30">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center space-y-4 text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">Potencial de Ingresos</h2>
          <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
            Estos son los ingresos promedio que puedes generar como parte de nuestro equipo de custodios
          </p>
        </div>
        
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse flex flex-col p-8 rounded-xl bg-card border border-border/40 shadow-lg">
                <div className="h-6 bg-muted rounded w-1/2 mb-4"></div>
                <div className="h-8 bg-muted rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-muted/50 rounded w-full mb-6"></div>
                <div className="space-y-3 mb-8">
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j} className="flex items-center">
                      <div className="h-5 w-5 rounded-full bg-muted mr-3"></div>
                      <div className="h-4 bg-muted/50 rounded w-4/5"></div>
                    </div>
                  ))}
                </div>
                <div className="h-10 bg-muted rounded w-full mt-auto"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {earningPlans.map((plan) => (
              <div key={plan.id} className={`flex flex-col p-8 rounded-xl ${plan.popular ? 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200' : 'bg-card border-border/40'} border shadow-lg`}>
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
                  {plan.features?.map((feature, i) => (
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
        )}
      </div>
    </section>
  );
};
