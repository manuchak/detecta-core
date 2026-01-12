import { useState, useRef, useEffect, useCallback } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize, RotateCcw, CheckCircle, Lock, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { VideoContent } from "@/types/lms";

interface VideoPlayerProps {
  content: VideoContent;
  onProgress?: (posicion: number, porcentaje: number) => void;
  onComplete?: () => void;
  initialPosition?: number;
  initialMaxViewed?: number;
  initialWatchTime?: number; // Para embeds: tiempo de visualización acumulado
  completionThreshold?: number;
  duracionMinutos?: number; // Para embeds: duración mínima requerida
}

// Proveedores que usan iframe para embed
const EMBED_PROVIDERS = ['youtube', 'vimeo', 'tiktok', 'instagram', 'facebook', 'canva'];

// Proveedores con formato vertical (9:16)
const VERTICAL_PROVIDERS = ['tiktok', 'instagram'];

export function VideoPlayer({ 
  content, 
  onProgress, 
  onComplete,
  initialPosition = 0,
  initialMaxViewed = 0,
  initialWatchTime = 0,
  completionThreshold = 95,
  duracionMinutos = 3
}: VideoPlayerProps) {
  // Tiempo requerido para embeds (en segundos) - calculado temprano para inicialización
  const requiredWatchTime = (content.duracion_segundos || duracionMinutos * 60);
  
  // Estados para video nativo
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [hasCompleted, setHasCompleted] = useState(false);
  
  // Estados para anti-skip
  const [maxViewedTime, setMaxViewedTime] = useState(initialMaxViewed);
  
  // Estados para embeds (timer basado) - inicializar con progreso guardado
  const [watchTime, setWatchTime] = useState(initialWatchTime);
  const [isVisible, setIsVisible] = useState(true);
  const [embedCanComplete, setEmbedCanComplete] = useState(initialWatchTime >= requiredWatchTime);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  const isEmbedProvider = EMBED_PROVIDERS.includes(content.provider);
  const isVertical = VERTICAL_PROVIDERS.includes(content.provider);
  

  // Calcular porcentaje real visto para videos nativos
  const viewedPercentage = duration > 0 ? (maxViewedTime / duration) * 100 : 0;
  const canComplete = viewedPercentage >= completionThreshold;

  // Extraer video ID/URL para embeds
  const getEmbedUrl = (): string | null => {
    const url = content.url;
    
    switch (content.provider) {
      case 'youtube': {
        const patterns = [
          /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
          /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
          /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
          /youtu\.be\/([a-zA-Z0-9_-]{11})/,
        ];
        for (const pattern of patterns) {
          const match = url.match(pattern);
          if (match) return `https://www.youtube.com/embed/${match[1]}?rel=0`;
        }
        const fallbackId = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)?.[1];
        return fallbackId ? `https://www.youtube.com/embed/${fallbackId}?rel=0` : null;
      }
      
      case 'vimeo': {
        const videoId = url.match(/vimeo\.com\/(\d+)/)?.[1];
        return videoId ? `https://player.vimeo.com/video/${videoId}` : null;
      }
      
      case 'tiktok': {
        const videoId = url.match(/tiktok\.com\/@[\w.-]+\/video\/(\d+)/)?.[1];
        return videoId ? `https://www.tiktok.com/embed/v2/${videoId}` : null;
      }
      
      case 'instagram': {
        const code = url.match(/instagram\.com\/(?:reel|p)\/([A-Za-z0-9_-]+)/)?.[1];
        return code ? `https://www.instagram.com/p/${code}/embed` : null;
      }
      
      case 'facebook': {
        return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false`;
      }
      
      case 'canva': {
        if (url.includes('/view')) {
          return url.replace('/view', '/embed');
        }
        return url;
      }
      
      default:
        return null;
    }
  };

  // Manejador para videos nativos
  useEffect(() => {
    if (isEmbedProvider) return;
    
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      if (initialPosition > 0 && initialPosition <= initialMaxViewed) {
        video.currentTime = initialPosition;
      }
    };

    const handleTimeUpdate = () => {
      const time = video.currentTime;
      setCurrentTime(time);
      
      // Solo incrementar maxViewedTime si avanza normalmente
      if (time > maxViewedTime) {
        setMaxViewedTime(time);
      }
      
      const porcentajeReal = duration > 0 ? (Math.max(time, maxViewedTime) / duration) * 100 : 0;
      onProgress?.(time, porcentajeReal);

      // Marcar como completado si alcanza el umbral
      if (!hasCompleted && porcentajeReal >= completionThreshold) {
        setHasCompleted(true);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setMaxViewedTime(video.duration);
      if (!hasCompleted) {
        setHasCompleted(true);
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
  }, [isEmbedProvider, onProgress, initialPosition, completionThreshold, hasCompleted, maxViewedTime, duration, initialMaxViewed]);

  // Timer para embeds - corre mientras el iframe está visible
  useEffect(() => {
    if (!isEmbedProvider || !isVisible || embedCanComplete) return;
    
    const interval = setInterval(() => {
      setWatchTime(prev => {
        const newTime = prev + 1;
        const percentage = (newTime / requiredWatchTime) * 100;
        onProgress?.(newTime, Math.min(percentage, 100));
        
        if (newTime >= requiredWatchTime && !embedCanComplete) {
          setEmbedCanComplete(true);
        }
        
        return newTime;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isEmbedProvider, isVisible, embedCanComplete, requiredWatchTime, onProgress]);

  // Detectar visibilidad del iframe usando IntersectionObserver
  useEffect(() => {
    if (!isEmbedProvider || !iframeRef.current) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.5 }
    );
    
    observer.observe(iframeRef.current);
    
    return () => observer.disconnect();
  }, [isEmbedProvider]);

  // Detectar cambio de pestaña para pausar timer
  useEffect(() => {
    if (!isEmbedProvider) return;
    
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isEmbedProvider]);

  // Manejar completar para embeds
  const handleEmbedComplete = useCallback(() => {
    if (!embedCanComplete) {
      toast.error("Debes ver el video completo antes de continuar");
      return;
    }
    setHasCompleted(true);
    onComplete?.();
  }, [embedCanComplete, onComplete]);

  // Manejar completar para videos nativos
  const handleNativeComplete = useCallback(() => {
    if (!canComplete) {
      toast.error("Debes ver al menos el 95% del video para continuar");
      return;
    }
    setHasCompleted(true);
    onComplete?.();
  }, [canComplete, onComplete]);

  // Formatear tiempo
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Para embeds: renderizar con timer de progreso
  if (isEmbedProvider) {
    const embedUrl = getEmbedUrl();
    if (!embedUrl) {
      return (
        <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
          <p className="text-muted-foreground">URL de video inválida</p>
        </div>
      );
    }

    const embedProgress = Math.min((watchTime / requiredWatchTime) * 100, 100);

    return (
      <div className="space-y-4">
        <div 
          ref={iframeRef}
          className={cn(
            "bg-black rounded-lg overflow-hidden",
            isVertical ? "aspect-[9/16] max-w-sm mx-auto" : "aspect-video"
          )}
        >
          <iframe
            src={embedUrl}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        {/* Barra de progreso de visualización */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                Tiempo de visualización: {formatTime(watchTime)} / {formatTime(requiredWatchTime)}
              </span>
            </div>
            {embedCanComplete ? (
              <span className="flex items-center gap-1 text-green-600 font-medium">
                <CheckCircle className="h-4 w-4" />
                Listo para completar
              </span>
            ) : (
              <span className="flex items-center gap-1 text-muted-foreground">
                <Lock className="h-4 w-4" />
                {Math.ceil((requiredWatchTime - watchTime) / 60)} min restantes
              </span>
            )}
          </div>
          
          <Progress value={embedProgress} className="h-2" />
          
          {!isVisible && !embedCanComplete && (
            <p className="text-sm text-amber-600 flex items-center gap-1">
              ⏸️ Timer pausado - regresa a esta pestaña para continuar
            </p>
          )}
        </div>

        {/* Botón de completar */}
        <Button
          onClick={handleEmbedComplete}
          disabled={!embedCanComplete || hasCompleted}
          className="w-full"
          variant={hasCompleted ? "outline" : "default"}
        >
          {hasCompleted ? (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Video completado
            </>
          ) : embedCanComplete ? (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Marcar como completado
            </>
          ) : (
            <>
              <Lock className="h-4 w-4 mr-2" />
              Ve el video completo para continuar
            </>
          )}
        </Button>
      </div>
    );
  }

  // Para videos nativos: player con anti-skip
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
    
    const targetTime = value[0];
    // Solo permitir ir hasta donde ya vio + 2 segundos de tolerancia
    const maxAllowed = maxViewedTime + 2;
    
    if (targetTime > maxAllowed) {
      // Mostrar feedback visual
      toast.info("No puedes adelantar el video", {
        description: "Debes ver el contenido en orden"
      });
      video.currentTime = maxAllowed;
      setCurrentTime(maxAllowed);
    } else {
      video.currentTime = targetTime;
      setCurrentTime(targetTime);
    }
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
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  return (
    <div className="space-y-4">
      <div 
        ref={containerRef}
        className="relative aspect-video bg-black rounded-lg overflow-hidden group"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => isPlaying && setShowControls(false)}
      >
        <video
          ref={videoRef}
          src={content.url}
          className="w-full h-full"
          onClick={togglePlay}
          poster={content.thumbnail_url}
        />

        {/* Overlay de play */}
        {!isPlaying && (
          <div 
            className="absolute inset-0 flex items-center justify-center bg-black/20 cursor-pointer"
            onClick={togglePlay}
          >
            <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
              <Play className="h-8 w-8 text-primary ml-1" />
            </div>
          </div>
        )}

        {/* Controles */}
        <div className={cn(
          "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300",
          showControls ? "opacity-100" : "opacity-0"
        )}>
          {/* Barra de progreso con indicador de máximo visto */}
          <div className="relative mb-3">
            {/* Barra de fondo mostrando máximo visto */}
            <div className="absolute inset-0 h-2 rounded-full bg-white/20">
              <div 
                className="h-full rounded-full bg-green-500/50 transition-all"
                style={{ width: `${(maxViewedTime / (duration || 1)) * 100}%` }}
              />
            </div>
            {/* Slider encima */}
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={0.1}
              onValueChange={handleSeek}
              className="relative z-10"
            />
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

      {/* Indicador de progreso y estado */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              Progreso: {Math.round(viewedPercentage)}% visto
            </span>
          </div>
          {canComplete ? (
            <span className="flex items-center gap-1 text-green-600 font-medium">
              <CheckCircle className="h-4 w-4" />
              Listo para completar
            </span>
          ) : (
            <span className="flex items-center gap-1 text-muted-foreground">
              <Lock className="h-4 w-4" />
              Mínimo {completionThreshold}% requerido
            </span>
          )}
        </div>
        
        <Progress value={viewedPercentage} className="h-2" />
      </div>

      {/* Botón de completar */}
      <Button
        onClick={handleNativeComplete}
        disabled={!canComplete || hasCompleted}
        className="w-full"
        variant={hasCompleted ? "outline" : "default"}
      >
        {hasCompleted ? (
          <>
            <CheckCircle className="h-4 w-4 mr-2" />
            Video completado
          </>
        ) : canComplete ? (
          <>
            <CheckCircle className="h-4 w-4 mr-2" />
            Marcar como completado
          </>
        ) : (
          <>
            <Lock className="h-4 w-4 mr-2" />
            Ve el video completo para continuar
          </>
        )}
      </Button>
    </div>
  );
}
