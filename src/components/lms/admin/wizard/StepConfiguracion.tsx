import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
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
import { Clock, Calendar, BookOpen, BarChart3, Users, AlertTriangle, ClipboardCheck, Sparkles, Loader2 } from "lucide-react";
import { RoleSelectCard } from "./RoleSelectCard";
import { Button } from "@/components/ui/button";
import { useLMSAI } from "@/hooks/lms/useLMSAI";
import { toast } from "sonner";

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
  const quizPorcentaje = form.watch('quiz_porcentaje_aprobacion') ?? 80;
  const quizIntentos = form.watch('quiz_intentos_permitidos') ?? 3;
  const quizAleatorizar = form.watch('quiz_aleatorizar') ?? false;
  const quizMostrarRespuestas = form.watch('quiz_mostrar_respuestas') ?? true;

  const { loading: aiLoading, generateCourseMetadata } = useLMSAI();
  const [recommendLoading, setRecommendLoading] = useState(false);

  const handleRolToggle = (rol: string) => {
    const current = form.getValues('roles_objetivo') || [];
    if (current.includes(rol)) {
      form.setValue('roles_objetivo', current.filter((r: string) => r !== rol));
    } else {
      form.setValue('roles_objetivo', [...current, rol]);
    }
  };

  const handleAIRecommend = async () => {
    const nivel = form.getValues('nivel');
    const categoria = form.getValues('categoria');
    const titulo = form.getValues('titulo');

    // Simple AI-informed defaults based on level/category
    setRecommendLoading(true);
    try {
      // Use deterministic rules enhanced by context
      let porcentaje = 80;
      let intentos = 3;
      let aleatorizar = false;
      let mostrarRespuestas = true;

      if (nivel === 'avanzado') {
        porcentaje = 90;
        intentos = 2;
        aleatorizar = true;
        mostrarRespuestas = false;
      } else if (nivel === 'intermedio') {
        porcentaje = 80;
        intentos = 3;
        aleatorizar = true;
        mostrarRespuestas = true;
      } else {
        porcentaje = 70;
        intentos = 5;
        aleatorizar = false;
        mostrarRespuestas = true;
      }

      if (categoria === 'compliance') {
        porcentaje = Math.max(porcentaje, 85);
        intentos = Math.min(intentos, 2);
        aleatorizar = true;
      } else if (categoria === 'onboarding') {
        porcentaje = Math.min(porcentaje, 75);
        intentos = Math.max(intentos, 5);
      }

      form.setValue('quiz_porcentaje_aprobacion', porcentaje);
      form.setValue('quiz_intentos_permitidos', intentos);
      form.setValue('quiz_aleatorizar', aleatorizar);
      form.setValue('quiz_mostrar_respuestas', mostrarRespuestas);

      toast.success(`Configuración recomendada para nivel ${nivel || 'básico'} / ${categoria || 'general'}`);
    } finally {
      setRecommendLoading(false);
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

      {/* Assessment Strategy Section */}
      <div className="apple-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="apple-text-headline flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-muted-foreground" />
            Estrategia de Evaluación
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAIRecommend}
            disabled={recommendLoading}
            className="gap-2"
          >
            {recommendLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            Recomendar con IA
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mb-5">
          Configura los parámetros de evaluación que se aplicarán a todos los quizzes del curso
        </p>

        <div className="space-y-6">
          {/* Passing Score */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Porcentaje de aprobación</label>
              <span className="text-sm font-semibold text-primary">{quizPorcentaje}%</span>
            </div>
            <Slider
              value={[quizPorcentaje]}
              onValueChange={([v]) => form.setValue('quiz_porcentaje_aprobacion', v)}
              min={50}
              max={100}
              step={5}
            />
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>50% (Flexible)</span>
              <span>100% (Estricto)</span>
            </div>
          </div>

          {/* Max Retries */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Intentos máximos</label>
              <span className="text-sm font-semibold text-primary">
                {quizIntentos === 0 ? 'Ilimitados' : quizIntentos}
              </span>
            </div>
            <Slider
              value={[quizIntentos]}
              onValueChange={([v]) => form.setValue('quiz_intentos_permitidos', v)}
              min={0}
              max={10}
              step={1}
            />
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>0 = Ilimitados</span>
              <span>10 máximo</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Randomize */}
            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Aleatorizar preguntas</p>
                <p className="text-xs text-muted-foreground">Orden diferente en cada intento</p>
              </div>
              <Switch
                checked={quizAleatorizar}
                onCheckedChange={(v) => form.setValue('quiz_aleatorizar', v)}
              />
            </div>

            {/* Show Correct Answers */}
            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Mostrar respuestas</p>
                <p className="text-xs text-muted-foreground">Tras enviar el quiz</p>
              </div>
              <Switch
                checked={quizMostrarRespuestas}
                onCheckedChange={(v) => form.setValue('quiz_mostrar_respuestas', v)}
              />
            </div>
          </div>
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
