import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/lms/admin/RichTextEditor";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, X, Play, FileText, AlignLeft, HelpCircle, Sparkles, Code, Package, Award, ImageIcon } from "lucide-react";
import { MediaUploader } from "@/components/lms/admin/wizard/MediaUploader";
import { VideoScriptGenerator, type VideoScriptData } from "@/components/lms/admin/wizard/VideoScriptGenerator";
import { InlineQuizEditor, type QuizQuestionOutline } from "@/components/lms/admin/wizard/InlineQuizEditor";
import { InlineFlashcardEditor, type FlashcardOutline } from "@/components/lms/admin/wizard/InlineFlashcardEditor";
import { AIGenerateButton } from "@/components/lms/admin/wizard/AIGenerateButton";
import { useLMSActualizarContenido } from "@/hooks/lms/useLMSAdminContenidos";
import { useLMSCrearPreguntas } from "@/hooks/lms/useLMSAdminPreguntas";
import { fetchPreguntasByIds } from "@/hooks/lms/useLMSAdminPreguntas";
import { useLMSAI } from "@/hooks/lms/useLMSAI";
import { toast } from "sonner";
import type { LMSContenido, TipoContenido, VideoContent, VideoProvider, DocumentoContent, TextoEnriquecidoContent, QuizContent, InteractivoContent, EmbedContent, FlashcardsData } from "@/types/lms";

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

function detectVideoProvider(url: string): VideoProvider {
  if (!url) return 'storage';
  const lower = url.toLowerCase();
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'youtube';
  if (lower.includes('vimeo.com')) return 'vimeo';
  if (lower.includes('tiktok.com')) return 'tiktok';
  if (lower.includes('instagram.com')) return 'instagram';
  if (lower.includes('facebook.com') || lower.includes('fb.watch')) return 'facebook';
  if (lower.includes('canva.com')) return 'canva';
  return 'storage';
}

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
  const [videoDescription, setVideoDescription] = useState('');
  const [videoThumbnail, setVideoThumbnail] = useState('');
  const [videoProvider, setVideoProvider] = useState<VideoProvider>('storage');
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

  // AI states
  const [aiTitleSuccess, setAiTitleSuccess] = useState(false);
  const [aiDescSuccess, setAiDescSuccess] = useState(false);
  const [aiThumbLoading, setAiThumbLoading] = useState(false);
  const [aiThumbSuccess, setAiThumbSuccess] = useState(false);
  const [aiTitleLoading, setAiTitleLoading] = useState(false);
  const [aiDescLoading, setAiDescLoading] = useState(false);

  const actualizarContenido = useLMSActualizarContenido();
  const crearPreguntas = useLMSCrearPreguntas();
  const { generateRichText, generateCourseImage, generateCourseMetadata, loading: aiLoading } = useLMSAI();

  // Initialize type-specific state from contenido
  useEffect(() => {
    const data = contenido.contenido as any;
    switch (contenido.tipo) {
      case 'video':
        setVideoUrl(data?.url || '');
        setVideoDescription(data?.descripcion || '');
        setVideoThumbnail(data?.thumbnail_url || '');
        setVideoProvider(data?.provider || detectVideoProvider(data?.url || ''));
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

  // Auto-detect provider when videoUrl changes
  const handleVideoUrlChange = (url: string) => {
    setVideoUrl(url);
    setVideoProvider(detectVideoProvider(url));
  };

  const loadQuizQuestions = async (ids: string[]) => {
    if (ids.length === 0) return;
    setLoadingPreguntas(true);
    try {
      const preguntas = await fetchPreguntasByIds(ids);
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
        return {
          ...(contenido.contenido as any),
          url: videoUrl,
          provider: videoProvider,
          descripcion: videoDescription || undefined,
          thumbnail_url: videoThumbnail || undefined,
          guion_generado: videoScript || undefined,
        };
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

  // AI handlers for video
  const handleGenerateVideoTitle = async () => {
    const context = moduloTitulo || cursoTitulo || '';
    if (!context) {
      toast.error('Se necesita contexto del módulo o curso para generar el título');
      return;
    }
    setAiTitleLoading(true);
    try {
      const result = await generateCourseMetadata(context);
      if (result?.descripcion) {
        // Use the first sentence or a short version as title
        const suggested = result.descripcion.split('.')[0].trim();
        if (suggested) {
          setTitulo(suggested.length > 80 ? suggested.substring(0, 80) : suggested);
          setAiTitleSuccess(true);
          setTimeout(() => setAiTitleSuccess(false), 3000);
          toast.success('Título sugerido por IA');
        }
      }
    } finally {
      setAiTitleLoading(false);
    }
  };

  const handleGenerateVideoDescription = async () => {
    const tema = titulo || moduloTitulo || '';
    if (!tema) {
      toast.error('Se necesita un título para generar la descripción');
      return;
    }
    setAiDescLoading(true);
    try {
      const result = await generateRichText(tema, cursoTitulo, 'corta');
      if (result?.html) {
        // Strip HTML tags for plain text description
        const plainText = result.html.replace(/<[^>]*>/g, '').trim();
        setVideoDescription(plainText);
        setAiDescSuccess(true);
        setTimeout(() => setAiDescSuccess(false), 3000);
        toast.success('Descripción generada con IA');
      }
    } finally {
      setAiDescLoading(false);
    }
  };

  const handleGenerateVideoThumbnail = async () => {
    const tema = titulo || moduloTitulo || '';
    if (!tema) {
      toast.error('Se necesita un título para generar el thumbnail');
      return;
    }
    setAiThumbLoading(true);
    try {
      const result = await generateCourseImage(tema, videoDescription || cursoTitulo);
      if (result?.imageBase64) {
        const dataUrl = result.imageBase64.startsWith('data:')
          ? result.imageBase64
          : `data:image/png;base64,${result.imageBase64}`;
        setVideoThumbnail(dataUrl);
        setAiThumbSuccess(true);
        setTimeout(() => setAiThumbSuccess(false), 3000);
        toast.success('Thumbnail generado con IA');
      }
    } finally {
      setAiThumbLoading(false);
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

      {/* Common fields - Title with AI button for video */}
      <div className="grid grid-cols-[1fr_auto] gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Título</Label>
          <div className="flex items-center gap-1.5">
            <Input value={titulo} onChange={e => setTitulo(e.target.value)} className="h-8 text-sm" />
            {contenido.tipo === 'video' && (
              <AIGenerateButton
                onClick={handleGenerateVideoTitle}
                loading={aiTitleLoading}
                success={aiTitleSuccess}
                disabled={!moduloTitulo && !cursoTitulo}
                tooltip="Sugerir título con IA"
              />
            )}
          </div>
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
            <MediaUploader type="video" value={videoUrl} onChange={handleVideoUrlChange} />
            {videoUrl && (
              <p className="text-[10px] text-muted-foreground mt-1">
                Provider detectado: <Badge variant="secondary" className="text-[10px] h-4 ml-1">{videoProvider}</Badge>
              </p>
            )}
          </div>

          {/* Video Description with AI */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Descripción / Notas</Label>
              <AIGenerateButton
                onClick={handleGenerateVideoDescription}
                loading={aiDescLoading}
                success={aiDescSuccess}
                disabled={!titulo && !moduloTitulo}
                tooltip="Generar descripción con IA"
              />
            </div>
            <Textarea
              value={videoDescription}
              onChange={e => setVideoDescription(e.target.value)}
              rows={3}
              className="text-sm"
              placeholder="Descripción del contenido del video, notas para el instructor..."
            />
          </div>

          {/* Video Thumbnail with AI */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Thumbnail / Portada</Label>
              <AIGenerateButton
                onClick={handleGenerateVideoThumbnail}
                loading={aiThumbLoading}
                success={aiThumbSuccess}
                disabled={!titulo && !moduloTitulo}
                tooltip="Generar thumbnail con IA"
              />
            </div>
            {videoThumbnail ? (
              <div className="relative group">
                <img
                  src={videoThumbnail}
                  alt="Thumbnail del video"
                  className="w-full max-h-40 object-cover rounded-md border"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => setVideoThumbnail('')}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-center h-20 border-2 border-dashed rounded-md text-muted-foreground">
                <div className="text-center">
                  <ImageIcon className="w-5 h-5 mx-auto mb-1" />
                  <p className="text-[10px]">Genera un thumbnail con IA</p>
                </div>
              </div>
            )}
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
          <Label className="text-xs">Contenido</Label>
          <RichTextEditor
            value={textoHtml}
            onChange={setTextoHtml}
            onGenerateAI={handleGenerateText}
            aiLoading={aiLoading}
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
