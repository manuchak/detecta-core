
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
  DollarSign,
  Trash,
  PenLine,
  Plus,
  X,
  Save,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks';
import { Badge } from '@/components/ui/badge';
import { usePrices, Price, PriceInput } from '@/hooks/usePrices';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const priceSchema = z.object({
  name: z.string().min(2, { message: "El nombre es requerido" }),
  earnings: z.string().min(1, { message: "Los ingresos son requeridos" }),
  period: z.string().default("mensuales"),
  description: z.string().min(4, { message: "La descripción es requerida" }),
  cta: z.string().min(2, { message: "El texto del botón es requerido" }),
  popular: z.boolean().default(false),
  order: z.number().default(0)
});

type PriceFormValues = z.infer<typeof priceSchema>;

export const PricesManager = () => {
  const [selectedPrice, setSelectedPrice] = useState<Price | null>(null);
  const [priceToDelete, setPriceToDelete] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { toast } = useToast();
  const { prices, loading, createPrice, updatePrice, deletePrice, fetchPrices } = usePrices();

  const form = useForm<PriceFormValues>({
    resolver: zodResolver(priceSchema),
    defaultValues: {
      name: "",
      earnings: "",
      period: "mensuales",
      description: "",
      cta: "Comenzar Ahora",
      popular: false,
      order: 0
    }
  });

  useEffect(() => {
    // Reset form when selectedPrice changes
    if (selectedPrice) {
      form.reset({
        name: selectedPrice.name,
        earnings: selectedPrice.earnings,
        period: selectedPrice.period,
        description: selectedPrice.description,
        cta: selectedPrice.cta,
        popular: selectedPrice.popular,
        order: selectedPrice.order
      });
    } else {
      form.reset({
        name: "",
        earnings: "",
        period: "mensuales",
        description: "",
        cta: "Comenzar Ahora",
        popular: false,
        order: prices.length
      });
    }
  }, [selectedPrice, form, prices.length]);

  const onSubmit = async (data: PriceFormValues) => {
    try {
      // Ensure all required fields are present
      const priceInput: PriceInput = {
        name: data.name,
        earnings: data.earnings,
        period: data.period,
        description: data.description,
        cta: data.cta,
        popular: data.popular,
        order: data.order
      };
      
      if (selectedPrice) {
        // Updating existing price
        await updatePrice(selectedPrice.id, priceInput);
        toast({
          title: "Plan actualizado",
          description: "El plan ha sido actualizado correctamente.",
        });
      } else {
        // Adding new price
        await createPrice(priceInput);
        toast({
          title: "Plan creado",
          description: "El plan ha sido creado correctamente.",
        });
      }

      // Reset form and selection
      setSelectedPrice(null);
      form.reset({
        name: "",
        earnings: "",
        period: "mensuales",
        description: "",
        cta: "Comenzar Ahora",
        popular: false,
        order: prices.length + 1
      });
      
      // Refresh prices list
      fetchPrices();
    } catch (error) {
      console.error('Error saving price:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el plan. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };

  // Edit a price
  const editPrice = (price: Price) => {
    setSelectedPrice(price);
    // Scroll to form
    window.scrollTo({
      top: document.getElementById('price-form')?.offsetTop,
      behavior: 'smooth'
    });
  };

  // Cancel editing
  const cancelEdit = () => {
    setSelectedPrice(null);
    form.reset({
      name: "",
      earnings: "",
      period: "mensuales", 
      description: "",
      cta: "Comenzar Ahora",
      popular: false,
      order: prices.length
    });
  };

  // Handle open delete confirmation dialog
  const handleOpenDeleteDialog = (id: string) => {
    setPriceToDelete(id);
    setDeleteDialogOpen(true);
  };

  // Handle price deletion with confirmation
  const handleDeletePrice = async () => {
    if (!priceToDelete) return;
    
    try {
      await deletePrice(priceToDelete);
      
      // If we're editing the price that was just deleted, reset the form
      if (selectedPrice && selectedPrice.id === priceToDelete) {
        cancelEdit();
      }
      
      // Reset state
      setPriceToDelete(null);
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error('Error deleting price:', error);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gestión de Planes y Precios</CardTitle>
          <CardDescription>
            Configura los planes y precios que se mostrarán en la landing page.
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
                      top: document.getElementById('price-form')?.offsetTop,
                      behavior: 'smooth'
                    });
                  }}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Nuevo Plan
                </Button>
              </div>
              
              {prices.length === 0 ? (
                <div className="text-center py-8 border border-dashed rounded-lg bg-muted/10">
                  <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                    <DollarSign className="h-6 w-6 text-primary/60" />
                  </div>
                  <h3 className="text-lg font-medium mb-1">No hay planes</h3>
                  <p className="text-muted-foreground text-sm">
                    Agrega tu primer plan para mostrar en la landing page.
                  </p>
                </div>
              ) : (
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Plan</TableHead>
                        <TableHead>Ingresos</TableHead>
                        <TableHead className="hidden md:table-cell">Descripción</TableHead>
                        <TableHead className="text-center">Popular</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {prices.map((price) => (
                        <TableRow key={price.id} className={selectedPrice?.id === price.id ? 'bg-muted/20' : ''}>
                          <TableCell className="font-medium">{price.name}</TableCell>
                          <TableCell>
                            <span className="font-semibold">{price.earnings}</span>
                            <span className="text-muted-foreground text-xs ml-1">{price.period}</span>
                          </TableCell>
                          <TableCell className="hidden md:table-cell max-w-xs truncate">
                            {price.description}
                          </TableCell>
                          <TableCell className="text-center">
                            {price.popular ? (
                              <Badge className="bg-orange-500 text-xs">Destacado</Badge>
                            ) : (
                              <span className="text-muted-foreground text-xs">No</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button 
                              variant={selectedPrice?.id === price.id ? "secondary" : "outline"} 
                              size="sm" 
                              className="gap-1"
                              onClick={() => editPrice(price)}
                            >
                              <PenLine className="h-3.5 w-3.5" />
                              Editar
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              className="gap-1"
                              onClick={() => handleOpenDeleteDialog(price.id)}
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

      <Card id="price-form">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{selectedPrice ? 'Editar Plan' : 'Agregar Nuevo Plan'}</CardTitle>
              <CardDescription>
                {selectedPrice 
                  ? 'Modifica los datos del plan seleccionado' 
                  : 'Completa el formulario para agregar un nuevo plan'}
              </CardDescription>
            </div>
            {selectedPrice && (
              <Badge variant="outline" className="px-2 py-1">
                Editando ID: {selectedPrice.id.substring(0, 8)}...
              </Badge>
            )}
          </div>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre del plan</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej. Plan Básico" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-2">
                  <FormField
                    control={form.control}
                    name="earnings"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ingresos</FormLabel>
                        <FormControl>
                          <Input placeholder="$10,000 - $20,000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="period"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Periodo</FormLabel>
                        <FormControl>
                          <Input placeholder="mensuales" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe el plan en pocas palabras" 
                        rows={2} 
                        className="resize-none" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="cta"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Texto del botón (CTA)</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej. Comenzar Ahora" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="popular"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Destacar como popular</FormLabel>
                        <FormDescription>
                          Este plan aparecerá destacado en la landing
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
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
                {selectedPrice ? 'Actualizar' : 'Guardar'} Plan
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      {/* AlertDialog for confirmation modal */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente este plan de precios. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPriceToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePrice}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
