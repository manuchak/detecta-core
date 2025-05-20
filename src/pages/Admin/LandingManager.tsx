
import React, { useState } from 'react';
import { useAuth, useToast, useTestimonials } from '@/hooks';
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
import { Loader2, Plus, Pencil, Trash2 } from 'lucide-react';
import { Navigate, Link } from 'react-router-dom';
import { Testimonial } from '@/hooks/useTestimonials';

const LandingManager = () => {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('testimonios');
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  
  // Use the testimonials hook
  const { 
    testimonials, 
    isLoading: isLoadingTestimonials, 
    saveTestimonial: saveTestimonialMutation,
    deleteTestimonial: deleteTestimonialMutation
  } = useTestimonials();
  
  // Verificar si el usuario tiene permisos (ahora permitimos más roles)
  const hasAccess = !!user && (userRole === 'admin' || userRole === 'owner' || userRole === 'bi' || userRole === 'supply_admin');
  
  if (!hasAccess) {
    toast({
      title: "Acceso denegado",
      description: "No tienes permisos para acceder a esta página. Tu rol actual es: " + (userRole || "sin rol"),
      variant: "destructive",
    });
    return <Navigate to="/dashboard" replace />;
  }

  const form = useForm<Partial<Testimonial>>({
    defaultValues: {
      name: '',
      role: '',
      company: '',
      text: '',
      avatar_url: '',
    }
  });

  const onSubmit = (data: Partial<Testimonial>) => {
    if (editingTestimonial) {
      saveTestimonialMutation.mutate({ ...data, id: editingTestimonial.id });
    } else {
      saveTestimonialMutation.mutate(data);
    }
  };

  const handleEdit = (testimonial: Testimonial) => {
    setEditingTestimonial(testimonial);
    // Map the testimonial to form fields, ensuring compatibility between old and new format
    form.reset({
      name: testimonial.name,
      role: testimonial.role,
      company: testimonial.company || '',
      text: testimonial.text || testimonial.quote,
      avatar_url: testimonial.avatar_url || testimonial.image,
    });
  };

  const handleDelete = (id: number) => {
    if (confirm('¿Estás seguro de que deseas eliminar este testimonio?')) {
      deleteTestimonialMutation.mutate(id);
    }
  };

  const handleCancelEdit = () => {
    setEditingTestimonial(null);
    form.reset();
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
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
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
                      control={form.control}
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
                      control={form.control}
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
                    control={form.control}
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
                    control={form.control}
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
                <Button variant="outline" onClick={() => form.reset()}>
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
              <p className="text-muted-foreground">
                Funcionalidad en desarrollo. Pronto podrás editar esta sección.
              </p>
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
