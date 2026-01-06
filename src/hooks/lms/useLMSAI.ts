import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type AIAction = 
  | "generate_course_metadata"
  | "generate_course_structure"
  | "generate_quiz_questions"
  | "generate_flashcards"
  | "generate_rich_text"
  | "generate_image";

interface CourseMetadata {
  codigo: string;
  descripcion: string;
  categoria: string;
  nivel: string;
}

interface ModuloSugerido {
  titulo: string;
  descripcion: string;
  contenidos: {
    titulo: string;
    tipo: string;
    duracion_min: number;
  }[];
}

interface CourseStructure {
  modulos: ModuloSugerido[];
}

interface QuizQuestion {
  question: string;
  type: "single" | "multiple";
  options: {
    id: string;
    text: string;
    isCorrect: boolean;
  }[];
  explanation: string;
}

interface Flashcard {
  front: string;
  back: string;
}

export function useLMSAI() {
  const [loading, setLoading] = useState(false);

  const invokeAI = async <T>(action: AIAction, data: Record<string, unknown>): Promise<T | null> => {
    setLoading(true);
    try {
      const { data: response, error } = await supabase.functions.invoke("lms-ai-assistant", {
        body: { action, data },
      });

      if (error) {
        console.error("[useLMSAI] Error:", error);
        toast.error("Error al generar contenido con IA");
        return null;
      }

      if (response?.error) {
        console.error("[useLMSAI] API Error:", response.error);
        toast.error(response.error);
        return null;
      }

      return response?.data as T;
    } catch (err) {
      console.error("[useLMSAI] Exception:", err);
      toast.error("Error inesperado al generar contenido");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const generateCourseMetadata = async (titulo: string): Promise<CourseMetadata | null> => {
    return invokeAI<CourseMetadata>("generate_course_metadata", { titulo });
  };

  const generateCourseStructure = async (
    tema: string, 
    duracion_min: number, 
    num_modulos?: number
  ): Promise<CourseStructure | null> => {
    return invokeAI<CourseStructure>("generate_course_structure", { 
      tema, 
      duracion_min, 
      num_modulos 
    });
  };

  const generateQuizQuestions = async (
    tema: string, 
    cantidad?: number, 
    contexto?: string
  ): Promise<{ questions: QuizQuestion[] } | null> => {
    return invokeAI<{ questions: QuizQuestion[] }>("generate_quiz_questions", { 
      tema, 
      cantidad, 
      contexto 
    });
  };

  const generateFlashcards = async (
    tema: string, 
    cantidad?: number, 
    contexto?: string
  ): Promise<{ cards: Flashcard[] } | null> => {
    return invokeAI<{ cards: Flashcard[] }>("generate_flashcards", { 
      tema, 
      cantidad, 
      contexto 
    });
  };

  const generateRichText = async (
    tema: string, 
    contexto?: string, 
    longitud?: "corta" | "media" | "larga"
  ): Promise<{ html: string } | null> => {
    return invokeAI<{ html: string }>("generate_rich_text", { 
      tema, 
      contexto, 
      longitud 
    });
  };

  const generateCourseImage = async (
    titulo: string,
    descripcion?: string
  ): Promise<{ imageBase64: string } | null> => {
    return invokeAI<{ imageBase64: string }>("generate_image", {
      titulo,
      descripcion
    });
  };

  return {
    loading,
    generateCourseMetadata,
    generateCourseStructure,
    generateQuizQuestions,
    generateFlashcards,
    generateRichText,
    generateCourseImage,
  };
}
