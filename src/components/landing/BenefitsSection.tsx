
import React from 'react';
import { ArrowRight, BarChart3, Clock, UserCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export const BenefitsSection = () => {
  const benefits = [
    {
      icon: <BarChart3 className="h-10 w-10 text-primary" />,
      title: 'Mejorar Rendimiento',
      description: 'Aumenta tu eficiencia operativa con nuestro sistema intuitivo de gestión de leads.'
    },
    {
      icon: <Clock className="h-10 w-10 text-primary" />,
      title: 'Ahorro de Tiempo',
      description: 'Automatiza procesos repetitivos y enfócate en lo que realmente importa.'
    },
    {
      icon: <UserCheck className="h-10 w-10 text-primary" />,
      title: 'Mejora la Satisfacción',
      description: 'Ofrece un mejor servicio a tus clientes con seguimiento y respuesta rápida.'
    }
  ];

  return (
    <section className="py-16 bg-muted/50">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center space-y-4 text-center mb-10">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">Lo que obtienes</h2>
          <p className="mx-auto max-w-[700px] text-muted-foreground md:text-lg">
            Descubre todos los beneficios que nuestra plataforma ofrece para optimizar tu negocio.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {benefits.map((benefit, index) => (
            <Card key={index} className="bg-card border-border/40 transition-all hover:shadow-md">
              <CardContent className="flex flex-col items-center p-6 text-center space-y-4">
                {benefit.icon}
                <h3 className="text-xl font-bold">{benefit.title}</h3>
                <p className="text-muted-foreground">{benefit.description}</p>
                <ArrowRight className="h-5 w-5 text-primary mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
