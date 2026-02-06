import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { ImageUploader } from "./wizard/ImageUploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Form,
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
import { useLMSCrearCurso, useLMSActualizarCurso } from "@/hooks/lms/useLMSAdminCursos";
import { useFormPersistence } from "@/hooks/useFormPersistence";
import { DraftRestoreBanner } from "@/components/ui/DraftAutoRestorePrompt";
import { LMS_CATEGORIAS, LMS_NIVELES } from "@/types/lms";
import type { LMSCurso, CursoFormData, LMSCategoria, LMSNivel } from "@/types/lms";

const cursoSchema = z.object({
  codigo: z.string().min(2, "El código debe tener al menos 2 caracteres").max(20),
  titulo: z.string().min(3, "El título debe tener al menos 3 caracteres").max(200),
  descripcion: z.string().max(1000).optional(),
  imagen_portada_url: z.string().url().optional().or(z.literal('')),
  categoria: z.enum(['onboarding', 'procesos', 'herramientas', 'compliance', 'habilidades']).optional(),
  nivel: z.enum(['basico', 'intermedio', 'avanzado']),
  duracion_estimada_min: z.coerce.number().min(1).max(9999),
  es_obligatorio: z.boolean(),
  roles_objetivo: z.array(z.string()),
  plazo_dias_default: z.coerce.number().min(1).max(365),
  activo: z.boolean(),
  publicado: z.boolean(),
});

type CursoSchemaType = z.infer<typeof cursoSchema>;

interface LMSCursoFormProps {
  curso?: LMSCurso | null;
  onBack: () => void;
  onSuccess?: () => void;
}

const ROLES_DISPONIBLES = [
  { value: 'custodio', label: 'Custodios' },
  { value: 'operador', label: 'Operadores' },
  { value: 'admin', label: 'Administradores' },
  { value: 'supply_admin', label: 'Supply Admin' },
  { value: 'sales', label: 'Ventas' },
  { value: 'monitor', label: 'Monitores' },
];

export function LMSCursoForm({ curso, onBack, onSuccess }: LMSCursoFormProps) {
  const crearCurso = useLMSCrearCurso();
  const actualizarCurso = useLMSActualizarCurso();
  const isEditing = !!curso;

  // Standard persistence for form (only for new courses)
  const persistence = useFormPersistence<Partial<CursoSchemaType>>({
    key: curso ? `lms_curso_edit_${curso.id}` : 'lms_curso_new',
    initialData: {},
    level: 'standard',
    ttl: 2 * 60 * 60 * 1000, // 2 hours
    isMeaningful: (data) => !!(data.titulo || data.codigo || data.descripcion),
  });

  const form = useForm<CursoSchemaType>({
    resolver: zodResolver(cursoSchema),
    defaultValues: {
      codigo: curso?.codigo || '',
      titulo: curso?.titulo || '',
      descripcion: curso?.descripcion || '',
      imagen_portada_url: curso?.imagen_portada_url || '',
      categoria: curso?.categoria,
      nivel: curso?.nivel || 'basico',
      duracion_estimada_min: curso?.duracion_estimada_min || 30,
      es_obligatorio: curso?.es_obligatorio || false,
      roles_objetivo: curso?.roles_objetivo || [],
      plazo_dias_default: curso?.plazo_dias_default || 30,
      activo: curso?.activo ?? true,
      publicado: curso?.publicado || false,
    },
  });

  // Sync form to persistence
  useEffect(() => {
    const subscription = form.watch((values) => {
      persistence.updateData(values as Partial<CursoSchemaType>);
    });
    return () => subscription.unsubscribe();
  }, [form, persistence.updateData]);

  // Handle restore
  const handleRestoreDraft = () => {
    if (persistence.pendingRestore?.data) {
      form.reset({ ...form.getValues(), ...persistence.pendingRestore.data });
      persistence.acceptRestore();
    }
  };

  const isSubmitting = crearCurso.isPending || actualizarCurso.isPending;

  const onSubmit = async (data: CursoSchemaType) => {
    try {
      const formData: CursoFormData = {
        codigo: data.codigo,
        titulo: data.titulo,
        descripcion: data.descripcion || undefined,
        imagen_portada_url: data.imagen_portada_url || undefined,
        categoria: data.categoria,
        nivel: data.nivel,
        duracion_estimada_min: data.duracion_estimada_min,
        es_obligatorio: data.es_obligatorio,
        roles_objetivo: data.roles_objetivo,
        plazo_dias_default: data.plazo_dias_default,
        activo: data.activo,
        publicado: data.publicado,
      };

      if (isEditing && curso) {
        await actualizarCurso.mutateAsync({ id: curso.id, data: formData });
      } else {
        await crearCurso.mutateAsync(formData);
      }
      persistence.clearDraft(true);
      onSuccess?.();
      onBack();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleRolToggle = (rol: string) => {
    const current = form.getValues('roles_objetivo');
    if (current.includes(rol)) {
      form.setValue('roles_objetivo', current.filter(r => r !== rol));
    } else {
      form.setValue('roles_objetivo', [...current, rol]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Draft restore banner */}
      {!isEditing && (
        <DraftRestoreBanner
          visible={persistence.showRestorePrompt}
          savedAt={persistence.pendingRestore?.savedAt ? new Date(persistence.pendingRestore.savedAt) : null}
          previewText={persistence.pendingRestore?.data?.titulo}
          moduleName="Curso"
          onRestore={handleRestoreDraft}
          onDiscard={persistence.rejectRestore}
        />
      )}

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h2 className="text-xl font-semibold">
            {isEditing ? 'Editar Curso' : 'Nuevo Curso'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isEditing ? 'Modifica la información del curso' : 'Completa la información para crear un curso'}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información General</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="codigo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código *</FormLabel>
                      <FormControl>
                        <Input placeholder="CURSO-001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="titulo"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Título *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nombre del curso" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="descripcion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe el contenido y objetivos del curso..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="imagen_portada_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Imagen de portada</FormLabel>
                    <FormControl>
                      <ImageUploader
                        value={field.value || ''}
                        onChange={field.onChange}
                        courseTitle={form.watch("titulo")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Configuración</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                            <SelectValue placeholder="Seleccionar..." />
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
                      <FormLabel>Nivel *</FormLabel>
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
                      <FormLabel>Duración (minutos) *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={1}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="plazo_dias_default"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plazo por defecto (días) *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min={1}
                        max={365}
                        className="w-32"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Días que tiene el usuario para completar el curso después de inscribirse
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="roles_objetivo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Roles objetivo</FormLabel>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {ROLES_DISPONIBLES.map(rol => (
                        <Badge
                          key={rol.value}
                          variant={field.value.includes(rol.value) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => handleRolToggle(rol.value)}
                        >
                          {rol.label}
                        </Badge>
                      ))}
                    </div>
                    <FormDescription>
                      Selecciona los roles a los que va dirigido este curso
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Estado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="es_obligatorio"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Curso obligatorio</FormLabel>
                      <FormDescription>
                        Los usuarios con roles objetivo serán inscritos automáticamente
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

              <FormField
                control={form.control}
                name="activo"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Activo</FormLabel>
                      <FormDescription>
                        Los cursos inactivos no aparecen para los usuarios
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

              <FormField
                control={form.control}
                name="publicado"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Publicado</FormLabel>
                      <FormDescription>
                        Solo los cursos publicados son visibles para inscripción
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
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onBack}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <Save className="w-4 h-4 mr-2" />
              {isEditing ? 'Guardar Cambios' : 'Crear Curso'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
