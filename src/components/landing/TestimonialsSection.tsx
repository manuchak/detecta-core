
import React, { useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { useTestimonials } from '@/hooks';
import { Skeleton } from '@/components/ui/skeleton';
import { StarRating } from '@/components/ui/star-rating';

interface TestimonialsSectionProps {
  id?: string;
}

export const TestimonialsSection: React.FC<TestimonialsSectionProps> = ({ id }) => {
  const { testimonials, isLoading, refetch } = useTestimonials();

  // Actualizar los testimonios cada 30 segundos para asegurar sincronización
  useEffect(() => {
    // Refetch inicial
    refetch();
    
    // Configurar intervalo de actualización
    const refreshInterval = setInterval(() => {
      refetch();
    }, 30000); // 30 segundos
    
    return () => clearInterval(refreshInterval);
  }, [refetch]);

  // Mapear los testimonios para manejar tanto el formato nuevo como antiguo
  const displayTestimonials = testimonials.map(testimonial => ({
    id: testimonial.id,
    name: testimonial.name,
    role: testimonial.role,
    image: testimonial.image || testimonial.avatar_url,
    quote: testimonial.quote || testimonial.text,
    rating: testimonial.rating || 0
  }));

  return (
    <section id={id} className="py-20 bg-muted/30">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center space-y-4 text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">Lo que dicen nuestros custodios</h2>
          <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
            Conoce las experiencias de personas como tú que ya forman parte de nuestro equipo
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {isLoading ? (
            // Loading skeletons
            Array.from({ length: 3 }).map((_, index) => (
              <Card key={`skeleton-${index}`} className="bg-card border-border/40 p-8 flex flex-col items-center text-center">
                <Skeleton className="w-20 h-20 rounded-full mb-6" />
                <Skeleton className="w-full h-4 mb-2" />
                <Skeleton className="w-3/4 h-4 mb-2" />
                <Skeleton className="w-5/6 h-4 mb-6" />
                <Skeleton className="w-1/2 h-4 mb-2" />
                <Skeleton className="w-1/3 h-4" />
              </Card>
            ))
          ) : displayTestimonials.length > 0 ? (
            displayTestimonials.map((testimonial, index) => (
              <Card key={testimonial.id || index} className="bg-card border-border/40 p-8 flex flex-col items-center text-center hover:shadow-lg transition-shadow">
                <Avatar className="w-20 h-20 border-4 border-background mb-6">
                  <AvatarImage src={testimonial.image} alt={testimonial.name} />
                  <AvatarFallback>{testimonial.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <blockquote className="text-lg italic text-muted-foreground mb-4">
                  "{testimonial.quote}"
                </blockquote>
                <div className="mb-6">
                  <StarRating rating={testimonial.rating} size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{testimonial.name}</h3>
                  <p className="text-muted-foreground">{testimonial.role}</p>
                </div>
              </Card>
            ))
          ) : (
            <div className="col-span-3 text-center py-10">
              <p className="text-muted-foreground">No hay testimonios disponibles</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
