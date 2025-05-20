import React, { useState, useEffect } from 'react';
import { useAuth, useToast, useTestimonials, useHeroSettings } from '@/hooks';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
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
import { useForm } from 'react-hook-form';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Plus, Pencil, Trash2, Save, Image } from 'lucide-react';
import { Navigate, Link } from 'react-router-dom';
import { Testimonial } from '@/hooks/useTestimonials';
import { StarRating } from '@/components/ui/star-rating';
import { HeroSettings } from '@/hooks/useHeroSettings';

const LandingManager = () => {
  // Always call all hooks at the top level
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('testimonios');
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [hasAccess, setHasAccess] = useState(true); // Default to true to prevent immediate redirect
  const [shouldRedirect, setShouldRedirect] = useState(false);
  
  // Use the testimonials hook - always call this regardless of access
  const { 
    testimonials, 
    isLoading: isLoadingTestimonials, 
    saveTestimonial: saveTestimonialMutation,
    deleteTestimonial: deleteTestimonialMutation
  } = useTestimonials();

  // Use the hero settings hook
  const {
    heroSettings,
    isLoading: isLoadingHeroSettings,
    saveHeroSettings: saveHeroSettingsMutation
  } = useHeroSettings();
  
  // Initialize the testimonial form
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

  // Initialize the hero settings form
  const heroForm = useForm<HeroSettings>({
    defaultValues: heroSettings
  });

  // Update hero form when settings load
  useEffect(() => {
    if (!isLoadingHeroSettings && heroSettings) {
      heroForm.reset(heroSettings);
    }
  }, [isLoadingHeroSettings, heroSettings, heroForm]);
  
  // Check access permissions in useEffect
  useEffect(() => {
    const checkAccess = () => {
      const hasPermission = !!user && (userRole === 'admin' || userRole === 'owner' || userRole === 'bi' || userRole === 'supply_admin');
      
      setHasAccess(hasPermission);
      
      if (!hasPermission) {
        toast({
          title: "Acceso denegado",
          description: "No tienes permisos para acceder a esta página. Tu rol actual es: " + (userRole || "sin rol"),
          variant: "destructive",
        });
        setShouldRedirect(true);
      }
    };
    
    // Check access when user or userRole changes
    checkAccess();
  }, [user, userRole, toast]);

  // Move redirect logic here to ensure all hooks are always called
  if (shouldRedirect) {
    return <Navigate to="/dashboard" replace />;
  }

  const onSubmitTestimonial = (data: Partial<Testimonial>) => {
    if (editingTestimonial) {
      saveTestimonialMutation.mutate({ ...data, id: editingTestimonial.id });
    } else {
      saveTestimonialMutation.mutate(data);
    }
  };

  const onSubmitHeroSettings = (data: HeroSettings) => {
    saveHeroSettingsMutation.mutate(data, {
      onSuccess: () => {
        toast({
          title: "Cambios guardados",
          description: "Los ajustes de la sección Hero han sido actualizados correctamente.",
        });
      },
      onError: (error) => {
        toast({
          title: "Error al guardar",
          description: "No se pudieron guardar los cambios: " + error,
          variant: "destructive",
        });
      }
    });
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
      deleteTestimonialMutation.mutate(id);
    }
  };

  const handleCancelEdit = () => {
    setEditingTestimonial(null);
    testimonialForm.reset();
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Administrador de Landing Page</h1>
        <Link to="/" className="text-sm text-primary hover:underline">
          Ver Landing Page
        </Link>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-8">
          <TabsTrigger value="testimonios">Testimonios</TabsTrigger>
          <TabsTrigger value="hero">Sección Hero</TabsTrigger>
          <TabsTrigger value="beneficios">Beneficios</TabsTrigger>
          <TabsTrigger value="precios">Precios</TabsTrigger>
        </TabsList>
        
        <TabsContent value="testimonios" className="space-y-6">
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
        </TabsContent>
        
        <TabsContent value="hero">
          <Card>
            <CardHeader>
              <CardTitle>Sección Hero</CardTitle>
              <CardDescription>
                Configura el texto principal y la imagen de la sección hero.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingHeroSettings ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <Form {...heroForm}>
                  <form onSubmit={heroForm.handleSubmit(onSubmitHeroSettings)} className="space-y-6">
                    <FormField
                      control={heroForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Título Principal</FormLabel>
                          <FormControl>
                            <Input placeholder="Título de la sección Hero" {...field} />
                          </FormControl>
                          <FormDescription>
                            Si incluyes "Custodios Elite" en el texto, se resaltará con color naranja
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={heroForm.control}
                      name="subtitle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subtítulo</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Descripción breve" 
                              className="min-h-[80px]" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={heroForm.control}
                        name="ctaButtonText"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Texto Botón Principal</FormLabel>
                            <FormControl>
                              <Input placeholder="Ej: Regístrate ahora" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={heroForm.control}
                        name="secondaryButtonText"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Texto Botón Secundario</FormLabel>
                            <FormControl>
                              <Input placeholder="Ej: Conoce más" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={heroForm.control}
                      name="imageUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>URL de Imagen</FormLabel>
                          <FormControl>
                            <Input placeholder="https://ejemplo.com/imagen.jpg" {...field} />
                          </FormControl>
                          <FormDescription>
                            URL de la imagen principal que aparecerá en la sección Hero
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="relative mt-6 border border-border/60 rounded-lg overflow-hidden">
                      <div className="aspect-video w-full bg-muted flex items-center justify-center">
                        {heroForm.getValues().imageUrl ? (
                          <img 
                            src={heroForm.getValues().imageUrl} 
                            alt="Vista previa" 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = 'https://placehold.co/600x400/orange/white?text=Imagen+no+disponible';
                            }}
                          />
                        ) : (
                          <div className="text-center p-8">
                            <Image className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground">
                              Vista previa de imagen
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full md:w-auto" 
                      disabled={saveHeroSettingsMutation.isPending || !heroForm.formState.isDirty}
                    >
                      {saveHeroSettingsMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="mr-2 h-4 w-4" />
                      )}
                      Guardar Cambios
                    </Button>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="beneficios">
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Beneficios</CardTitle>
              <CardDescription>
                Configura los beneficios que se mostrarán en la landing page.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Funcionalidad en desarrollo. Pronto podrás editar esta sección.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="precios">
          <Card>
            <CardHeader>
              <CardTitle>Precios y Planes</CardTitle>
              <CardDescription>
                Configura los planes y precios que se mostrarán en la landing page.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Funcionalidad en desarrollo. Pronto podrás editar esta sección.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LandingManager;
