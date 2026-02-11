import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Settings, Layers, Rocket } from "lucide-react";
import { EditorHeader } from "./editor/EditorHeader";
import { TabGeneral } from "./editor/TabGeneral";
import { TabEstructura } from "./editor/TabEstructura";
import { TabConfiguracion } from "./editor/TabConfiguracion";
import { TabPublicacion } from "./editor/TabPublicacion";
import { cursoEditorSchema, type CursoEditorFormData } from "./editor/types";
import { useLMSActualizarCurso } from "@/hooks/lms/useLMSAdminCursos";
import type { LMSCurso, LMSModulo, LMSContenido, CursoFormData } from "@/types/lms";

interface LMSCursoEditorProps {
  curso: LMSCurso & { modulos?: (LMSModulo & { contenidos: LMSContenido[] })[] };
  onBack: () => void;
  onSuccess?: () => void;
}

export function LMSCursoEditor({ curso, onBack, onSuccess }: LMSCursoEditorProps) {
  const actualizarCurso = useLMSActualizarCurso();

  const form = useForm<CursoEditorFormData>({
    resolver: zodResolver(cursoEditorSchema),
    defaultValues: {
      codigo: curso.codigo || '',
      titulo: curso.titulo || '',
      descripcion: curso.descripcion || '',
      imagen_portada_url: curso.imagen_portada_url || '',
      categoria: curso.categoria,
      nivel: curso.nivel || 'basico',
      duracion_estimada_min: curso.duracion_estimada_min || 30,
      es_obligatorio: curso.es_obligatorio || false,
      roles_objetivo: curso.roles_objetivo || [],
      plazo_dias_default: curso.plazo_dias_default || 30,
      activo: curso.activo ?? true,
      publicado: curso.publicado || false,
    },
  });

  const handleSave = async () => {
    const valid = await form.trigger();
    if (!valid) return;

    const data = form.getValues();
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

    await actualizarCurso.mutateAsync({ id: curso.id, data: formData });
    onSuccess?.();
  };

  const modulos = curso.modulos || [];

  return (
    <div className="min-h-screen">
      <EditorHeader
        curso={{ ...curso, ...form.watch() }}
        isSaving={actualizarCurso.isPending}
        onSave={handleSave}
        onBack={onBack}
      />

      <div className="container max-w-5xl py-6">
        <Form {...form}>
          <Tabs defaultValue="general" className="space-y-4">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="general" className="gap-1.5">
                <BookOpen className="w-4 h-4" />
                General
              </TabsTrigger>
              <TabsTrigger value="estructura" className="gap-1.5">
                <Layers className="w-4 h-4" />
                Estructura
              </TabsTrigger>
              <TabsTrigger value="configuracion" className="gap-1.5">
                <Settings className="w-4 h-4" />
                Configuración
              </TabsTrigger>
              <TabsTrigger value="publicacion" className="gap-1.5">
                <Rocket className="w-4 h-4" />
                Publicación
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general">
              <TabGeneral form={form} />
            </TabsContent>

            <TabsContent value="estructura">
              <TabEstructura cursoId={curso.id} cursoTitulo={curso.titulo} modulos={modulos} />
            </TabsContent>

            <TabsContent value="configuracion">
              <TabConfiguracion form={form} />
            </TabsContent>

            <TabsContent value="publicacion">
              <TabPublicacion form={form} modulos={modulos} />
            </TabsContent>
          </Tabs>
        </Form>
      </div>
    </div>
  );
}
