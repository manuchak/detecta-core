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

interface ContenidoFormData {
  titulo: string;
  tipo_contenido: string;
  contenido_texto: string | null;
  contenido_url: string | null;
  contenido_video_url: string | null;
  duracion_estimada_minutos: number;
  orden: number;
  activo: boolean;
  es_quiz: boolean;
  quiz_config: {
    preguntas: QuizPregunta[];
    puntaje_aprobacion: number;
    intentos_maximos: number;
    tiempo_limite_minutos: number | null;
  } | null;
}

interface QuizPregunta {
  id: string;
  pregunta: string;
  tipo: 'opcion_multiple' | 'verdadero_falso' | 'respuesta_corta';
  opciones?: string[];
  respuesta_correcta: string | number;
  puntos: number;
}

interface LMSContenidoFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  moduloId: string;
  contenido?: {
    id: string;
    titulo: string;
    tipo_contenido: string;
    contenido_texto: string | null;
    contenido_url: string | null;
    contenido_video_url: string | null;
    duracion_estimada_minutos: number;
    orden: number;
    activo: boolean;
    es_quiz: boolean;
    quiz_config: any;
  } | null;
  nextOrden: number;
  onSubmit: (data: ContenidoFormData) => Promise<void>;
  isLoading?: boolean;
}

const TIPOS_CONTENIDO = [
  { value: 'video', label: 'Video' },
  { value: 'texto', label: 'Texto/Artículo' },
  { value: 'documento', label: 'Documento (PDF)' },
  { value: 'presentacion', label: 'Presentación' },
  { value: 'quiz', label: 'Quiz/Evaluación' },
  { value: 'interactivo', label: 'Interactivo' },
];

export function LMSContenidoForm({
  open,
  onOpenChange,
  moduloId,
  contenido,
  nextOrden,
  onSubmit,
  isLoading = false
}: LMSContenidoFormProps) {
  const [formData, setFormData] = useState<ContenidoFormData>({
    titulo: "",
    tipo_contenido: "texto",
    contenido_texto: "",
    contenido_url: null,
    contenido_video_url: null,
    duracion_estimada_minutos: 10,
    orden: nextOrden,
    activo: true,
    es_quiz: false,
    quiz_config: null
  });

  const [quizPreguntas, setQuizPreguntas] = useState<QuizPregunta[]>([]);
  const [quizConfig, setQuizConfig] = useState({
    puntaje_aprobacion: 70,
    intentos_maximos: 3,
    tiempo_limite_minutos: null as number | null
  });

  useEffect(() => {
    if (contenido) {
      setFormData({
        titulo: contenido.titulo,
        tipo_contenido: contenido.tipo_contenido,
        contenido_texto: contenido.contenido_texto,
        contenido_url: contenido.contenido_url,
        contenido_video_url: contenido.contenido_video_url,
        duracion_estimada_minutos: contenido.duracion_estimada_minutos,
        orden: contenido.orden,
        activo: contenido.activo,
        es_quiz: contenido.es_quiz,
        quiz_config: contenido.quiz_config
      });
      if (contenido.quiz_config) {
        setQuizPreguntas(contenido.quiz_config.preguntas || []);
        setQuizConfig({
          puntaje_aprobacion: contenido.quiz_config.puntaje_aprobacion || 70,
          intentos_maximos: contenido.quiz_config.intentos_maximos || 3,
          tiempo_limite_minutos: contenido.quiz_config.tiempo_limite_minutos || null
        });
      }
    } else {
      setFormData({
        titulo: "",
        tipo_contenido: "texto",
        contenido_texto: "",
        contenido_url: null,
        contenido_video_url: null,
        duracion_estimada_minutos: 10,
        orden: nextOrden,
        activo: true,
        es_quiz: false,
        quiz_config: null
      });
      setQuizPreguntas([]);
      setQuizConfig({
        puntaje_aprobacion: 70,
        intentos_maximos: 3,
        tiempo_limite_minutos: null
      });
    }
  }, [contenido, nextOrden, open]);

  const handleTipoChange = (tipo: string) => {
    const esQuiz = tipo === 'quiz';
    setFormData({ 
      ...formData, 
      tipo_contenido: tipo,
      es_quiz: esQuiz 
    });
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
      ...formData,
      quiz_config: formData.es_quiz ? {
        preguntas: quizPreguntas,
        ...quizConfig
      } : null
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
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                placeholder="Título del contenido"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de Contenido</Label>
              <Select value={formData.tipo_contenido} onValueChange={handleTipoChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_CONTENIDO.map(tipo => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
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
              {formData.tipo_contenido === 'video' && (
                <div className="space-y-2">
                  <Label htmlFor="video_url">URL del Video</Label>
                  <Input
                    id="video_url"
                    value={formData.contenido_video_url || ""}
                    onChange={(e) => setFormData({ ...formData, contenido_video_url: e.target.value })}
                    placeholder="https://youtube.com/watch?v=..."
                  />
                  <p className="text-xs text-muted-foreground">
                    Soporta YouTube, Vimeo y enlaces directos
                  </p>
                </div>
              )}

              {(formData.tipo_contenido === 'documento' || formData.tipo_contenido === 'presentacion') && (
                <div className="space-y-2">
                  <Label htmlFor="doc_url">URL del Documento</Label>
                  <Input
                    id="doc_url"
                    value={formData.contenido_url || ""}
                    onChange={(e) => setFormData({ ...formData, contenido_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              )}

              {formData.tipo_contenido === 'texto' && (
                <div className="space-y-2">
                  <Label htmlFor="texto">Contenido de Texto</Label>
                  <Textarea
                    id="texto"
                    value={formData.contenido_texto || ""}
                    onChange={(e) => setFormData({ ...formData, contenido_texto: e.target.value })}
                    placeholder="Escribe el contenido aquí... (soporta Markdown)"
                    rows={10}
                  />
                </div>
              )}

              {formData.tipo_contenido === 'quiz' && (
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
                        value={quizConfig.puntaje_aprobacion}
                        onChange={(e) => setQuizConfig({ ...quizConfig, puntaje_aprobacion: parseInt(e.target.value) || 70 })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Intentos máximos</Label>
                      <Input
                        type="number"
                        min={1}
                        value={quizConfig.intentos_maximos}
                        onChange={(e) => setQuizConfig({ ...quizConfig, intentos_maximos: parseInt(e.target.value) || 3 })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tiempo límite (min)</Label>
                      <Input
                        type="number"
                        min={0}
                        value={quizConfig.tiempo_limite_minutos || ""}
                        onChange={(e) => setQuizConfig({ ...quizConfig, tiempo_limite_minutos: e.target.value ? parseInt(e.target.value) : null })}
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
                    value={formData.duracion_estimada_minutos}
                    onChange={(e) => setFormData({ ...formData, duracion_estimada_minutos: parseInt(e.target.value) || 10 })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="orden">Orden</Label>
                  <Input
                    id="orden"
                    type="number"
                    min={1}
                    value={formData.orden}
                    onChange={(e) => setFormData({ ...formData, orden: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="activo">Contenido Activo</Label>
                <Switch
                  id="activo"
                  checked={formData.activo}
                  onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !formData.titulo.trim()}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEditing ? "Guardar Cambios" : "Crear Contenido"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
