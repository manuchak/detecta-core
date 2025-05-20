
import React, { useEffect, useState } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Faq } from '@/hooks/useFaqs';

interface FaqSectionProps {
  id?: string;
}

export const FaqSection: React.FC<FaqSectionProps> = ({ id }) => {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        setLoading(true);
        // Use fallback data since the table doesn't exist yet
        setFaqs([
          {
            id: '1',
            question: "¿Qué requisitos necesito para ser custodio?",
            answer: "Necesitas ser mayor de edad, tener antecedentes limpios, completar nuestra capacitación y contar con un smartphone compatible con nuestra aplicación.",
            order: 1
          },
          {
            id: '2',
            question: "¿Cómo se asignan los servicios de custodia?",
            answer: "Los servicios se asignan según tu ubicación, disponibilidad y nivel de experiencia a través de nuestra plataforma. Puedes aceptar o rechazar según tu conveniencia.",
            order: 2
          },
          {
            id: '3',
            question: "¿Qué tipo de capacitación proporcionan?",
            answer: "Ofrecemos una capacitación completa que incluye protocolos de seguridad, manejo de situaciones de riesgo, primeros auxilios básicos y uso de nuestras herramientas tecnológicas.",
            order: 3
          },
          {
            id: '4',
            question: "¿Cuál es el horario de trabajo?",
            answer: "Como custodio, tienes flexibilidad para elegir tus horarios. Puedes configurar tu disponibilidad en la aplicación y aceptar servicios que se ajusten a tu agenda.",
            order: 4
          },
          {
            id: '5',
            question: "¿Qué documentos necesito para registrarme?",
            answer: "Necesitarás una identificación oficial vigente, comprobante de domicilio, antecedentes no penales, licencia de conducir vigente y documentos de tu vehículo si planeas utilizarlo.",
            order: 5
          },
          {
            id: '6',
            question: "¿Cómo funciona el sistema de pagos?",
            answer: "Los pagos se realizan semanalmente mediante transferencia bancaria. El monto depende de los servicios completados, la distancia recorrida y otros factores variables.",
            order: 6
          }
        ]);
      } catch (error) {
        console.error('Error fetching FAQs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFaqs();
  }, []);

  return (
    <section id={id} className="py-20 bg-background">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center space-y-4 text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">Preguntas Frecuentes</h2>
          <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
            Respuestas a las dudas más comunes sobre nuestro programa de custodios
          </p>
        </div>
        
        <div className="max-w-3xl mx-auto">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-20 bg-muted/50 rounded w-full"></div>
                </div>
              ))}
            </div>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq) => (
                <AccordionItem key={faq.id} value={`item-${faq.id}`}>
                  <AccordionTrigger className="text-lg font-medium text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-base">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>
      </div>
    </section>
  );
};
