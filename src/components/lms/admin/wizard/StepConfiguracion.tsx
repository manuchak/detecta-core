import { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LMS_CATEGORIAS, LMS_NIVELES } from "@/types/lms";
import { Clock, Calendar, BookOpen, BarChart3 } from "lucide-react";

interface StepConfiguracionProps {
  form: UseFormReturn<any>;
}

export function StepConfiguracion({ form }: StepConfiguracionProps) {
  return (
    <div className="apple-card p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="categoria"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-muted-foreground" />
                Categoría
              </FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar categoría..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {LMS_CATEGORIAS.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="nivel"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-muted-foreground" />
                Nivel de dificultad *
              </FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {LMS_NIVELES.map(nivel => (
                    <SelectItem key={nivel.value} value={nivel.value}>
                      {nivel.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="duracion_estimada_min"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                Duración estimada *
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <Input 
                    type="number" 
                    min={1}
                    placeholder="30"
                    {...field}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    minutos
                  </span>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="plazo_dias_default"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                Plazo para completar *
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <Input 
                    type="number" 
                    min={1}
                    max={365}
                    placeholder="30"
                    {...field}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    días
                  </span>
                </div>
              </FormControl>
              <FormDescription>
                Tiempo límite tras la inscripción
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
