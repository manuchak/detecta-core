import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { 
  HelpCircle,
  Trash,
  PenLine,
  Plus,
  X,
  Save,
  MessageCircle
} from 'lucide-react';
import { useToast } from '@/hooks';
import { Badge } from '@/components/ui/badge';
import { useFaqs, Faq, FaqInput } from '@/hooks/useFaqs';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

const faqSchema = z.object({
  question: z.string().min(5, { message: "La pregunta debe tener al menos 5 caracteres" }),
  answer: z.string().min(10, { message: "La respuesta debe tener al menos 10 caracteres" }),
  order: z.number().default(0)
});

type FaqFormValues = z.infer<typeof faqSchema>;

export const FaqManager = () => {
  const [selectedFaq, setSelectedFaq] = useState<Faq | null>(null);
  const { toast } = useToast();
  const { faqs, loading, createFaq, updateFaq, deleteFaq, fetchFaqs } = useFaqs();

  const form = useForm<FaqFormValues>({
    resolver: zodResolver(faqSchema),
    defaultValues: {
      question: "",
      answer: "",
      order: 0
    }
  });

  useEffect(() => {
    // Reset form when selectedFaq changes
    if (selectedFaq) {
      form.reset({
        question: selectedFaq.question,
        answer: selectedFaq.answer,
        order: selectedFaq.order
      });
    } else {
      form.reset({
        question: "",
        answer: "",
        order: faqs.length
      });
    }
  }, [selectedFaq, form, faqs.length]);

  const onSubmit = async (data: FaqFormValues) => {
    try {
      // Ensure all required fields are present
      const faqInput: FaqInput = {
        question: data.question,
        answer: data.answer,
        order: data.order
      };
      
      if (selectedFaq) {
        // Updating existing FAQ
        await updateFaq(selectedFaq.id, faqInput);
        toast({
          title: "Pregunta actualizada",
          description: "La pregunta ha sido actualizada correctamente.",
        });
      } else {
        // Adding new FAQ
        await createFaq(faqInput);
        toast({
          title: "Pregunta creada",
          description: "La pregunta ha sido creada correctamente.",
        });
      }

      // Reset form and selection
      setSelectedFaq(null);
      form.reset({
        question: "",
        answer: "",
        order: faqs.length + 1
      });
      
      // Refresh faqs list
      fetchFaqs();
    } catch (error) {
      console.error('Error saving FAQ:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar la pregunta. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };

  // Edit a FAQ
  const editFaq = (faq: Faq) => {
    setSelectedFaq(faq);
    // Scroll to form
    window.scrollTo({
      top: document.getElementById('faq-form')?.offsetTop,
      behavior: 'smooth'
    });
  };

  // Cancel editing
  const cancelEdit = () => {
    setSelectedFaq(null);
    form.reset({
      question: "",
      answer: "",
      order: faqs.length
    });
  };

  // Handle FAQ deletion
  const handleDeleteFaq = async (id: string) => {
    if (window.confirm('¿Estás seguro que deseas eliminar esta pregunta?')) {
      try {
        await deleteFaq(id);
        // Refresh faqs list
        fetchFaqs();
        
        // If we're editing the FAQ that was just deleted, reset the form
        if (selectedFaq && selectedFaq.id === id) {
          cancelEdit();
        }
        
        toast({
          title: "Pregunta eliminada",
          description: "La pregunta ha sido eliminada correctamente.",
        });
      } catch (error) {
        console.error('Error deleting FAQ:', error);
        toast({
          title: "Error",
          description: "No se pudo eliminar la pregunta. Inténtalo de nuevo.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gestión de Preguntas Frecuentes</CardTitle>
          <CardDescription>
            Configura las preguntas frecuentes que se mostrarán en la landing page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-pulse flex flex-col items-center">
                <div className="h-10 w-10 bg-primary/20 rounded-full mb-4"></div>
                <div className="h-4 w-40 bg-muted rounded"></div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex justify-end mb-4">
                <Button 
                  onClick={() => {
                    cancelEdit(); // Ensure form is clean
                    window.scrollTo({
                      top: document.getElementById('faq-form')?.offsetTop,
                      behavior: 'smooth'
                    });
                  }}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Nueva Pregunta
                </Button>
              </div>
              
              {faqs.length === 0 ? (
                <div className="text-center py-8 border border-dashed rounded-lg bg-muted/10">
                  <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                    <HelpCircle className="h-6 w-6 text-primary/60" />
                  </div>
                  <h3 className="text-lg font-medium mb-1">No hay preguntas frecuentes</h3>
                  <p className="text-muted-foreground text-sm">
                    Agrega tu primera pregunta para mostrar en la landing page.
                  </p>
                </div>
              ) : (
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Pregunta</TableHead>
                        <TableHead className="hidden md:table-cell">Respuesta</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {faqs.map((faq) => (
                        <TableRow key={faq.id} className={selectedFaq?.id === faq.id ? 'bg-muted/20' : ''}>
                          <TableCell className="font-medium max-w-xs truncate">{faq.question}</TableCell>
                          <TableCell className="hidden md:table-cell max-w-md truncate">
                            {faq.answer}
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button 
                              variant={selectedFaq?.id === faq.id ? "secondary" : "outline"} 
                              size="sm" 
                              className="gap-1"
                              onClick={() => editFaq(faq)}
                            >
                              <PenLine className="h-3.5 w-3.5" />
                              Editar
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              className="gap-1"
                              onClick={() => handleDeleteFaq(faq.id)}
                            >
                              <Trash className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card id="faq-form">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{selectedFaq ? 'Editar Pregunta' : 'Agregar Nueva Pregunta'}</CardTitle>
              <CardDescription>
                {selectedFaq 
                  ? 'Modifica los datos de la pregunta seleccionada' 
                  : 'Completa el formulario para agregar una nueva pregunta frecuente'}
              </CardDescription>
            </div>
            {selectedFaq && (
              <Badge variant="outline" className="px-2 py-1">
                Editando ID: {selectedFaq.id.substring(0, 8)}...
              </Badge>
            )}
          </div>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="question"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pregunta</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej. ¿Cómo funciona el servicio?" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="answer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Respuesta</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Respuesta detallada a la pregunta" 
                        rows={4} 
                        className="resize-none" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex justify-between border-t p-6">
              <Button 
                type="button"
                variant="outline" 
                onClick={cancelEdit}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Cancelar
              </Button>
              <Button 
                type="submit"
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                {selectedFaq ? 'Actualizar' : 'Guardar'} Pregunta
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
};

export { FaqManager };
