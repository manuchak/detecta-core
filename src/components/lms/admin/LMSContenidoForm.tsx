import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LMS_TIPOS_CONTENIDO, type TipoContenido, type ContenidoData, type QuizContent } from "@/types/lms";

interface QuizPregunta {
  id: string;
  pregunta: string;
  tipo: 'opcion_multiple' | 'verdadero_falso' | 'respuesta_corta';
  opciones?: string[];
  respuesta_correcta: string | number;
  puntos: number;
}

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

export function LMSContenidoForm({
  open,
  onOpenChange,
  moduloId,
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

  // Campos de contenido según tipo
  const [videoUrl, setVideoUrl] = useState("");
  const [documentoUrl, setDocumentoUrl] = useState("");
  const [textoHtml, setTextoHtml] = useState("");
  const [embedHtml, setEmbedHtml] = useState("");

  // Quiz
  const [quizPreguntas, setQuizPreguntas] = useState<QuizPregunta[]>([]);
  const [quizConfig, setQuizConfig] = useState({
    puntuacion_minima: 70,
    intentos_permitidos: 3,
    tiempo_limite_min: null as number | null,
    mostrar_respuestas_correctas: true
  });

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
      if (contenido.tipo === 'quiz' && c) {
        // Para quiz, cargar preguntas del contenido
        setQuizConfig({
          puntuacion_minima: c.puntuacion_minima ?? 70,
          intentos_permitidos: c.intentos_permitidos ?? 3,
          tiempo_limite_min: c.tiempo_limite_min ?? null,
          mostrar_respuestas_correctas: c.mostrar_respuestas_correctas ?? true
        });
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
    setQuizPreguntas([]);
    setQuizConfig({
      puntuacion_minima: 70,
      intentos_permitidos: 3,
      tiempo_limite_min: null,
      mostrar_respuestas_correctas: true
    });
  };

  const handleTipoChange = (newTipo: TipoContenido) => {
    setTipo(newTipo);
  };

  const buildContenidoData = (): ContenidoData => {
    switch (tipo) {
      case 'video':
        return { url: videoUrl, provider: 'youtube' as const };
      case 'documento':
        return { url: documentoUrl, tipo: 'pdf' as const };
      case 'texto_enriquecido':
        return { html: textoHtml };
      case 'embed':
        return { html: embedHtml, altura: 400 };
      case 'quiz':
        return {
          preguntas_ids: quizPreguntas.map(p => p.id),
          puntuacion_minima: quizConfig.puntuacion_minima,
          intentos_permitidos: quizConfig.intentos_permitidos,
          mostrar_respuestas_correctas: quizConfig.mostrar_respuestas_correctas,
          tiempo_limite_min: quizConfig.tiempo_limite_min ?? undefined
        } as QuizContent;
      default:
        return { html: '' };
    }
  };

  const addPregunta = () => {
    const nuevaPregunta: QuizPregunta = {
      id: crypto.randomUUID(),
      pregunta: "",
      tipo: "opcion_multiple",
      opciones: ["", "", "", ""],
      respuesta_correcta: 0,
      puntos: 10
    };
    setQuizPreguntas([...quizPreguntas, nuevaPregunta]);
  };

  const updatePregunta = (index: number, updates: Partial<QuizPregunta>) => {
    const updated = [...quizPreguntas];
    updated[index] = { ...updated[index], ...updates };
    setQuizPreguntas(updated);
  };

  const removePregunta = (index: number) => {
    setQuizPreguntas(quizPreguntas.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData: ContenidoFormData = {
      titulo,
      tipo,
      contenido: buildContenidoData(),
      duracion_min: duracion,
      es_obligatorio: esObligatorio,
      orden,
      activo
    };
    
    await onSubmit(submitData);
  };

  const isEditing = !!contenido;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Contenido" : "Nuevo Contenido"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="titulo">Título *</Label>
              <Input
                id="titulo"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Título del contenido"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de Contenido</Label>
              <Select value={tipo} onValueChange={(v) => handleTipoChange(v as TipoContenido)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LMS_TIPOS_CONTENIDO.map(t => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Tabs defaultValue="contenido" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="contenido">Contenido</TabsTrigger>
              <TabsTrigger value="config">Configuración</TabsTrigger>
            </TabsList>

            <TabsContent value="contenido" className="space-y-4 mt-4">
              {tipo === 'video' && (
                <div className="space-y-2">
                  <Label htmlFor="video_url">URL del Video</Label>
                  <Input
                    id="video_url"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                  />
                  <p className="text-xs text-muted-foreground">
                    Soporta YouTube, Vimeo y enlaces directos
                  </p>
                </div>
              )}

              {tipo === 'documento' && (
                <div className="space-y-2">
                  <Label htmlFor="doc_url">URL del Documento</Label>
                  <Input
                    id="doc_url"
                    value={documentoUrl}
                    onChange={(e) => setDocumentoUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              )}

              {tipo === 'texto_enriquecido' && (
                <div className="space-y-2">
                  <Label htmlFor="texto">Contenido de Texto</Label>
                  <Textarea
                    id="texto"
                    value={textoHtml}
                    onChange={(e) => setTextoHtml(e.target.value)}
                    placeholder="Escribe el contenido aquí... (soporta HTML)"
                    rows={10}
                  />
                </div>
              )}

              {tipo === 'embed' && (
                <div className="space-y-2">
                  <Label htmlFor="embed">Código Embed (HTML)</Label>
                  <Textarea
                    id="embed"
                    value={embedHtml}
                    onChange={(e) => setEmbedHtml(e.target.value)}
                    placeholder="<iframe src='...'></iframe>"
                    rows={6}
                  />
                </div>
              )}

              {tipo === 'quiz' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Preguntas del Quiz</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addPregunta}>
                      + Agregar Pregunta
                    </Button>
                  </div>

                  {quizPreguntas.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No hay preguntas. Agrega al menos una pregunta para el quiz.
                    </p>
                  )}

                  {quizPreguntas.map((pregunta, index) => (
                    <div key={pregunta.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <span className="text-sm font-medium">Pregunta {index + 1}</span>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm"
                          onClick={() => removePregunta(index)}
                        >
                          Eliminar
                        </Button>
                      </div>

                      <Input
                        value={pregunta.pregunta}
                        onChange={(e) => updatePregunta(index, { pregunta: e.target.value })}
                        placeholder="Escribe la pregunta..."
                      />

                      <Select 
                        value={pregunta.tipo} 
                        onValueChange={(v) => updatePregunta(index, { 
                          tipo: v as QuizPregunta['tipo'],
                          opciones: v === 'verdadero_falso' ? ['Verdadero', 'Falso'] : pregunta.opciones,
                          respuesta_correcta: 0
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="opcion_multiple">Opción Múltiple</SelectItem>
                          <SelectItem value="verdadero_falso">Verdadero/Falso</SelectItem>
                          <SelectItem value="respuesta_corta">Respuesta Corta</SelectItem>
                        </SelectContent>
                      </Select>

                      {pregunta.tipo === 'opcion_multiple' && pregunta.opciones && (
                        <div className="space-y-2">
                          {pregunta.opciones.map((opcion, opIdx) => (
                            <div key={opIdx} className="flex items-center gap-2">
                              <input
                                type="radio"
                                name={`correcta-${pregunta.id}`}
                                checked={pregunta.respuesta_correcta === opIdx}
                                onChange={() => updatePregunta(index, { respuesta_correcta: opIdx })}
                              />
                              <Input
                                value={opcion}
                                onChange={(e) => {
                                  const newOpciones = [...pregunta.opciones!];
                                  newOpciones[opIdx] = e.target.value;
                                  updatePregunta(index, { opciones: newOpciones });
                                }}
                                placeholder={`Opción ${opIdx + 1}`}
                                className="flex-1"
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      {pregunta.tipo === 'verdadero_falso' && (
                        <Select 
                          value={String(pregunta.respuesta_correcta)}
                          onValueChange={(v) => updatePregunta(index, { respuesta_correcta: parseInt(v) })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Respuesta correcta" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">Verdadero</SelectItem>
                            <SelectItem value="1">Falso</SelectItem>
                          </SelectContent>
                        </Select>
                      )}

                      {pregunta.tipo === 'respuesta_corta' && (
                        <Input
                          value={String(pregunta.respuesta_correcta)}
                          onChange={(e) => updatePregunta(index, { respuesta_correcta: e.target.value })}
                          placeholder="Respuesta correcta esperada"
                        />
                      )}

                      <div className="flex items-center gap-2">
                        <Label className="text-sm">Puntos:</Label>
                        <Input
                          type="number"
                          min={1}
                          value={pregunta.puntos}
                          onChange={(e) => updatePregunta(index, { puntos: parseInt(e.target.value) || 10 })}
                          className="w-20"
                        />
                      </div>
                    </div>
                  ))}

                  <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                    <div className="space-y-2">
                      <Label>Puntaje para aprobar (%)</Label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={quizConfig.puntuacion_minima}
                        onChange={(e) => setQuizConfig({ ...quizConfig, puntuacion_minima: parseInt(e.target.value) || 70 })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Intentos máximos</Label>
                      <Input
                        type="number"
                        min={1}
                        value={quizConfig.intentos_permitidos}
                        onChange={(e) => setQuizConfig({ ...quizConfig, intentos_permitidos: parseInt(e.target.value) || 3 })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tiempo límite (min)</Label>
                      <Input
                        type="number"
                        min={0}
                        value={quizConfig.tiempo_limite_min || ""}
                        onChange={(e) => setQuizConfig({ ...quizConfig, tiempo_limite_min: e.target.value ? parseInt(e.target.value) : null })}
                        placeholder="Sin límite"
                      />
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="config" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duracion">Duración estimada (minutos)</Label>
                  <Input
                    id="duracion"
                    type="number"
                    min={1}
                    value={duracion}
                    onChange={(e) => setDuracion(parseInt(e.target.value) || 10)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="orden">Orden</Label>
                  <Input
                    id="orden"
                    type="number"
                    min={1}
                    value={orden}
                    onChange={(e) => setOrden(parseInt(e.target.value) || 1)}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="obligatorio">Contenido Obligatorio</Label>
                <Switch
                  id="obligatorio"
                  checked={esObligatorio}
                  onCheckedChange={setEsObligatorio}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="activo">Contenido Activo</Label>
                <Switch
                  id="activo"
                  checked={activo}
                  onCheckedChange={setActivo}
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4 border-t">
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
