import { useState, useRef, useEffect, useCallback } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize, RotateCcw, CheckCircle2, XCircle, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import type { VideoInteractivoData } from "@/types/lms";

interface InteractiveVideoPlayerProps {
  data: VideoInteractivoData;
  onComplete?: () => void;
}

interface QuestionResult {
  preguntaId: string;
  esCorrecta: boolean;
  respondida: boolean;
}

export function InteractiveVideoPlayer({ data, onComplete }: InteractiveVideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  
  // Question overlay state
  const [activePregunta, setActivePregunta] = useState<VideoInteractivoData['preguntas'][0] | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [questionResults, setQuestionResults] = useState<QuestionResult[]>([]);
  const [showResumen, setShowResumen] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();
  const triggeredQuestions = useRef<Set<string>>(new Set());

  const preguntas = data?.preguntas || [];
  const isEmbedProvider = data?.provider === 'youtube' || data?.provider === 'vimeo';

  // Get embed URL for YouTube/Vimeo
  const getEmbedUrl = useCallback(() => {
    if (data.provider === 'youtube') {
      const videoId = data.video_url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)?.[1];
      return videoId ? `https://www.youtube.com/embed/${videoId}?enablejsapi=1&rel=0` : null;
    }
    if (data.provider === 'vimeo') {
      const videoId = data.video_url.match(/vimeo\.com\/(\d+)/)?.[1];
      return videoId ? `https://player.vimeo.com/video/${videoId}` : null;
    }
    return null;
  }, [data.provider, data.video_url]);

  // Check for questions at current time
  useEffect(() => {
    if (isEmbedProvider || activePregunta) return;

    preguntas.forEach(pregunta => {
      const wasTriggered = triggeredQuestions.current.has(pregunta.id);
      const isAtTime = Math.abs(currentTime - pregunta.tiempo_seg) < 0.5;
      
      if (isAtTime && !wasTriggered) {
        triggeredQuestions.current.add(pregunta.id);
        setActivePregunta(pregunta);
        setSelectedOption(null);
        setShowFeedback(false);
        
        // Pause video
        const video = videoRef.current;
        if (video && isPlaying) {
          video.pause();
          setIsPlaying(false);
        }
      }
    });
  }, [currentTime, preguntas, activePregunta, isPlaying, isEmbedProvider]);

  // Video event handlers
  useEffect(() => {
    if (isEmbedProvider) return;
    
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => setDuration(video.duration);
    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleEnded = () => {
      setIsPlaying(false);
      if (data.resumen_final && preguntas.length > 0) {
        setShowResumen(true);
      } else {
        onComplete?.();
      }
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
    };
  }, [isEmbedProvider, data.resumen_final, preguntas.length, onComplete]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (value: number[]) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = value[0];
    setCurrentTime(value[0]);
  };

  const handleVolumeChange = (value: number[]) => {
    const video = videoRef.current;
    if (!video) return;
    const newVolume = value[0];
    video.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      container.requestFullscreen();
    }
  };

  const restart = () => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    setCurrentTime(0);
    triggeredQuestions.current.clear();
    setQuestionResults([]);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying && !activePregunta) setShowControls(false);
    }, 3000);
  };

  const handleAnswerSubmit = () => {
    if (!activePregunta || !selectedOption) return;

    const correctOption = activePregunta.opciones.find(o => o.es_correcta);
    const isCorrect = correctOption?.texto === selectedOption;

    setQuestionResults(prev => [
      ...prev.filter(r => r.preguntaId !== activePregunta.id),
      { preguntaId: activePregunta.id, esCorrecta: isCorrect, respondida: true }
    ]);

    setShowFeedback(true);
  };

  const handleContinueVideo = () => {
    setActivePregunta(null);
    setSelectedOption(null);
    setShowFeedback(false);
    
    const video = videoRef.current;
    if (video) {
      video.play();
      setIsPlaying(true);
    }
  };

  const handleSkipQuestion = () => {
    if (!data.permitir_saltar) return;
    handleContinueVideo();
  };

  const handleFinishResumen = () => {
    setShowResumen(false);
    onComplete?.();
  };

  // Calculate question markers for timeline
  const getQuestionMarkers = () => {
    if (!duration) return [];
    return preguntas.map(p => ({
      id: p.id,
      position: (p.tiempo_seg / duration) * 100,
      answered: questionResults.some(r => r.preguntaId === p.id),
      correct: questionResults.find(r => r.preguntaId === p.id)?.esCorrecta
    }));
  };

  // For YouTube/Vimeo, show embed with note about limitations
  if (isEmbedProvider) {
    const embedUrl = getEmbedUrl();
    if (!embedUrl) {
      return (
        <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
          <p className="text-muted-foreground">URL de video inválida</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="aspect-video bg-black rounded-lg overflow-hidden">
          <iframe
            src={embedUrl}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        {preguntas.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
            <p>
              <strong>Nota:</strong> Las preguntas interactivas funcionan mejor con videos alojados directamente. 
              Para YouTube/Vimeo, las preguntas aparecerán después del video.
            </p>
          </div>
        )}
      </div>
    );
  }

  const correctCount = questionResults.filter(r => r.esCorrecta).length;
  const totalAnswered = questionResults.length;

  return (
    <div 
      ref={containerRef}
      className="relative aspect-video bg-black rounded-lg overflow-hidden group"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && !activePregunta && setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={data.video_url}
        className="w-full h-full"
        onClick={!activePregunta ? togglePlay : undefined}
      />

      {/* Play overlay when paused (not during question) */}
      {!isPlaying && !activePregunta && !showResumen && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-black/20 cursor-pointer"
          onClick={togglePlay}
        >
          <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
            <Play className="h-8 w-8 text-primary ml-1" />
          </div>
        </div>
      )}

      {/* Question Overlay */}
      {activePregunta && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-lg font-semibold">{activePregunta.pregunta}</h3>
            
            <div className="space-y-2">
              {activePregunta.opciones.map((opcion, idx) => {
                const isSelected = selectedOption === opcion.texto;
                const isCorrect = opcion.es_correcta;
                
                return (
                  <button
                    key={idx}
                    onClick={() => !showFeedback && setSelectedOption(opcion.texto)}
                    disabled={showFeedback}
                    className={cn(
                      "w-full text-left p-3 rounded-lg border-2 transition-all",
                      !showFeedback && isSelected && "border-primary bg-primary/10",
                      !showFeedback && !isSelected && "border-muted hover:border-primary/50",
                      showFeedback && isCorrect && "border-green-500 bg-green-50",
                      showFeedback && isSelected && !isCorrect && "border-red-500 bg-red-50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {showFeedback && isCorrect && (
                        <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                      )}
                      {showFeedback && isSelected && !isCorrect && (
                        <XCircle className="h-5 w-5 text-red-600 shrink-0" />
                      )}
                      <span>{opcion.texto}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {showFeedback && activePregunta.explicacion && (
              <div className="bg-muted p-3 rounded-lg text-sm">
                <p className="font-medium mb-1">Explicación:</p>
                <p>{activePregunta.explicacion}</p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              {!showFeedback && data.permitir_saltar && (
                <Button variant="ghost" onClick={handleSkipQuestion}>
                  Saltar
                </Button>
              )}
              {!showFeedback && (
                <Button 
                  onClick={handleAnswerSubmit}
                  disabled={!selectedOption}
                >
                  Confirmar
                </Button>
              )}
              {showFeedback && (
                <Button onClick={handleContinueVideo}>
                  Continuar <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Summary overlay */}
      {showResumen && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl shadow-2xl max-w-md w-full p-6 text-center space-y-4">
            <h3 className="text-xl font-bold">¡Video completado!</h3>
            
            <div className="py-4">
              <div className="text-4xl font-bold text-primary">
                {correctCount} / {preguntas.length}
              </div>
              <p className="text-muted-foreground mt-1">respuestas correctas</p>
            </div>

            <div className="flex justify-center gap-2">
              {questionResults.map((result, idx) => (
                <div 
                  key={idx}
                  className={cn(
                    "w-3 h-3 rounded-full",
                    result.esCorrecta ? "bg-green-500" : "bg-red-500"
                  )}
                />
              ))}
            </div>

            <Button onClick={handleFinishResumen} className="mt-4">
              Finalizar
            </Button>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className={cn(
        "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300",
        (showControls && !activePregunta && !showResumen) ? "opacity-100" : "opacity-0 pointer-events-none"
      )}>
        {/* Progress bar with question markers */}
        <div className="relative mb-3">
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={0.1}
            onValueChange={handleSeek}
          />
          {/* Question markers */}
          {getQuestionMarkers().map(marker => (
            <div 
              key={marker.id}
              className={cn(
                "absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full pointer-events-none",
                marker.answered 
                  ? marker.correct ? "bg-green-500" : "bg-red-500"
                  : "bg-yellow-400"
              )}
              style={{ left: `${marker.position}%` }}
            />
          ))}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-white/20"
              onClick={togglePlay}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-white/20"
              onClick={restart}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/20"
                onClick={toggleMute}
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
              <Slider
                value={[isMuted ? 0 : volume]}
                max={1}
                step={0.1}
                onValueChange={handleVolumeChange}
                className="w-20"
              />
            </div>

            <span className="text-white text-sm ml-2">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {totalAnswered > 0 && (
              <span className="text-white text-sm">
                {correctCount}/{totalAnswered} ✓
              </span>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-white/20"
              onClick={toggleFullscreen}
            >
              <Maximize className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
