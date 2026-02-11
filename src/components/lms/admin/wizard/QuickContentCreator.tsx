import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Play, FileText, AlignLeft, HelpCircle, Sparkles, X, Check, Clock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { MediaUploader } from "./MediaUploader";
import { VideoScriptGenerator } from "./VideoScriptGenerator";
import { InlineQuizEditor, type QuizQuestionOutline } from "./InlineQuizEditor";
import { InlineFlashcardEditor, type FlashcardOutline } from "./InlineFlashcardEditor";
import { useLMSAI } from "@/hooks/lms/useLMSAI";
import { toast } from "sonner";
import type { ContentOutline } from "./StepEstructura";

const CONTENT_TYPES = [
  { tipo: 'video' as const, label: 'Video', icon: Play, color: 'text-red-500 bg-red-50 hover:bg-red-100 border-red-200' },
  { tipo: 'documento' as const, label: 'Documento', icon: FileText, color: 'text-blue-500 bg-blue-50 hover:bg-blue-100 border-blue-200' },
  { tipo: 'texto_enriquecido' as const, label: 'Texto', icon: AlignLeft, color: 'text-green-500 bg-green-50 hover:bg-green-100 border-green-200' },
  { tipo: 'quiz' as const, label: 'Quiz', icon: HelpCircle, color: 'text-purple-500 bg-purple-50 hover:bg-purple-100 border-purple-200' },
  { tipo: 'interactivo' as const, label: 'Interactivo', icon: Sparkles, color: 'text-orange-500 bg-orange-50 hover:bg-orange-100 border-orange-200' },
];

interface QuickContentCreatorProps {
  moduloTitulo?: string;
  cursoTitulo?: string;
  onAdd: (content: ContentOutline) => void;
  onCancel: () => void;
}

export function QuickContentCreator({ moduloTitulo, cursoTitulo, onAdd, onCancel }: QuickContentCreatorProps) {
  const [selectedType, setSelectedType] = useState<ContentOutline['tipo'] | null>(null);
  const [titulo, setTitulo] = useState("");
  const [duracion, setDuracion] = useState(10);
  
  // Content-specific state
  const [videoUrl, setVideoUrl] = useState("");
  const [documentoUrl, setDocumentoUrl] = useState("");
  const [textoHtml, setTextoHtml] = useState("");
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestionOutline[]>([]);
  const [flashcards, setFlashcards] = useState<FlashcardOutline[]>([]);
  
  const { generateRichText, loading: aiLoading } = useLMSAI();

  const detectVideoProvider = (url: string): 'youtube' | 'vimeo' | 'storage' => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
    if (url.includes('vimeo.com')) return 'vimeo';
    return 'storage';
  };

  const handleCreate = () => {
    if (!selectedType || !titulo.trim()) return;

    const content: ContentOutline = {
      id: crypto.randomUUID(),
      titulo: titulo.trim(),
      tipo: selectedType,
      duracion_min: duracion,
      orden: 0,
      contenido: undefined,
    };

    // Add content-specific data
    switch (selectedType) {
      case 'video':
        if (videoUrl) {
          content.contenido = {
            url: videoUrl,
            provider: detectVideoProvider(videoUrl),
          };
        }
        break;
      case 'documento':
        if (documentoUrl) {
          content.contenido = {
            url: documentoUrl,
          };
        }
        break;
      case 'texto_enriquecido':
        if (textoHtml) {
          content.contenido = {
            html: textoHtml,
          };
        }
        break;
      case 'quiz':
        content.contenido = {
          preguntas: quizQuestions,
          preguntas_count: quizQuestions.length,
        };
        break;
      case 'interactivo':
        content.contenido = {
          flashcards,
        };
        break;
    }

    onAdd(content);
    resetForm();
  };

  const resetForm = () => {
    setSelectedType(null);
    setTitulo("");
    setDuracion(10);
    setVideoUrl("");
    setDocumentoUrl("");
    setTextoHtml("");
    setQuizQuestions([]);
    setFlashcards([]);
  };

  const handleGenerateText = async () => {
    if (!titulo.trim() && !moduloTitulo) {
      toast.error("Ingresa un título primero");
      return;
    }
    
    const tema = titulo.trim() || moduloTitulo || cursoTitulo || "";
    const result = await generateRichText(tema, `Módulo: ${moduloTitulo}, Curso: ${cursoTitulo}`, "media");
    
    if (result?.html) {
      setTextoHtml(result.html);
    }
  };

  const isContentComplete = (): boolean => {
    switch (selectedType) {
      case 'video':
        return !!videoUrl;
      case 'documento':
        return !!documentoUrl;
      case 'texto_enriquecido':
        return !!textoHtml && textoHtml.length > 20;
      case 'quiz':
      case 'interactivo':
        return true; // Will be configured later
      default:
        return false;
    }
  };

  // Step 1: Type selection
  if (!selectedType) {
    return (
      <div className="p-3 bg-muted/30 rounded-lg border border-dashed">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-muted-foreground">Selecciona el tipo de contenido:</span>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onCancel}>
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {CONTENT_TYPES.map(({ tipo, label, icon: Icon, color }) => (
            <button
              key={tipo}
              onClick={() => setSelectedType(tipo)}
              className={cn(
                "flex flex-col items-center gap-1.5 p-3 rounded-lg border text-xs font-medium transition-all",
                color
              )}
            >
              <Icon className="w-5 h-5" />
              {label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  const TypeInfo = CONTENT_TYPES.find(t => t.tipo === selectedType);
  const TypeIcon = TypeInfo?.icon || AlignLeft;

  return (
    <div className="p-4 bg-muted/30 rounded-lg border space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className={cn("p-2 rounded-lg", TypeInfo?.color)}>
          <TypeIcon className="w-4 h-4" />
        </div>
        <span className="text-sm font-medium flex-1">{TypeInfo?.label}</span>
        <button 
          onClick={() => setSelectedType(null)}
          className="text-xs text-muted-foreground hover:text-foreground underline"
        >
          Cambiar tipo
        </button>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onCancel}>
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Title and Duration */}
      <div className="flex gap-3">
        <div className="flex-1 space-y-1">
          <Label className="text-xs">Título</Label>
          <Input
            placeholder="Nombre del contenido..."
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            className="h-9"
            autoFocus
          />
        </div>
        <div className="w-24 space-y-1">
          <Label className="text-xs flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Duración
          </Label>
          <div className="flex items-center gap-1">
            <Input
              type="number"
              value={duracion}
              onChange={(e) => setDuracion(parseInt(e.target.value) || 0)}
              className="h-9 text-center"
              min={1}
            />
            <span className="text-xs text-muted-foreground">min</span>
          </div>
        </div>
      </div>

      {/* Content-specific fields */}
      <div className="space-y-2">
        {selectedType === 'video' && (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Video</Label>
              <MediaUploader
                type="video"
                value={videoUrl}
                onChange={setVideoUrl}
              />
            </div>
            <VideoScriptGenerator
              tema={titulo || moduloTitulo || ""}
              moduloTitulo={moduloTitulo}
              cursoTitulo={cursoTitulo}
              duracionMin={duracion}
            />
          </div>
        )}

        {selectedType === 'documento' && (
          <>
            <Label className="text-xs">Documento</Label>
            <MediaUploader
              type="document"
              value={documentoUrl}
              onChange={setDocumentoUrl}
            />
          </>
        )}

        {selectedType === 'texto_enriquecido' && (
          <>
            <div className="flex items-center justify-between">
              <Label className="text-xs">Contenido</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGenerateText}
                disabled={aiLoading}
                className="h-7 text-xs gap-1"
              >
                {aiLoading ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3" />
                )}
                Generar con IA
              </Button>
            </div>
            <Textarea
              placeholder="Escribe el contenido aquí o genera con IA..."
              value={textoHtml}
              onChange={(e) => setTextoHtml(e.target.value)}
              rows={4}
              className="text-sm resize-none"
            />
          </>
        )}

        {selectedType === 'quiz' && (
          <InlineQuizEditor
            questions={quizQuestions}
            onChange={setQuizQuestions}
            moduloTitulo={moduloTitulo}
            cursoTitulo={cursoTitulo}
          />
        )}

        {selectedType === 'interactivo' && (
          <InlineFlashcardEditor
            cards={flashcards}
            onChange={setFlashcards}
            moduloTitulo={moduloTitulo}
            cursoTitulo={cursoTitulo}
          />
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center pt-2 border-t">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {selectedType !== 'quiz' && selectedType !== 'interactivo' && (
            isContentComplete() ? (
              <span className="flex items-center gap-1 text-green-600">
                <Check className="w-3 h-3" />
                Contenido listo
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-600">
                Puedes completar el contenido después
              </span>
            )
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancelar
          </Button>
          <Button 
            size="sm" 
            onClick={handleCreate}
            disabled={!titulo.trim()}
            className="gap-1"
          >
            <Check className="w-3.5 h-3.5" />
            Agregar
          </Button>
        </div>
      </div>
    </div>
  );
}
