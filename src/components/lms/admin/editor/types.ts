import { z } from "zod";

export const cursoEditorSchema = z.object({
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

export type CursoEditorFormData = z.infer<typeof cursoEditorSchema>;
