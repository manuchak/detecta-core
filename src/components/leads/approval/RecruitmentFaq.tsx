import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { HelpCircle, User, Car, Shield, Clock, FileText, Map } from "lucide-react";

const recruitmentFaqs = [
  {
    id: '1',
    question: "¿Cómo evaluar la experiencia en custodia de un candidato?",
    answer: "Pregunta sobre trabajos anteriores en seguridad, tiempo de experiencia, tipos de servicios realizados y referencias verificables. La experiencia mínima recomendada es de 1 año en seguridad privada.",
    category: "experience",
    icon: Shield
  },
  {
    id: '2',
    question: "¿Qué documentos son obligatorios para aprobar a un candidato?",
    answer: "Identificación oficial vigente, antecedentes no penales (no mayor a 3 meses), licencia de conducir vigente, comprobante de domicilio y referencias laborales verificables.",
    category: "documents",
    icon: FileText
  },
  {
    id: '3',
    question: "¿Cómo validar la disponibilidad de horarios del candidato?",
    answer: "Confirma horarios específicos, días disponibles, flexibilidad para servicios de emergencia y si tiene otros trabajos que puedan interferir con los servicios asignados.",
    category: "availability",
    icon: Clock
  },
  {
    id: '4',
    question: "¿Qué preguntar sobre el vehículo del candidato?",
    answer: "Año del vehículo (máximo 15 años), estado mecánico, seguro vigente con cobertura amplia, placas al corriente y capacidad para transportar clientes de manera segura.",
    category: "vehicle",
    icon: Car
  },
  {
    id: '5',
    question: "¿Cómo evaluar la zona de trabajo del candidato?",
    answer: "Verifica que viva o tenga fácil acceso a la zona donde trabajará, conocimiento del área, tiempo de traslado y disponibilidad para servicios en zonas cercanas.",
    category: "location",
    icon: Map
  },
  {
    id: '6',
    question: "¿Qué hacer si falta información importante del candidato?",
    answer: "Programa una segunda entrevista, solicita documentos faltantes por correo, establece un plazo para completar información y documenta todo en las notas del sistema.",
    category: "process",
    icon: User
  }
];

interface RecruitmentFaqProps {
  className?: string;
}

export const RecruitmentFaq: React.FC<RecruitmentFaqProps> = ({ className }) => {
  return (
    <div className={`bg-slate-50 rounded-lg p-4 ${className || ''}`}>
      <div className="flex items-center gap-2 mb-4">
        <HelpCircle className="h-5 w-5 text-blue-600" />
        <h3 className="font-semibold text-gray-900">Guía para Analistas</h3>
        <Badge variant="outline" className="text-xs">
          FAQ
        </Badge>
      </div>
      
      <Accordion type="single" collapsible className="w-full">
        {recruitmentFaqs.map((faq) => {
          const IconComponent = faq.icon;
          return (
            <AccordionItem key={faq.id} value={`faq-${faq.id}`} className="border-b border-slate-200">
              <AccordionTrigger className="text-left text-sm py-3 hover:no-underline">
                <div className="flex items-center gap-2">
                  <IconComponent className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  <span className="font-medium">{faq.question}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground pb-3">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
};