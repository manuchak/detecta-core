
import React from 'react';

export const IntegrationsSection = () => {
  const integrations = [
    { name: 'Mapbox', icon: '🗺️' },
    { name: 'Supabase', icon: '⚡' },
    { name: 'API Comunicaciones', icon: '📞' },
    { name: 'Sistema de Pagos', icon: '💳' },
    { name: 'Análisis de Datos', icon: '📊' },
    { name: 'Notificaciones', icon: '🔔' }
  ];

  return (
    <section className="py-16 bg-muted/50">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center space-y-4 text-center mb-10">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">Herramientas e Integraciones</h2>
          <p className="mx-auto max-w-[700px] text-muted-foreground md:text-lg">
            Conectamos con las plataformas que necesitas para un flujo de trabajo sin interrupciones
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mt-10">
          {integrations.map((integration, index) => (
            <div key={index} className="flex flex-col items-center justify-center p-6 bg-card rounded-lg border border-border/40 shadow-sm aspect-square">
              <div className="text-4xl mb-3">{integration.icon}</div>
              <h3 className="font-medium text-center">{integration.name}</h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
