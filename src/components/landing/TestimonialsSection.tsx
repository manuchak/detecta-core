
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';

interface TestimonialsSectionProps {
  id?: string;
}

export const TestimonialsSection: React.FC<TestimonialsSectionProps> = ({ id }) => {
  const testimonials = [
    {
      name: 'Carlos Mendoza',
      role: 'Custodio desde 2022',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=774&q=80',
      quote: 'Ser custodio me ha permitido generar ingresos extras mientras mantengo mi trabajo principal. La flexibilidad de horarios es inmejorable y el pago es muy competitivo.'
    },
    {
      name: 'Alejandra Torres',
      role: 'Custodia desde 2023',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=774&q=80',
      quote: 'La capacitación que recibí fue excelente y me siento segura en cada servicio. La aplicación hace que coordinar mis horarios sea muy sencillo.'
    },
    {
      name: 'Martín Gutiérrez',
      role: 'Custodio desde 2021',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=774&q=80',
      quote: 'Lo que más valoro es la comunidad que se ha formado entre custodios. Nos apoyamos mutuamente y la empresa siempre está atenta a nuestras necesidades.'
    }
  ];

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
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="bg-card border-border/40 p-8 flex flex-col items-center text-center hover:shadow-lg transition-shadow">
              <Avatar className="w-20 h-20 border-4 border-background mb-6">
                <AvatarImage src={testimonial.image} alt={testimonial.name} />
                <AvatarFallback>{testimonial.name.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <blockquote className="text-lg italic text-muted-foreground mb-6">
                "{testimonial.quote}"
              </blockquote>
              <div>
                <h3 className="font-bold text-lg">{testimonial.name}</h3>
                <p className="text-muted-foreground">{testimonial.role}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
