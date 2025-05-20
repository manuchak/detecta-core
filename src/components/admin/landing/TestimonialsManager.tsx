
import React, { useState } from 'react';
import { useTestimonials } from '@/hooks';
import { useForm } from 'react-hook-form';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Plus, Pencil, Trash2 } from 'lucide-react';
import { StarRating } from '@/components/ui/star-rating';
import { Testimonial } from '@/hooks/useTestimonials';
import { useToast } from '@/hooks';

export const TestimonialsManager = () => {
  const { toast } = useToast();
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  
  const { 
    testimonials, 
    isLoading: isLoadingTestimonials, 
    saveTestimonial: saveTestimonialMutation,
    deleteTestimonial: deleteTestimonialMutation
  } = useTestimonials();
  
  // Initialize form
  const testimonialForm = useForm<Partial<Testimonial>>({
    defaultValues: {
      name: '',
      role: '',
      company: '',
      text: '',
      avatar_url: '',
      rating: 0,
    }
  });

  const onSubmitTestimonial = (data: Partial<Testimonial>) => {
    if (editingTestimonial) {
      saveTestimonialMutation.mutate({ ...data, id: editingTestimonial.id }, {
        onSuccess: () => {
          toast({
            title: "Testimonio actualizado",
            description: "El testimonio ha sido actualizado correctamente.",
          });
          handleCancelEdit();
        },
        onError: () => {
          toast({
            title: "Error al actualizar",
            description: "No se pudo actualizar el testimonio.",
            variant: "destructive",
          });
        }
      });
    } else {
      saveTestimonialMutation.mutate(data, {
        onSuccess: () => {
          toast({
            title: "Testimonio añadido",
            description: "El nuevo testimonio ha sido añadido correctamente.",
          });
          testimonialForm.reset();
        },
        onError: () => {
          toast({
            title: "Error al añadir",
            description: "No se pudo añadir el testimonio.",
            variant: "destructive",
          });
        }
      });
    }
  };

  const handleEdit = (testimonial: Testimonial) => {
    setEditingTestimonial(testimonial);
    // Map the testimonial to form fields, ensuring compatibility between old and new format
    testimonialForm.reset({
      name: testimonial.name,
      role: testimonial.role,
      company: testimonial.company || '',
      text: testimonial.text || testimonial.quote,
      avatar_url: testimonial.avatar_url || testimonial.image,
      rating: testimonial.rating || 0,
    });
  };

  const handleDelete = (id: number) => {
    if (confirm('¿Estás seguro de que deseas eliminar este testimonio?')) {
      deleteTestimonialMutation.mutate(id, {
        onSuccess: () => {
          toast({
            title: "Testimonio eliminado",
            description: "El testimonio ha sido eliminado correctamente.",
          });
        },
        onError: () => {
          toast({
            title: "Error al eliminar",
            description: "No se pudo eliminar el testimonio.",
            variant: "destructive",
          });
        }
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingTestimonial(null);
    testimonialForm.reset();
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Gestión de Testimonios</CardTitle>
          <CardDescription>
            Añade, edita o elimina testimonios que se mostrarán en la landing page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...testimonialForm}>
            <form onSubmit={testimonialForm.handleSubmit(onSubmitTestimonial)} className="space-y-4">
              <FormField
                control={testimonialForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input placeholder="Nombre del cliente" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={testimonialForm.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cargo</FormLabel>
                      <FormControl>
                        <Input placeholder="Cargo del cliente" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={testimonialForm.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Empresa</FormLabel>
                      <FormControl>
                        <Input placeholder="Empresa del cliente" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={testimonialForm.control}
                name="text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Testimonio</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Escribe el testimonio aquí..." 
                        className="min-h-[120px]" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={testimonialForm.control}
                name="rating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valoración</FormLabel>
                    <FormControl>
                      <div className="py-2">
                        <StarRating 
                          rating={field.value || 0} 
                          onChange={field.onChange} 
                          size={24} 
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Selecciona de 1 a 5 estrellas según la experiencia
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={testimonialForm.control}
                name="avatar_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL de Avatar (opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://ejemplo.com/avatar.jpg" {...field} />
                    </FormControl>
                    <FormDescription>
                      Deja en blanco para usar iniciales
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex gap-2">
                <Button type="submit" disabled={saveTestimonialMutation.isPending}>
                  {saveTestimonialMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : editingTestimonial ? (
                    <Pencil className="mr-2 h-4 w-4" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  {editingTestimonial ? 'Actualizar' : 'Añadir'} Testimonio
                </Button>
                {editingTestimonial && (
                  <Button type="button" variant="outline" onClick={handleCancelEdit}>
                    Cancelar
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      <h3 className="text-xl font-semibold mt-8 mb-4">Testimonios Actuales</h3>
      
      {isLoadingTestimonials ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : testimonials && testimonials.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.id}>
              <CardContent className="pt-6">
                <p className="italic text-muted-foreground mb-4">
                  "{testimonial.text || testimonial.quote}"
                </p>
                <div className="mb-4">
                  <StarRating rating={testimonial.rating || 0} size={16} />
                </div>
                <div className="flex items-center">
                  <Avatar className="h-10 w-10 mr-3">
                    <AvatarImage src={testimonial.avatar_url || testimonial.image} />
                    <AvatarFallback>
                      {testimonial.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {testimonial.role}{testimonial.company ? `, ${testimonial.company}` : ''}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleEdit(testimonial)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDelete(testimonial.id)}
                      disabled={deleteTestimonialMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-muted/50">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">
              No hay testimonios disponibles
            </p>
            <Button variant="outline" onClick={() => testimonialForm.reset()}>
              <Plus className="mr-2 h-4 w-4" />
              Añadir el primer testimonio
            </Button>
          </CardContent>
        </Card>
      )}
    </>
  );
};
