import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Play, FileText, AlignLeft, HelpCircle, Sparkles, X, Check, Clock, Loader2, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { MediaUploader } from "./MediaUploader";
import { VideoScriptGenerator } from "./VideoScriptGenerator";
import { InlineQuizEditor, type QuizQuestionOutline } from "./InlineQuizEditor";
import { InlineFlashcardEditor, type FlashcardOutline } from "./InlineFlashcardEditor";
import { useLMSAI } from "@/hooks/lms/useLMSAI";
import type { ContentOutline } from "./StepEstructura";

const TIPO_ICONS = {
  video: Play,
  documento: FileText,
  texto_enriquecido: AlignLeft,
  quiz: HelpCircle,
  interactivo: Sparkles,
};

const TIPO_COLORS = {
  video: "text-red-500 bg-red-50 border-red-200",
  documento: "text-blue-500 bg-blue-50 border-blue-200",
  texto_enriquecido: "text-green-500 bg-green-50 border-green-200",
  quiz: "text-purple-500 bg-purple-50 border-purple-200",
  interactivo: "text-orange-500 bg-orange-50 border-orange-200",
};

const TIPO_LABELS = {
  video: "Video",
  documento: "Documento",
  texto_enriquecido: "Texto Enriquecido",
  quiz: "Quiz",
  interactivo: "Interactivo",
};

interface ContentEditorProps {
  contenido: ContentOutline;
  onUpdate: (updates: Partial<ContentOutline>) => void;
  onClose: () => void;
}

export function ContentEditor({ contenido, onUpdate, onClose }: ContentEditorProps) {
  const [titulo, setTitulo] = useState(contenido.titulo);
  const [duracion, setDuracion] = useState(contenido.duracion_min);
  const [url, setUrl] = useState(contenido.contenido?.url || "");
  const [html, setHtml] = useState(contenido.contenido?.html || "");
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestionOutline[]>(contenido.contenido?.preguntas || []);
  const [flashcards, setFlashcards] = useState<FlashcardOutline[]>(contenido.contenido?.flashcards || []);
  
  const { generateRichText, loading: aiLoading } = useLMSAI();
  
  const Icon = TIPO_ICONS[contenido.tipo] || AlignLeft;
  const colorClass = TIPO_COLORS[contenido.tipo] || "text-gray-500 bg-gray-50";

  const detectVideoProvider = (videoUrl: string): 'youtube' | 'vimeo' | 'tiktok' | 'instagram' | 'facebook' | 'canva' | 'storage' => {
    if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) return 'youtube';
    if (videoUrl.includes('vimeo.com')) return 'vimeo';
    if (videoUrl.includes('tiktok.com')) return 'tiktok';
    if (videoUrl.includes('instagram.com')) return 'instagram';
    if (videoUrl.includes('facebook.com') || videoUrl.includes('fb.watch')) return 'facebook';
    if (videoUrl.includes('canva.com')) return 'canva';
    return 'storage';
  };

  const handleSave = () => {
    const updates: Partial<ContentOutline> = {
      titulo,
      duracion_min: duracion,
    };

    switch (contenido.tipo) {
      case 'video':
        updates.contenido = {
          ...contenido.contenido,
          url,
          provider: url ? detectVideoProvider(url) : undefined,
        };
        break;
      case 'documento':
        updates.contenido = {
          ...contenido.contenido,
          url,
        };
        break;
      case 'texto_enriquecido':
        updates.contenido = {
          ...contenido.contenido,
          html,
        };
        break;
      case 'quiz':
        updates.contenido = {
          ...contenido.contenido,
          preguntas: quizQuestions,
          preguntas_count: quizQuestions.length,
        };
        break;
      case 'interactivo':
        updates.contenido = {
          ...contenido.contenido,
          flashcards,
        };
        break;
    }

    onUpdate(updates);
    onClose();
  };

  const handleGenerateText = async () => {
    const result = await generateRichText(titulo, undefined, "media");
    if (result?.html) {
      setHtml(result.html);
    }
  };

  return (
    <div className="p-4 bg-background rounded-lg border-2 border-primary/20 space-y-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className={cn("p-2 rounded-lg border", colorClass)}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <span className="text-sm font-medium">{TIPO_LABELS[contenido.tipo]}</span>
          <p className="text-xs text-muted-foreground">Editando contenido</p>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Title and Duration */}
      <div className="flex gap-3">
        <div className="flex-1 space-y-1">
          <Label className="text-xs">Título</Label>
          <Input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            className="h-9"
          />
        </div>
        <div className="w-28 space-y-1">
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
      {contenido.tipo === 'video' && (
        <div className="space-y-3">
          <div className="space-y-2">
            <Label className="text-xs">Video</Label>
            <MediaUploader
              type="video"
              value={url}
              onChange={setUrl}
            />
          </div>
          <VideoScriptGenerator
            tema={titulo}
            cursoTitulo=""
            moduloTitulo=""
            duracionMin={duracion}
          />
        </div>
      )}

      {contenido.tipo === 'documento' && (
        <div className="space-y-2">
          <Label className="text-xs">Documento</Label>
          <MediaUploader
            type="document"
            value={url}
            onChange={setUrl}
          />
        </div>
      )}

      {contenido.tipo === 'texto_enriquecido' && (
        <div className="space-y-2">
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
            placeholder="Escribe el contenido aquí..."
            value={html}
            onChange={(e) => setHtml(e.target.value)}
            rows={6}
            className="text-sm resize-none"
          />
        </div>
      )}

      {contenido.tipo === 'quiz' && (
        <InlineQuizEditor
          questions={quizQuestions}
          onChange={setQuizQuestions}
          moduloTitulo=""
          cursoTitulo=""
        />
      )}

      {contenido.tipo === 'interactivo' && (
        <InlineFlashcardEditor
          cards={flashcards}
          onChange={setFlashcards}
          moduloTitulo=""
          cursoTitulo=""
        />
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2 border-t">
        <Button variant="ghost" size="sm" onClick={onClose}>
          Cancelar
        </Button>
        <Button size="sm" onClick={handleSave} className="gap-1">
          <Save className="w-3.5 h-3.5" />
          Guardar
        </Button>
      </div>
    </div>
  );
}
