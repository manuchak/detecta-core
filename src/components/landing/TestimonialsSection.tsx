
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface Testimonial {
  id: number;
  name: string;
  role: string;
  company: string;
  text: string;
  avatar_url?: string;
}

interface TestimonialsSectionProps {
  id?: string;
}

export const TestimonialsSection: React.FC<TestimonialsSectionProps> = ({ id }) => {
  const { data: testimonials, isLoading } = useQuery({
    queryKey: ['testimonials'],
    queryFn: async () => {
      try {
        // Simulamos datos para la landing page
        // En una implementación real, esto vendría de la base de datos
        return [
          {
            id: 1,
            name: 'María Rodríguez',
            role: 'Directora de Operaciones',
            company: 'Logística Express',
            text: 'Lead Flow Navigator ha transformado la manera en que gestionamos nuestros leads. La eficiencia ha aumentado un 40% desde que empezamos a utilizarlo.',
            avatar_url: '',
          },
          {
            id: 2,
            name: 'Carlos Hernández',
            role: 'Gerente de Ventas',
            company: 'TransporTech',
            text: 'La capacidad de monitorear nuestros vehículos en tiempo real nos ha permitido mejorar significativamente nuestro servicio al cliente.',
            avatar_url: '',
          },
          {
            id: 3,
            name: 'Laura Méndez',
            role: 'CEO',
            company: 'Seguridad Integral',
            text: 'El sistema de asignación de custodios ha simplificado enormemente nuestra operación diaria. Un producto excelente con un soporte aún mejor.',
            avatar_url: '',
          }
        ] as Testimonial[];
      } catch (error) {
        console.error('Error fetching testimonials:', error);
        return [];
      }
    },
  });

  return (
    <section id={id} className="py-16 bg-background">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center space-y-4 text-center mb-10">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">Testimonios</h2>
          <p className="mx-auto max-w-[700px] text-muted-foreground md:text-lg">
            Lo que nuestros clientes dicen sobre nosotros
          </p>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            {testimonials?.map((testimonial) => (
              <Card key={testimonial.id} className="bg-card border-border/40">
                <CardContent className="p-6">
                  <p className="text-muted-foreground mb-6 italic">
                    "{testimonial.text}"
                  </p>
                  <div className="flex items-center">
                    <Avatar className="h-12 w-12 mr-4">
                      <AvatarImage src={testimonial.avatar_url} />
                      <AvatarFallback>{testimonial.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-medium">{testimonial.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {testimonial.role}, {testimonial.company}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
