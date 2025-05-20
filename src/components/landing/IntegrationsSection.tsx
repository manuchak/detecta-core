
import React from 'react';
import { Card } from '@/components/ui/card';

export const IntegrationsSection = () => {
  const tools = [
    { name: 'Aplicación Móvil', icon: '📱' },
    { name: 'GPS en Tiempo Real', icon: '🗺️' },
    { name: 'Chat Seguro', icon: '💬' },
    { name: 'Sistema de Alertas', icon: '🔔' },
    { name: 'Pagos Automáticos', icon: '💳' },
    { name: 'Planificador de Rutas', icon: '🧭' }
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center space-y-4 text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">Herramientas que facilitarán tu trabajo</h2>
          <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
            Contamos con tecnología de punta para que puedas desempeñar tu labor de forma eficiente y segura
          </p>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
          {tools.map((tool, index) => (
            <Card key={index} className="flex flex-col items-center justify-center p-6 text-center hover:bg-muted/30 transition-colors cursor-pointer">
              <div className="text-4xl mb-4">{tool.icon}</div>
              <h3 className="font-medium">{tool.name}</h3>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
