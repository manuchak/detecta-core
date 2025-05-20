
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShieldCheck } from 'lucide-react';
import { useHeroSettings } from '@/hooks/useHeroSettings';
import { Skeleton } from '@/components/ui/skeleton';

export const HeroSection = () => {
  const { heroSettings, isLoading, refetch } = useHeroSettings();

  // Actualizar la configuración cada 30 segundos para asegurar sincronización
  useEffect(() => {
    // Refetch inicial
    refetch();
    
    // Configurar intervalo de actualización
    const refreshInterval = setInterval(() => {
      refetch();
    }, 30000); // 30 segundos
    
    return () => clearInterval(refreshInterval);
  }, [refetch]);

  return (
    <section className="py-20 md:py-28 bg-gradient-to-b from-orange-50 to-background overflow-hidden">
      <div className="container px-4 md:px-6 relative">
        <div className="flex flex-col md:flex-row items-center gap-10">
          {/* Left content */}
          <div className="flex flex-col space-y-6 max-w-lg md:max-w-2xl animate-fade-in">
            <div className="inline-flex items-center rounded-lg bg-muted px-3 py-1 text-sm self-start">
              <ShieldCheck className="mr-1 h-4 w-4 text-orange-500" />
              <span>Únete a nuestra red de custodios de confianza</span>
            </div>
            
            {isLoading ? (
              <>
                <Skeleton className="h-12 w-full max-w-md mb-2" />
                <Skeleton className="h-12 w-full max-w-md" />
                <Skeleton className="h-20 w-full" />
                <div className="flex flex-col sm:flex-row gap-4">
                  <Skeleton className="h-10 w-32" />
                  <Skeleton className="h-10 w-32" />
                </div>
              </>
            ) : (
              <>
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl/none">
                  {heroSettings.title.includes("Custodios Elite") ? (
                    <>
                      <span className="block">{heroSettings.title.split("Custodios Elite")[0]}</span>
                      <span className="block text-orange-500">Custodios Elite</span>
                    </>
                  ) : (
                    <span className="block">{heroSettings.title}</span>
                  )}
                </h1>
                
                <p className="text-xl text-muted-foreground md:text-2xl">
                  {heroSettings.subtitle}
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link to="/register">
                    <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white font-medium px-8">
                      {heroSettings.ctaButtonText}
                    </Button>
                  </Link>
                  <a href="#benefits">
                    <Button size="lg" variant="outline">
                      {heroSettings.secondaryButtonText}
                    </Button>
                  </a>
                </div>
              </>
            )}
          </div>
          
          {/* Right image */}
          <div className="hidden md:block relative w-full max-w-md lg:max-w-lg">
            <div className="relative z-10 rounded-2xl overflow-hidden shadow-2xl border border-border/40 bg-card">
              {isLoading ? (
                <Skeleton className="w-full aspect-[3/4]" />
              ) : (
                <img 
                  src={heroSettings.imageUrl} 
                  alt="Custodio profesional"
                  className="w-full h-auto"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-6">
                <div className="text-white">
                  <p className="font-medium text-lg">Comienza hoy mismo</p>
                  <p className="opacity-80">Y únete a nuestro equipo de custodios profesionales</p>
                </div>
              </div>
            </div>
            <div className="absolute top-1/2 -left-10 w-28 h-28 bg-orange-500/30 rounded-full blur-3xl -z-10"></div>
            <div className="absolute bottom-10 right-0 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl -z-10"></div>
          </div>
        </div>
      </div>
    </section>
  );
};
