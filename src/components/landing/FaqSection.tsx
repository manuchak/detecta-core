
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
      question: '¿Cómo puedo comenzar con Lead Flow Navigator?',
      answer: 'Es fácil comenzar. Simplemente regístrate para una cuenta gratuita, verifica tu email, y podrás acceder a todas las funcionalidades básicas. Ofrecemos una guía de inicio rápido para ayudarte a configurar tu cuenta.'
    },
    {
      question: '¿Puedo cambiar de plan en cualquier momento?',
      answer: 'Sí, puedes actualizar o degradar tu plan en cualquier momento. Los cambios en la facturación se aplicarán en tu próximo ciclo de facturación.'
    },
    {
      question: '¿Ofrecen capacitación para nuevos usuarios?',
      answer: 'Sí, ofrecemos sesiones de capacitación gratuitas para todos los nuevos usuarios en planes profesionales. También tenemos una extensa biblioteca de tutoriales y documentación.'
    },
    {
      question: '¿Cómo funciona el soporte técnico?',
      answer: 'Ofrecemos soporte por email para todos los usuarios y soporte prioritario por chat en vivo para clientes en planes profesionales. Nuestro horario de atención es de lunes a viernes de 9am a 6pm.'
    },
    {
      question: '¿La plataforma es compatible con dispositivos móviles?',
      answer: 'Sí, nuestra plataforma es completamente responsive y funciona en cualquier dispositivo, incluyendo teléfonos móviles y tablets.'
    }
  ];

  return (
    <section id={id} className="py-16 bg-muted/50">
      <div className="container px-4 md:px-6 max-w-3xl">
        <div className="flex flex-col items-center space-y-4 text-center mb-10">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">Preguntas Frecuentes</h2>
          <p className="mx-auto max-w-[700px] text-muted-foreground md:text-lg">
            Respuestas a las consultas más comunes sobre nuestra plataforma
          </p>
        </div>
        
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
              <AccordionContent>{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};
