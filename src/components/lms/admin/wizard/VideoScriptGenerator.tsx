import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useLMSAI } from "@/hooks/lms/useLMSAI";
import { Sparkles, Loader2, Copy, Check, Film, Clock, FileText, Bot, ClipboardList } from "lucide-react";
import { toast } from "sonner";

interface VideoScriptGeneratorProps {
  tema: string;
  moduloTitulo?: string;
  cursoTitulo?: string;
  duracionMin?: number;
}

export function VideoScriptGenerator({ tema, moduloTitulo, cursoTitulo, duracionMin = 5 }: VideoScriptGeneratorProps) {
  const { generateVideoScript, loading } = useLMSAI();
  const [script, setScript] = useState<{
    introduccion: string;
    puntos_clave: string[];
    ejemplos: string[];
    cierre: string;
  } | null>(null);
  const [promptExterno, setPromptExterno] = useState("");
  const [notasProduccion, setNotasProduccion] = useState("");
  const [duracionEstimada, setDuracionEstimada] = useState(0);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleGenerate = async () => {
    const result = await generateVideoScript(tema, moduloTitulo, cursoTitulo, duracionMin);
    if (result) {
      setScript(result.script);
      setPromptExterno(result.prompt_externo);
      setNotasProduccion(result.notas_produccion);
      setDuracionEstimada(result.duracion_estimada_min);
      toast.success("Guión generado exitosamente");
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success("Copiado al portapapeles");
    setTimeout(() => setCopiedField(null), 2000);
  };

  const fullScript = script
    ? `INTRODUCCIÓN:\n${script.introduccion}\n\nPUNTOS CLAVE:\n${script.puntos_clave.map((p, i) => `${i + 1}. ${p}`).join("\n")}\n\nEJEMPLOS:\n${script.ejemplos.map((e, i) => `${i + 1}. ${e}`).join("\n")}\n\nCIERRE:\n${script.cierre}`
    : "";

  if (!script) {
    return (
      <div className="p-3 bg-muted/30 rounded-lg border border-dashed space-y-2">
        <div className="flex items-center gap-2">
          <Film className="w-4 h-4 text-red-500" />
          <span className="text-sm font-medium">Guión de Video</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Genera un guión estructurado y un prompt para herramientas de IA de video (Synthesia, HeyGen, etc.)
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleGenerate}
          disabled={loading || !tema}
          className="h-7 text-xs gap-1"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
          Generar guión con IA
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-3 bg-muted/20 rounded-lg border">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Film className="w-4 h-4 text-red-500" />
          <span className="text-sm font-medium">Guión Generado</span>
          <Badge variant="secondary" className="text-xs gap-1">
            <Clock className="w-3 h-3" /> ~{duracionEstimada} min
          </Badge>
        </div>
        <div className="flex gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleGenerate}
            disabled={loading}
            className="h-6 text-xs gap-1"
          >
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            Regenerar
          </Button>
        </div>
      </div>

      {/* Script sections */}
      <div className="space-y-2">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium flex items-center gap-1"><FileText className="w-3 h-3" /> Guión completo</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-5 text-xs gap-1"
              onClick={() => copyToClipboard(fullScript, "script")}
            >
              {copiedField === "script" ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
              Copiar
            </Button>
          </div>
          <Textarea
            value={fullScript}
            readOnly
            rows={6}
            className="text-xs resize-none bg-background"
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium flex items-center gap-1"><Bot className="w-3 h-3" /> Prompt para IA de Video</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-5 text-xs gap-1"
              onClick={() => copyToClipboard(promptExterno, "prompt")}
            >
              {copiedField === "prompt" ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
              Copiar
            </Button>
          </div>
          <Textarea
            value={promptExterno}
            readOnly
            rows={3}
            className="text-xs resize-none bg-background"
          />
          <p className="text-xs text-muted-foreground">
            Usa este prompt en Synthesia, HeyGen, Runway u otra herramienta de generación de video
          </p>
        </div>

        {notasProduccion && (
          <div className="p-2 bg-background rounded border">
            <Label className="text-xs font-medium flex items-center gap-1"><ClipboardList className="w-3 h-3" /> Notas de producción</Label>
            <p className="text-xs text-muted-foreground mt-1">{notasProduccion}</p>
          </div>
        )}
      </div>
    </div>
  );
}
