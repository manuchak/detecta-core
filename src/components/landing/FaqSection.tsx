
import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface FaqSectionProps {
  id?: string;
}

export const FaqSection: React.FC<FaqSectionProps> = ({ id }) => {
  const faqs = [
    {
      question: "¿Qué requisitos necesito para ser custodio?",
      answer: "Necesitas ser mayor de edad, tener antecedentes limpios, completar nuestra capacitación y contar con un smartphone compatible con nuestra aplicación."
    },
    {
      question: "¿Cómo se asignan los servicios de custodia?",
      answer: "Los servicios se asignan según tu ubicación, disponibilidad y nivel de experiencia a través de nuestra plataforma. Puedes aceptar o rechazar según tu conveniencia."
    },
    {
      question: "¿Qué tipo de capacitación proporcionan?",
      answer: "Ofrecemos una capacitación completa que incluye protocolos de seguridad, manejo de situaciones de riesgo, primeros auxilios básicos y uso de nuestras herramientas tecnológicas."
    },
    {
      question: "¿Cuándo recibo mis pagos por los servicios?",
      answer: "Los pagos se realizan semanalmente, cada viernes, directamente a tu cuenta bancaria registrada en el sistema."
    },
    {
      question: "¿Tengo que pagar algo para registrarme como custodio?",
      answer: "No, el registro es completamente gratuito. No cobramos cuotas de inscripción ni por el equipamiento básico que proporcionamos."
    },
    {
      question: "¿Puedo trabajar como custodio a tiempo parcial?",
      answer: "¡Absolutamente! Nuestro sistema está diseñado para adaptarse a tu disponibilidad, ya sea tiempo completo o parcial. Tú decides cuándo y cuántos servicios tomar."
    }
  ];

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
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-lg font-medium text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-base">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};
