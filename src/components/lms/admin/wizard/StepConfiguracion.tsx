import { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
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
import { Clock, Calendar, BookOpen, BarChart3, Users, AlertTriangle } from "lucide-react";
import { RoleSelectCard } from "./RoleSelectCard";

interface StepConfiguracionProps {
  form: UseFormReturn<any>;
}

const ROLES_DISPONIBLES = [
  { value: 'custodio', label: 'Custodios', description: 'Conductores operativos' },
  { value: 'operador', label: 'Operadores', description: 'Centro de monitoreo' },
  { value: 'admin', label: 'Administradores', description: 'Gestión general' },
  { value: 'supply_admin', label: 'Supply Admin', description: 'Gestión de proveedores' },
  { value: 'sales', label: 'Ventas', description: 'Equipo comercial' },
  { value: 'monitor', label: 'Monitores', description: 'Supervisión en campo' },
];

export function StepConfiguracion({ form }: StepConfiguracionProps) {
  const rolesSeleccionados = form.watch('roles_objetivo') || [];
  const esObligatorio = form.watch('es_obligatorio');

  const handleRolToggle = (rol: string) => {
    const current = form.getValues('roles_objetivo') || [];
    if (current.includes(rol)) {
      form.setValue('roles_objetivo', current.filter((r: string) => r !== rol));
    } else {
      form.setValue('roles_objetivo', [...current, rol]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Classification Section */}
      <div className="apple-card p-6">
        <h3 className="apple-text-headline mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-muted-foreground" />
          Clasificación
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="categoria"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoría</FormLabel>
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
        </div>
      </div>

      {/* Audience Section */}
      <div className="apple-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-muted-foreground" />
          <h3 className="apple-text-headline">Audiencia</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-5">
          Selecciona los roles que tomarán este curso
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {ROLES_DISPONIBLES.map(rol => (
            <RoleSelectCard
              key={rol.value}
              label={rol.label}
              description={rol.description}
              selected={rolesSeleccionados.includes(rol.value)}
              onClick={() => handleRolToggle(rol.value)}
            />
          ))}
        </div>

        {rolesSeleccionados.length === 0 && (
          <p className="text-xs text-muted-foreground mt-4 text-center">
            Sin roles seleccionados, el curso estará disponible para todos
          </p>
        )}

        {/* Obligatorio Toggle */}
        <div className="mt-6 pt-4 border-t">
          <FormField
            control={form.control}
            name="es_obligatorio"
            render={({ field }) => (
              <FormItem className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <FormLabel className="text-base flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                    Curso obligatorio
                  </FormLabel>
                  <FormDescription>
                    Los usuarios con los roles seleccionados serán inscritos automáticamente
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

          {esObligatorio && rolesSeleccionados.length === 0 && (
            <div className="mt-4 p-3 rounded-lg bg-orange-50 border border-orange-200">
              <p className="text-sm text-orange-700">
                ⚠️ Debes seleccionar al menos un rol para que la inscripción automática funcione
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Deadlines Section */}
      <div className="apple-card p-6">
        <h3 className="apple-text-headline mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-muted-foreground" />
          Plazos
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                <FormDescription>
                  Se calcula automáticamente desde los contenidos
                </FormDescription>
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
    </div>
  );
}
