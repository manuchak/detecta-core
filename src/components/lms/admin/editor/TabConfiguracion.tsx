import { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { LMS_ROLES_OBJETIVO } from "@/types/lms";
import type { CursoEditorFormData } from "./types";

interface TabConfiguracionProps {
  form: UseFormReturn<CursoEditorFormData>;
}

export function TabConfiguracion({ form }: TabConfiguracionProps) {
  const handleRolToggle = (rol: string) => {
    const current = form.getValues('roles_objetivo');
    if (current.includes(rol)) {
      form.setValue('roles_objetivo', current.filter(r => r !== rol));
    } else {
      form.setValue('roles_objetivo', [...current, rol]);
    }
  };

  return (
    <div className="space-y-6 py-4">
      {/* Duración + Plazo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="duracion_estimada_min"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Duración estimada (minutos) *</FormLabel>
              <FormControl>
                <Input type="number" min={1} {...field} />
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
              <FormLabel>Plazo por defecto (días) *</FormLabel>
              <FormControl>
                <Input type="number" min={1} max={365} {...field} />
              </FormControl>
              <FormDescription>Días para completar tras inscripción</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Roles objetivo */}
      <FormField
        control={form.control}
        name="roles_objetivo"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Roles objetivo</FormLabel>
            <div className="flex flex-wrap gap-2 mt-2">
              {LMS_ROLES_OBJETIVO.map(rol => (
                <Badge
                  key={rol.value}
                  variant={field.value.includes(rol.value) ? "default" : "outline"}
                  className="cursor-pointer select-none"
                  onClick={() => handleRolToggle(rol.value)}
                >
                  {rol.label}
                </Badge>
              ))}
            </div>
            <FormDescription>Selecciona los roles a los que va dirigido este curso</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Switches */}
      <div className="space-y-3">
        <FormField
          control={form.control}
          name="es_obligatorio"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Curso obligatorio</FormLabel>
                <FormDescription>Los usuarios con roles objetivo serán inscritos automáticamente</FormDescription>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
