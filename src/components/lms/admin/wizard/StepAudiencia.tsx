import { UseFormReturn } from "react-hook-form";
import { Switch } from "@/components/ui/switch";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { RoleSelectCard } from "./RoleSelectCard";
import { AlertTriangle, Users } from "lucide-react";

interface StepAudienciaProps {
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

export function StepAudiencia({ form }: StepAudienciaProps) {
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
      <div className="apple-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-muted-foreground" />
          <h3 className="apple-text-headline">¿A quién va dirigido?</h3>
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
      </div>

      <div className="apple-card p-6">
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
                  al publicar el curso
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
  );
}
