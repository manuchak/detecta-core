
import React from 'react';
import { useHeroSettings } from '@/hooks/useHeroSettings';
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
import { Loader2, Save, Image } from 'lucide-react';
import { useToast } from '@/hooks';
import { HeroSettings } from '@/hooks/useHeroSettings';

export const HeroManager = () => {
  const { toast } = useToast();
  const {
    heroSettings,
    isLoading: isLoadingHeroSettings,
    saveHeroSettings: saveHeroSettingsMutation
  } = useHeroSettings();

  // Initialize hero form
  const heroForm = useForm<HeroSettings>({
    defaultValues: heroSettings
  });

  // Update hero form when settings load
  React.useEffect(() => {
    if (!isLoadingHeroSettings && heroSettings) {
      heroForm.reset(heroSettings);
    }
  }, [isLoadingHeroSettings, heroSettings, heroForm]);

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

  return (
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
  );
};
