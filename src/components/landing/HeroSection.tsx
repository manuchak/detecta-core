
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export const HeroSection = () => {
  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center space-y-6 text-center">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
              Lead Flow Navigator CRM
            </h1>
            <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
              Gestiona tus leads y servicios con facilidad. La plataforma completa para optimizar tu flujo de trabajo.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/register">
              <Button size="lg" className="bg-primary text-primary-foreground">
                Comenzar ahora
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline">
                Iniciar Sesión
              </Button>
            </Link>
          </div>
          <div className="w-full max-w-4xl overflow-hidden rounded-lg border bg-background shadow-xl">
            <img
              src="/placeholder.svg"
              alt="Dashboard preview"
              className="w-full h-auto"
              style={{ aspectRatio: '16/9' }}
            />
          </div>
        </div>
      </div>
    </section>
  );
};
