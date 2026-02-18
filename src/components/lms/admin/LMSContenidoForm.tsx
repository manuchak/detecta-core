import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Sparkles, Video, FileText, Code, HelpCircle, Clock, Settings2, Package, Award } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LMS_TIPOS_CONTENIDO, type TipoContenido, type ContenidoData, type QuizContent, type TipoInteractivo, type InteractivoContent } from "@/types/lms";
import { useLMSAI } from "@/hooks/lms/useLMSAI";
import { toast } from "sonner";
import { QuizEditor } from "./quiz/QuizEditor";
import { QuizQuestion } from "./quiz/QuestionCard";
import { cn } from "@/lib/utils";
import { MediaUploader } from "./wizard/MediaUploader";
import { useLMSCrearPreguntas, useLMSEliminarPreguntas, fetchPreguntasByIds } from "@/hooks/lms/useLMSAdminPreguntas";
import { getDocumentType } from "@/utils/documentUtils";
import { useLMSPlantillas } from "@/hooks/lms/useLMSPlantillas";
import { type ScormContent, type CertificadoPlantillaContent } from "@/types/lms";


interface ContenidoFormData {
  titulo: string;
  tipo: TipoContenido;
  contenido: ContenidoData;
  duracion_min: number;
  es_obligatorio: boolean;
  orden: number;
  activo: boolean;
}

interface LMSContenidoFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  moduloId: string;
  cursoId: string;
  moduloTitulo?: string;
  contenido?: {
    id: string;
    titulo: string;
    tipo: TipoContenido;
    contenido: ContenidoData;
    duracion_min: number;
    es_obligatorio: boolean;
    orden: number;
    activo: boolean;
  } | null;
  nextOrden: number;
  onSubmit: (data: ContenidoFormData) => Promise<void>;
  isLoading?: boolean;
}

const TIPO_ICONS: Record<TipoContenido, React.ReactNode> = {
  video: <Video className="h-4 w-4" />,
  documento: <FileText className="h-4 w-4" />,
  texto_enriquecido: <FileText className="h-4 w-4" />,
  embed: <Code className="h-4 w-4" />,
  quiz: <HelpCircle className="h-4 w-4" />,
  interactivo: <Code className="h-4 w-4" />,
  scorm: <Package className="h-4 w-4" />,
  certificado_plantilla: <Award className="h-4 w-4" />,
};

export function LMSContenidoForm({
  open,
  onOpenChange,
  moduloId,
  cursoId,
  moduloTitulo,
  contenido,
  nextOrden,
  onSubmit,
  isLoading = false
}: LMSContenidoFormProps) {
  const [titulo, setTitulo] = useState("");
  const [tipo, setTipo] = useState<TipoContenido>("texto_enriquecido");
  const [duracion, setDuracion] = useState(10);
  const [orden, setOrden] = useState(nextOrden);
  const [activo, setActivo] = useState(true);
  const [esObligatorio, setEsObligatorio] = useState(true);
  const [activeTab, setActiveTab] = useState("contenido");

  // Campos de contenido según tipo
  const [videoUrl, setVideoUrl] = useState("");
  const [documentoUrl, setDocumentoUrl] = useState("");
  const [textoHtml, setTextoHtml] = useState("");
  const [embedHtml, setEmbedHtml] = useState("");

  // Interactivo - embed externo
  const [interactivoTipo, setInteractivoTipo] = useState<TipoInteractivo>('embed_externo');
  const [embedExternoHtml, setEmbedExternoHtml] = useState("");
  const [embedAltura, setEmbedAltura] = useState(500);
  const [embedAncho, setEmbedAncho] = useState<string>("100%");

  // Quiz - using new QuizQuestion type
  const [quizPreguntas, setQuizPreguntas] = useState<QuizQuestion[]>([]);
  const [quizConfig, setQuizConfig] = useState({
    puntuacion_minima: 70,
    intentos_permitidos: 3,
    tiempo_limite_min: null as number | null,
    mostrar_respuestas_correctas: true
  });

  // SCORM
  const [scormEntryPoint, setScormEntryPoint] = useState("");
  const [scormVersion, setScormVersion] = useState<'SCORM_1.2' | 'SCORM_2004'>('SCORM_1.2');
  const [scormHeight, setScormHeight] = useState(600);

  // Certificado plantilla
  const [certificadoPlantillaId, setCertificadoPlantillaId] = useState("");

  // Track deleted question IDs for cleanup
  const [preguntasEliminadas, setPreguntasEliminadas] = useState<string[]>([]);
  const [preguntasOriginales, setPreguntasOriginales] = useState<string[]>([]);

  const crearPreguntas = useLMSCrearPreguntas();
  const eliminarPreguntas = useLMSEliminarPreguntas();
  const { data: plantillas = [] } = useLMSPlantillas();

  useEffect(() => {
    if (contenido) {
      setTitulo(contenido.titulo);
      setTipo(contenido.tipo);
      setDuracion(contenido.duracion_min);
      setOrden(contenido.orden);
      setActivo(contenido.activo);
      setEsObligatorio(contenido.es_obligatorio);

      // Cargar contenido según tipo
      const c = contenido.contenido as any;
      if (contenido.tipo === 'video' && c?.url) setVideoUrl(c.url);
      if (contenido.tipo === 'documento' && c?.url) setDocumentoUrl(c.url);
      if (contenido.tipo === 'texto_enriquecido' && c?.html) setTextoHtml(c.html);
      if (contenido.tipo === 'embed' && c?.html) setEmbedHtml(c.html);
      if (contenido.tipo === 'interactivo' && c) {
        setInteractivoTipo(c.tipo || 'embed_externo');
        if (c.tipo === 'embed_externo' && c.data) {
          setEmbedExternoHtml(c.data.html || '');
          setEmbedAltura(c.data.altura || 500);
          setEmbedAncho(c.data.ancho?.toString() || '100%');
        }
      }
      if (contenido.tipo === 'quiz' && c) {
        setQuizConfig({
          puntuacion_minima: c.puntuacion_minima ?? 70,
          intentos_permitidos: c.intentos_permitidos ?? 3,
          tiempo_limite_min: c.tiempo_limite_min ?? null,
          mostrar_respuestas_correctas: c.mostrar_respuestas_correctas ?? true
        });
        // Load existing questions from database
        if (c.preguntas_ids?.length > 0) {
          setPreguntasOriginales(c.preguntas_ids);
          fetchPreguntasByIds(c.preguntas_ids)
            .then(preguntas => setQuizPreguntas(preguntas))
            .catch(err => console.error('Error loading quiz questions:', err));
        }
      }
    } else {
      resetForm();
    }
  }, [contenido, nextOrden, open]);

  const resetForm = () => {
    setTitulo("");
    setTipo("texto_enriquecido");
    setDuracion(10);
    setOrden(nextOrden);
    setActivo(true);
    setEsObligatorio(true);
    setVideoUrl("");
    setDocumentoUrl("");
    setTextoHtml("");
    setEmbedHtml("");
    setInteractivoTipo('embed_externo');
    setEmbedExternoHtml("");
    setEmbedAltura(500);
    setEmbedAncho("100%");
    setQuizPreguntas([]);
    setQuizConfig({
      puntuacion_minima: 70,
      intentos_permitidos: 3,
      tiempo_limite_min: null,
      mostrar_respuestas_correctas: true
    });
    setScormEntryPoint("");
    setScormVersion('SCORM_1.2');
    setScormHeight(600);
    setCertificadoPlantillaId("");
    setActiveTab("contenido");
    setPreguntasEliminadas([]);
    setPreguntasOriginales([]);
  };

  // Track question deletions
  const handleQuizPreguntasChange = useCallback((newPreguntas: QuizQuestion[]) => {
    const currentIds = new Set(newPreguntas.map(p => p.id));
    const deletedIds = quizPreguntas
      .filter(p => preguntasOriginales.includes(p.id) && !currentIds.has(p.id))
      .map(p => p.id);
    
    if (deletedIds.length > 0) {
      setPreguntasEliminadas(prev => [...new Set([...prev, ...deletedIds])]);
    }
    setQuizPreguntas(newPreguntas);
  }, [quizPreguntas, preguntasOriginales]);

  const handleTipoChange = (newTipo: TipoContenido) => {
    setTipo(newTipo);
  };

  const detectVideoProvider = (url: string): 'youtube' | 'vimeo' | 'tiktok' | 'instagram' | 'facebook' | 'canva' | 'storage' => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
    if (url.includes('vimeo.com')) return 'vimeo';
    if (url.includes('tiktok.com')) return 'tiktok';
    if (url.includes('instagram.com')) return 'instagram';
    if (url.includes('facebook.com') || url.includes('fb.watch')) return 'facebook';
    if (url.includes('canva.com')) return 'canva';
    return 'storage';
  };

  const buildContenidoData = (): ContenidoData => {
    switch (tipo) {
      case 'video':
        return { url: videoUrl, provider: detectVideoProvider(videoUrl) };
      case 'documento':
        return { url: documentoUrl, tipo: getDocumentType(documentoUrl) };
      case 'texto_enriquecido':
        return { html: textoHtml };
      case 'embed':
        return { html: embedHtml, altura: 400 };
      case 'interactivo':
        if (interactivoTipo === 'embed_externo') {
          return {
            tipo: 'embed_externo',
            data: {
              html: embedExternoHtml,
              altura: embedAltura,
              ancho: embedAncho
            }
          } as InteractivoContent;
        }
        return { tipo: interactivoTipo, data: {} } as InteractivoContent;
      case 'quiz':
        return {
          preguntas_ids: quizPreguntas.map(p => p.id),
          puntuacion_minima: quizConfig.puntuacion_minima,
          intentos_permitidos: quizConfig.intentos_permitidos,
          mostrar_respuestas_correctas: quizConfig.mostrar_respuestas_correctas,
          tiempo_limite_min: quizConfig.tiempo_limite_min ?? undefined
        } as QuizContent;
      case 'scorm': {
        return {
          package_url: '',
          entry_point: scormEntryPoint,
          version: scormVersion,
          height: scormHeight,
        } as ScormContent;
      }
      case 'certificado_plantilla': {
        const plantilla = plantillas.find(p => p.id === certificadoPlantillaId);
        return {
          plantilla_id: certificadoPlantillaId,
          plantilla_nombre: plantilla?.nombre ?? '',
        } as CertificadoPlantillaContent;
      }
      default:
        return { html: '' };
    }
  };

  const { generateQuizQuestions, generateRichText, loading: aiLoading } = useLMSAI();

  const handleGenerateQuiz = useCallback(async () => {
    if (!titulo || titulo.length < 3) {
      toast.error("Escribe un título de al menos 3 caracteres");
      return;
    }

    const result = await generateQuizQuestions(titulo, 5);
    if (result?.questions) {
      const nuevasPreguntas: QuizQuestion[] = result.questions.map(q => ({
        id: crypto.randomUUID(),
        pregunta: q.question,
        opciones: q.options.map(o => ({ texto: o.text })),
        respuesta_correcta: q.options.findIndex(o => o.isCorrect),
        explicacion: "",
        puntos: 10
      }));
      setQuizPreguntas([...quizPreguntas, ...nuevasPreguntas]);
      toast.success(`${nuevasPreguntas.length} preguntas generadas con IA`);
    }
  }, [titulo, quizPreguntas, generateQuizQuestions]);

  const handleGenerateRichText = async () => {
    if (!titulo || titulo.length < 3) {
      toast.error("Escribe un título de al menos 3 caracteres");
      return;
    }

    const result = await generateRichText(titulo, undefined, "media");
    if (result?.html) {
      setTextoHtml(result.html);
      toast.success("Contenido generado con IA");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let preguntasIds: string[] = [];
    
    // If quiz type, save questions to lms_preguntas first
    if (tipo === 'quiz' && quizPreguntas.length > 0 && cursoId) {
      try {
        await crearPreguntas.mutateAsync({ 
          cursoId, 
          preguntas: quizPreguntas 
        });
        preguntasIds = quizPreguntas.map(p => p.id);
        
        // Delete removed questions
        if (preguntasEliminadas.length > 0) {
          await eliminarPreguntas.mutateAsync(preguntasEliminadas);
        }
      } catch (error) {
        console.error('Error saving quiz questions:', error);
        toast.error("Error al guardar las preguntas del quiz");
        return;
      }
    }
    
    const contenidoData = buildContenidoData();
    // Update preguntas_ids with saved IDs
    if (tipo === 'quiz' && preguntasIds.length > 0) {
      (contenidoData as QuizContent).preguntas_ids = preguntasIds;
    }
    
    const submitData: ContenidoFormData = {
      titulo,
      tipo,
      contenido: contenidoData,
      duracion_min: duracion,
      es_obligatorio: esObligatorio,
      orden,
      activo
    };
    
    await onSubmit(submitData);
  };

  const isEditing = !!contenido;
  const isQuizMode = tipo === 'quiz';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        "max-h-[90vh] overflow-hidden flex flex-col",
        isQuizMode ? "max-w-4xl" : "max-w-2xl"
      )}>
        <DialogHeader className="flex-shrink-0 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            {TIPO_ICONS[tipo]}
            {isEditing ? "Editar Contenido" : "Nuevo Contenido"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
          {/* Header Fields */}
          <div className="flex-shrink-0 grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="titulo" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Título *
              </Label>
              <Input
                id="titulo"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Título del contenido"
                required
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Tipo de Contenido
              </Label>
              <Select value={tipo} onValueChange={(v) => handleTipoChange(v as TipoContenido)}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LMS_TIPOS_CONTENIDO.map(t => (
                    <SelectItem key={t.value} value={t.value}>
                      <div className="flex items-center gap-2">
                        {TIPO_ICONS[t.value as TipoContenido]}
                        {t.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="flex-shrink-0 grid w-full grid-cols-2 bg-muted/50">
              <TabsTrigger value="contenido" className="gap-2">
                {TIPO_ICONS[tipo]}
                Contenido
              </TabsTrigger>
              <TabsTrigger value="config" className="gap-2">
                <Settings2 className="h-4 w-4" />
                Configuración
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto mt-4 pr-1">
              <TabsContent value="contenido" className="mt-0 space-y-4">
                {tipo === 'video' && (
                  <div className="space-y-3 p-4 rounded-xl bg-muted/30 border">
                    <Label className="text-sm font-medium">Video</Label>
                    <MediaUploader
                      type="video"
                      value={videoUrl}
                      onChange={setVideoUrl}
                      placeholder="YouTube, Vimeo, TikTok, Instagram, Facebook o Canva URL..."
                    />
                  </div>
                )}

                {tipo === 'documento' && (
                  <div className="space-y-3 p-4 rounded-xl bg-muted/30 border">
                    <Label className="text-sm font-medium">Documento</Label>
                    <MediaUploader
                      type="document"
                      value={documentoUrl}
                      onChange={setDocumentoUrl}
                      placeholder="https://docs.google.com/... o enlace directo"
                    />
                  </div>
                )}

                {tipo === 'texto_enriquecido' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="texto" className="text-sm font-medium">Contenido de Texto</Label>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={handleGenerateRichText}
                        disabled={aiLoading || !titulo || titulo.length < 3}
                        className="gap-2"
                      >
                        {aiLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Sparkles className="w-4 h-4 text-amber-500" />
                        )}
                        Generar con IA
                      </Button>
                    </div>
                    <Textarea
                      id="texto"
                      value={textoHtml}
                      onChange={(e) => setTextoHtml(e.target.value)}
                      placeholder="Escribe el contenido aquí... (soporta HTML)"
                      rows={12}
                      className="font-mono text-sm"
                    />
                  </div>
                )}

                {tipo === 'embed' && (
                  <div className="space-y-3 p-4 rounded-xl bg-muted/30 border">
                    <Label htmlFor="embed" className="text-sm font-medium">Código Embed (HTML)</Label>
                    <Textarea
                      id="embed"
                      value={embedHtml}
                      onChange={(e) => setEmbedHtml(e.target.value)}
                      placeholder="<iframe src='...'></iframe>"
                      rows={8}
                      className="font-mono text-sm"
                    />
                  </div>
                )}

                {tipo === 'interactivo' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Tipo de Interactivo</Label>
                      <Select value={interactivoTipo} onValueChange={(v) => setInteractivoTipo(v as TipoInteractivo)}>
                        <SelectTrigger className="h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="embed_externo">Embed Externo (iframe)</SelectItem>
                          <SelectItem value="flashcards" disabled>Flashcards (próximamente)</SelectItem>
                          <SelectItem value="video_interactivo" disabled>Video Interactivo (próximamente)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {interactivoTipo === 'embed_externo' && (
                      <div className="space-y-4 p-4 rounded-xl bg-muted/30 border">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Código Embed (iframe)</Label>
                          <Textarea
                            value={embedExternoHtml}
                            onChange={(e) => setEmbedExternoHtml(e.target.value)}
                            placeholder='<iframe src="https://view.genial.ly/..." width="100%" height="500" allowfullscreen></iframe>'
                            rows={6}
                            className="font-mono text-sm"
                          />
                          <p className="text-xs text-muted-foreground">
                            Pega el código iframe de Genially, Canva, H5P, Google Maps, Loom, etc.
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Altura (px)</Label>
                            <Input
                              type="number"
                              min={200}
                              value={embedAltura}
                              onChange={(e) => setEmbedAltura(parseInt(e.target.value) || 500)}
                              className="h-9"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Ancho</Label>
                            <Input
                              value={embedAncho}
                              onChange={(e) => setEmbedAncho(e.target.value || '100%')}
                              placeholder="100% o 800px"
                              className="h-9"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {tipo === 'quiz' && (
                  <div className="space-y-4">
                    {/* Quiz Editor Component */}
                    <QuizEditor
                      questions={quizPreguntas}
                      onChange={handleQuizPreguntasChange}
                      onGenerateWithAI={handleGenerateQuiz}
                      isGenerating={aiLoading}
                      moduloTitulo={moduloTitulo || titulo}
                    />

                    {/* Quiz Configuration */}
                    {quizPreguntas.length > 0 && (
                      <div className="p-4 rounded-xl bg-muted/30 border space-y-4">
                        <h4 className="text-sm font-semibold flex items-center gap-2">
                          <Settings2 className="h-4 w-4" />
                          Configuración del Quiz
                        </h4>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Puntaje mínimo (%)</Label>
                            <Input
                              type="number"
                              min={0}
                              max={100}
                              value={quizConfig.puntuacion_minima}
                              onChange={(e) => setQuizConfig({ ...quizConfig, puntuacion_minima: parseInt(e.target.value) || 70 })}
                              className="h-9"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Intentos máximos</Label>
                            <Input
                              type="number"
                              min={1}
                              value={quizConfig.intentos_permitidos}
                              onChange={(e) => setQuizConfig({ ...quizConfig, intentos_permitidos: parseInt(e.target.value) || 3 })}
                              className="h-9"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Tiempo límite (min)</Label>
                            <Input
                              type="number"
                              min={0}
                              value={quizConfig.tiempo_limite_min || ""}
                              onChange={(e) => setQuizConfig({ ...quizConfig, tiempo_limite_min: e.target.value ? parseInt(e.target.value) : null })}
                              placeholder="Sin límite"
                              className="h-9"
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-2">
                          <Label className="text-sm">Mostrar respuestas correctas al finalizar</Label>
                          <Switch
                            checked={quizConfig.mostrar_respuestas_correctas}
                            onCheckedChange={(checked) => setQuizConfig({ ...quizConfig, mostrar_respuestas_correctas: checked })}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {tipo === 'scorm' && (
                  <div className="space-y-4 p-4 rounded-xl bg-muted/30 border">
                    <div className="flex items-center gap-2 mb-1">
                      <Package className="h-4 w-4 text-primary" />
                      <Label className="text-sm font-medium">Paquete SCORM</Label>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">URL del Entry Point (index.html dentro del paquete)</Label>
                      <Input
                        value={scormEntryPoint}
                        onChange={(e) => setScormEntryPoint(e.target.value)}
                        placeholder="https://storage.../lms-scorm/mi-curso/index.html"
                        className="h-9 font-mono text-sm"
                      />
                      <p className="text-xs text-muted-foreground">
                        Sube el ZIP a Storage → lms-scorm, descomprímelo y pega la URL pública del <code>index.html</code>.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Versión SCORM</Label>
                        <Select value={scormVersion} onValueChange={(v) => setScormVersion(v as 'SCORM_1.2' | 'SCORM_2004')}>
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="SCORM_1.2">SCORM 1.2</SelectItem>
                            <SelectItem value="SCORM_2004">SCORM 2004</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Altura del visor (px)</Label>
                        <Input
                          type="number"
                          min={400}
                          value={scormHeight}
                          onChange={(e) => setScormHeight(parseInt(e.target.value) || 600)}
                          className="h-9"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {tipo === 'certificado_plantilla' && (
                  <div className="space-y-4 p-4 rounded-xl bg-muted/30 border">
                    <div className="flex items-center gap-2 mb-1">
                      <Award className="h-4 w-4 text-amber-500" />
                      <Label className="text-sm font-medium">Plantilla de Certificado</Label>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Selecciona la plantilla</Label>
                      <Select value={certificadoPlantillaId} onValueChange={setCertificadoPlantillaId}>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="— Selecciona una plantilla —" />
                        </SelectTrigger>
                        <SelectContent>
                          {plantillas.map(p => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.nombre}{p.es_default ? ' (predeterminada)' : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        El alumno verá su nombre, la fecha y el título del curso en la constancia y podrá descargarla en PDF.
                      </p>
                    </div>
                    {certificadoPlantillaId && plantillas.find(p => p.id === certificadoPlantillaId) && (
                      <div className="p-3 rounded-lg bg-background border text-xs text-muted-foreground">
                        Variables disponibles: {plantillas.find(p => p.id === certificadoPlantillaId)?.variables_disponibles.map(v => `{{${v}}}`).join(', ')}
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="config" className="mt-0 space-y-4">
                <div className="p-4 rounded-xl bg-muted/30 border space-y-4">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Tiempo y Orden
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="duracion" className="text-xs text-muted-foreground">
                        Duración estimada (minutos)
                      </Label>
                      <Input
                        id="duracion"
                        type="number"
                        min={1}
                        value={duracion}
                        onChange={(e) => setDuracion(parseInt(e.target.value) || 10)}
                        className="h-9"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="orden" className="text-xs text-muted-foreground">
                        Orden en el módulo
                      </Label>
                      <Input
                        id="orden"
                        type="number"
                        min={1}
                        value={orden}
                        onChange={(e) => setOrden(parseInt(e.target.value) || 1)}
                        className="h-9"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-muted/30 border space-y-4">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <Settings2 className="h-4 w-4" />
                    Opciones
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-2">
                      <div>
                        <Label htmlFor="obligatorio" className="text-sm font-medium">Contenido Obligatorio</Label>
                        <p className="text-xs text-muted-foreground">El usuario debe completar este contenido</p>
                      </div>
                      <Switch
                        id="obligatorio"
                        checked={esObligatorio}
                        onCheckedChange={setEsObligatorio}
                      />
                    </div>

                    <div className="flex items-center justify-between py-2 border-t pt-4">
                      <div>
                        <Label htmlFor="activo" className="text-sm font-medium">Contenido Activo</Label>
                        <p className="text-xs text-muted-foreground">Visible para los usuarios</p>
                      </div>
                      <Switch
                        id="activo"
                        checked={activo}
                        onCheckedChange={setActivo}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>

          {/* Footer */}
          <div className="flex-shrink-0 flex justify-end gap-2 pt-4 border-t mt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !titulo.trim()}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEditing ? "Guardar Cambios" : "Crear Contenido"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
