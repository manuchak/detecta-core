import { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import type { VideoContent } from "@/types/lms";

interface VideoPlayerProps {
  content: VideoContent;
  onProgress?: (posicion: number, porcentaje: number) => void;
  onComplete?: () => void;
  initialPosition?: number;
  completionThreshold?: number; // porcentaje para marcar como completado (default 90)
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
  completionThreshold = 90
}: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [hasCompleted, setHasCompleted] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  const isEmbedProvider = EMBED_PROVIDERS.includes(content.provider);
  const isVertical = VERTICAL_PROVIDERS.includes(content.provider);

  // Extraer video ID/URL para embeds
  const getEmbedUrl = (): string | null => {
    const url = content.url;
    
    switch (content.provider) {
      case 'youtube': {
        // Soporta: watch, shorts, embed, youtu.be
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
        // Fallback para otros formatos de YouTube
        const fallbackId = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)?.[1];
        return fallbackId ? `https://www.youtube.com/embed/${fallbackId}?rel=0` : null;
      }
      
      case 'vimeo': {
        const videoId = url.match(/vimeo\.com\/(\d+)/)?.[1];
        return videoId ? `https://player.vimeo.com/video/${videoId}` : null;
      }
      
      case 'tiktok': {
        // Formato: tiktok.com/@user/video/VIDEO_ID
        const videoId = url.match(/tiktok\.com\/@[\w.-]+\/video\/(\d+)/)?.[1];
        return videoId ? `https://www.tiktok.com/embed/v2/${videoId}` : null;
      }
      
      case 'instagram': {
        // Formato: instagram.com/reel/CODE/ o instagram.com/p/CODE/
        const code = url.match(/instagram\.com\/(?:reel|p)\/([A-Za-z0-9_-]+)/)?.[1];
        return code ? `https://www.instagram.com/p/${code}/embed` : null;
      }
      
      case 'facebook': {
        // Encode la URL completa para el plugin de Facebook
        return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false`;
      }
      
      case 'canva': {
        // Formato: canva.com/design/DESIGN_ID/view -> embed
        if (url.includes('/view')) {
          return url.replace('/view', '/embed');
        }
        return url;
      }
      
      default:
        return null;
    }
  };

  // Hook SIEMPRE se ejecuta - guardas internas para embeds
  useEffect(() => {
    if (isEmbedProvider) return; // Skip for embeds
    
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      if (initialPosition > 0) {
        video.currentTime = initialPosition;
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      const porcentaje = (video.currentTime / video.duration) * 100;
      onProgress?.(video.currentTime, porcentaje);

      // Marcar como completado si alcanza el umbral
      if (!hasCompleted && porcentaje >= completionThreshold) {
        setHasCompleted(true);
        onComplete?.();
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      if (!hasCompleted) {
        setHasCompleted(true);
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
  }, [isEmbedProvider, onProgress, onComplete, initialPosition, completionThreshold, hasCompleted]);

  // Para YouTube/Vimeo, usar iframe
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
      <div className={cn(
        "bg-black rounded-lg overflow-hidden",
        isVertical ? "aspect-[9/16] max-w-sm mx-auto" : "aspect-video"
      )}>
        <iframe
          src={embedUrl}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

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
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  return (
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
        {/* Barra de progreso */}
        <Slider
          value={[currentTime]}
          max={duration || 100}
          step={0.1}
          onValueChange={handleSeek}
          className="mb-3"
        />

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
  );
}
