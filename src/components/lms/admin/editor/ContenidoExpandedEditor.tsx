import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, X, Play, FileText, AlignLeft, HelpCircle, Sparkles, Code, Package, Award } from "lucide-react";
import { MediaUploader } from "@/components/lms/admin/wizard/MediaUploader";
import { VideoScriptGenerator, type VideoScriptData } from "@/components/lms/admin/wizard/VideoScriptGenerator";
import { InlineQuizEditor, type QuizQuestionOutline } from "@/components/lms/admin/wizard/InlineQuizEditor";
import { InlineFlashcardEditor, type FlashcardOutline } from "@/components/lms/admin/wizard/InlineFlashcardEditor";
import { useLMSActualizarContenido } from "@/hooks/lms/useLMSAdminContenidos";
import { useLMSCrearPreguntas } from "@/hooks/lms/useLMSAdminPreguntas";
import { fetchPreguntasByIds } from "@/hooks/lms/useLMSAdminPreguntas";
import { useLMSAI } from "@/hooks/lms/useLMSAI";
import { toast } from "sonner";
import type { LMSContenido, TipoContenido, VideoContent, DocumentoContent, TextoEnriquecidoContent, QuizContent, InteractivoContent, EmbedContent, FlashcardsData } from "@/types/lms";

const TIPO_ICONS: Record<TipoContenido, React.ReactNode> = {
  video: <Play className="w-4 h-4" />,
  documento: <FileText className="w-4 h-4" />,
  texto_enriquecido: <AlignLeft className="w-4 h-4" />,
  quiz: <HelpCircle className="w-4 h-4" />,
  interactivo: <Sparkles className="w-4 h-4" />,
  embed: <Code className="w-4 h-4" />,
  scorm: <Package className="w-4 h-4" />,
  certificado_plantilla: <Award className="w-4 h-4" />,
};

const TIPO_LABELS: Record<TipoContenido, string> = {
  video: 'Video', documento: 'Documento', texto_enriquecido: 'Texto Enriquecido',
  quiz: 'Evaluación', interactivo: 'Interactivo', embed: 'Embed',
  scorm: 'SCORM', certificado_plantilla: 'Certificado',
};

interface ContenidoExpandedEditorProps {
  contenido: LMSContenido;
  cursoId: string;
  cursoTitulo?: string;
  moduloTitulo?: string;
  onClose: () => void;
}

export function ContenidoExpandedEditor({ contenido, cursoId, cursoTitulo, moduloTitulo, onClose }: ContenidoExpandedEditorProps) {
  const [titulo, setTitulo] = useState(contenido.titulo);
  const [duracion, setDuracion] = useState(contenido.duracion_min);
  const [saving, setSaving] = useState(false);

  // Type-specific state
  const [videoUrl, setVideoUrl] = useState('');
  const [documentoUrl, setDocumentoUrl] = useState('');
  const [textoHtml, setTextoHtml] = useState('');
  const [embedHtml, setEmbedHtml] = useState('');
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestionOutline[]>([]);
  const [flashcards, setFlashcards] = useState<FlashcardOutline[]>([]);
  const [videoScript, setVideoScript] = useState<VideoScriptData | null>(() => {
    const data = contenido.contenido as any;
    return data?.guion_generado || null;
  });
  const [loadingPreguntas, setLoadingPreguntas] = useState(false);

  const actualizarContenido = useLMSActualizarContenido();
  const crearPreguntas = useLMSCrearPreguntas();
  const { generateRichText, loading: aiLoading } = useLMSAI();

  // Initialize type-specific state from contenido
  useEffect(() => {
    const data = contenido.contenido as any;
    switch (contenido.tipo) {
      case 'video':
        setVideoUrl(data?.url || '');
        break;
      case 'documento':
        setDocumentoUrl(data?.url || '');
        break;
      case 'texto_enriquecido':
        setTextoHtml(data?.html || '');
        break;
      case 'embed':
        setEmbedHtml(data?.html || '');
        break;
      case 'quiz':
        loadQuizQuestions(data?.preguntas_ids || []);
        break;
      case 'interactivo':
        loadFlashcards(data);
        break;
    }
  }, []);

  const loadQuizQuestions = async (ids: string[]) => {
    if (ids.length === 0) return;
    setLoadingPreguntas(true);
    try {
      const preguntas = await fetchPreguntasByIds(ids);
      // Convert from QuizQuestion (DB format) to QuizQuestionOutline (wizard format)
      setQuizQuestions(preguntas.map(p => ({
        id: p.id,
        question: p.pregunta,
        type: 'single' as const,
        options: p.opciones.map((o, idx) => ({
          id: crypto.randomUUID(),
          text: o.texto,
          isCorrect: idx === p.respuesta_correcta,
        })),
        explanation: p.explicacion || '',
      })));
    } catch (err) {
      console.error('Error loading quiz questions:', err);
      toast.error('Error al cargar preguntas');
    } finally {
      setLoadingPreguntas(false);
    }
  };

  const loadFlashcards = (data: any) => {
    if (data?.tipo === 'flashcards' && data?.data?.cards) {
      setFlashcards(data.data.cards.map((c: any) => ({
        id: c.id || crypto.randomUUID(),
        front: c.front,
        back: c.back,
      })));
    }
  };

  const buildContenidoData = (): any => {
    switch (contenido.tipo) {
      case 'video':
        return { ...(contenido.contenido as any), url: videoUrl, guion_generado: videoScript || undefined };
      case 'documento':
        return { ...(contenido.contenido as any), url: documentoUrl };
      case 'texto_enriquecido':
        return { html: textoHtml };
      case 'embed':
        return { ...(contenido.contenido as any), html: embedHtml };
      case 'interactivo':
        return {
          tipo: 'flashcards',
          data: {
            cards: flashcards.map(f => ({ id: f.id, front: f.front, back: f.back })),
          },
        };
      case 'quiz':
        // Quiz content data is updated separately via preguntas
        return contenido.contenido;
      default:
        return contenido.contenido;
    }
  };

  const handleSave = async () => {
    if (!titulo.trim()) {
      toast.error('El título es requerido');
      return;
    }
    setSaving(true);
    try {
      // For quizzes, save questions first and get IDs
      let contenidoData = buildContenidoData();
      if (contenido.tipo === 'quiz' && quizQuestions.length > 0) {
        const preguntasDB = quizQuestions.map(q => ({
          id: q.id,
          pregunta: q.question,
          opciones: q.options.map(o => ({ texto: o.text })),
          respuesta_correcta: q.options.findIndex(o => o.isCorrect),
          explicacion: q.explanation || '',
          puntos: 10,
        }));

        const saved = await crearPreguntas.mutateAsync({
          cursoId,
          preguntas: preguntasDB,
        });

        contenidoData = {
          ...(contenido.contenido as any),
          preguntas_ids: saved.map((s: any) => s.id),
        };
      }

      await actualizarContenido.mutateAsync({
        id: contenido.id,
        moduloId: contenido.modulo_id,
        cursoId,
        data: {
          ...contenido,
          titulo,
          duracion_min: duracion,
          contenido: contenidoData,
        },
      });
      onClose();
    } catch (err) {
      console.error('Error saving content:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateText = async () => {
    const result = await generateRichText(titulo || moduloTitulo || 'Contenido', cursoTitulo);
    if (result?.html) {
      setTextoHtml(result.html);
      toast.success('Texto generado con IA');
    }
  };

  return (
    <div className="border rounded-lg bg-card p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-primary">{TIPO_ICONS[contenido.tipo]}</span>
          <span className="font-medium text-sm">{TIPO_LABELS[contenido.tipo]}</span>
          <Badge variant="outline" className="text-[10px]">Editando</Badge>
        </div>
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Common fields */}
      <div className="grid grid-cols-[1fr_auto] gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Título</Label>
          <Input value={titulo} onChange={e => setTitulo(e.target.value)} className="h-8 text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Duración (min)</Label>
          <Input type="number" value={duracion} onChange={e => setDuracion(Number(e.target.value))} className="h-8 text-sm w-20" min={1} />
        </div>
      </div>

      {/* Type-specific editors */}
      {contenido.tipo === 'video' && (
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Video</Label>
            <MediaUploader type="video" value={videoUrl} onChange={setVideoUrl} />
          </div>
          <VideoScriptGenerator
            tema={titulo || moduloTitulo || ''}
            moduloTitulo={moduloTitulo}
            cursoTitulo={cursoTitulo}
            duracionMin={duracion}
            initialData={videoScript}
            onGenerated={setVideoScript}
          />
        </div>
      )}

      {contenido.tipo === 'documento' && (
        <div className="space-y-1">
          <Label className="text-xs">Documento</Label>
          <MediaUploader type="document" value={documentoUrl} onChange={setDocumentoUrl} />
        </div>
      )}

      {contenido.tipo === 'texto_enriquecido' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Contenido</Label>
            <Button size="sm" variant="outline" onClick={handleGenerateText} disabled={aiLoading} className="h-7 text-xs">
              {aiLoading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1" />}
              Generar con IA
            </Button>
          </div>
          <Textarea
            value={textoHtml}
            onChange={e => setTextoHtml(e.target.value)}
            rows={8}
            className="text-sm font-mono"
            placeholder="HTML del contenido enriquecido..."
          />
        </div>
      )}

      {contenido.tipo === 'embed' && (
        <div className="space-y-1">
          <Label className="text-xs">HTML del embed (iframe)</Label>
          <Textarea
            value={embedHtml}
            onChange={e => setEmbedHtml(e.target.value)}
            rows={4}
            className="text-sm font-mono"
            placeholder='<iframe src="..." width="100%" height="400"></iframe>'
          />
        </div>
      )}

      {contenido.tipo === 'quiz' && (
        <div className="space-y-2">
          {loadingPreguntas ? (
            <div className="flex items-center gap-2 py-4 justify-center text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Cargando preguntas...</span>
            </div>
          ) : (
            <InlineQuizEditor
              questions={quizQuestions}
              onChange={setQuizQuestions}
              moduloTitulo={moduloTitulo}
              cursoTitulo={cursoTitulo}
            />
          )}
        </div>
      )}

      {contenido.tipo === 'interactivo' && (
        <InlineFlashcardEditor
          cards={flashcards}
          onChange={setFlashcards}
          moduloTitulo={moduloTitulo}
          cursoTitulo={cursoTitulo}
        />
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2 border-t">
        <Button size="sm" variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button size="sm" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1" />}
          Guardar
        </Button>
      </div>
    </div>
  );
}
