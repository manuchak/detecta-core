import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useCSVoC, VoCTheme, VoCWordCloud, VoCVerbatim, VoCRecommendation } from '@/hooks/useCSVoC';
import { RefreshCw, Brain, Thermometer, MessageCircle, Lightbulb, CloudFog, Sparkles, AlertTriangle } from 'lucide-react';
import { useMemo } from 'react';

// ──────── Sentiment Gauge (SVG semicircle) ────────
function SentimentGauge({ score }: { score: number }) {
  const clampedScore = Math.max(0, Math.min(100, score));
  const angle = (clampedScore / 100) * 180;
  const rad = (angle * Math.PI) / 180;

  // Arc endpoint
  const cx = 100, cy = 95, r = 75;
  const x = cx - r * Math.cos(rad);
  const y = cy - r * Math.sin(rad);

  const color =
    clampedScore <= 33 ? 'hsl(0 84% 60%)' :
    clampedScore <= 66 ? 'hsl(45 93% 47%)' :
    'hsl(142 71% 45%)';

  const label =
    clampedScore <= 33 ? 'Frío' :
    clampedScore <= 66 ? 'Tibio' : 'Cálido';

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 110" className="w-full max-w-[180px]">
        {/* Background arc */}
        <path
          d="M 25 95 A 75 75 0 0 1 175 95"
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth="12"
          strokeLinecap="round"
        />
        {/* Colored arc */}
        {clampedScore > 0 && (
          <path
            d={`M 25 95 A 75 75 0 ${angle > 180 ? 1 : 0} 1 ${x} ${y}`}
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeLinecap="round"
          />
        )}
        <text x="100" y="85" textAnchor="middle" className="fill-foreground text-2xl font-bold" fontSize="28">
          {clampedScore}
        </text>
        <text x="100" y="105" textAnchor="middle" className="fill-muted-foreground" fontSize="12">
          {label}
        </text>
      </svg>
    </div>
  );
}

// ──────── Theme Bubbles ────────
function ThemeBubbles({ themes }: { themes: VoCTheme[] }) {
  const maxCount = Math.max(...themes.map(t => t.count), 1);

  const sentimentColor = (s: string) =>
    s === 'positivo' ? 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700' :
    s === 'negativo' ? 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700' :
    'bg-muted text-muted-foreground border-border';

  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {themes.map((theme) => {
        const scale = 0.7 + (theme.count / maxCount) * 0.6;
        return (
          <TooltipProvider key={theme.name}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 cursor-default transition-transform hover:scale-105 ${sentimentColor(theme.sentiment)}`}
                  style={{ transform: `scale(${scale})` }}
                >
                  <span className="font-medium text-sm">{theme.name}</span>
                  <span className="text-xs opacity-70">({theme.count})</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-medium">{theme.name}</p>
                <p className="text-xs">Menciones: {theme.count} · Sentimiento: {theme.sentiment}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Keywords: {theme.keywords.join(', ')}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      })}
    </div>
  );
}

// ──────── Word Cloud ────────
function WordCloud({ words }: { words: VoCWordCloud[] }) {
  const sorted = useMemo(() => [...words].sort((a, b) => b.frequency - a.frequency), [words]);
  const maxFreq = sorted[0]?.frequency || 1;

  const rotations = useMemo(
    () => sorted.map(() => (Math.random() > 0.7 ? (Math.random() > 0.5 ? -8 : 8) : 0)),
    [sorted]
  );

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 py-2">
      {sorted.map((w, i) => {
        const fontSize = 12 + (w.frequency / maxFreq) * 36;
        const color =
          w.sentiment === 'positivo' ? 'text-green-600 dark:text-green-400' :
          w.sentiment === 'negativo' ? 'text-red-600 dark:text-red-400' :
          'text-muted-foreground';

        return (
          <TooltipProvider key={w.word}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className={`cursor-default transition-opacity hover:opacity-70 font-medium ${color}`}
                  style={{
                    fontSize: `${fontSize}px`,
                    transform: `rotate(${rotations[i]}deg)`,
                    display: 'inline-block',
                  }}
                >
                  {w.word}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>{w.word} — Frecuencia: {w.frequency}</p>
                <p className="text-xs text-muted-foreground">Sentimiento: {w.sentiment}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      })}
    </div>
  );
}

// ──────── Verbatim Feed ────────
const SOURCE_BADGE: Record<string, string> = {
  Queja: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  CSAT: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  NPS: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  Touchpoint: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
};

const SENTIMENT_BADGE: Record<string, string> = {
  positivo: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  negativo: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  neutro: 'bg-muted text-muted-foreground',
};

function VerbatimFeed({ verbatims }: { verbatims: VoCVerbatim[] }) {
  return (
    <ScrollArea className="h-[260px] pr-3">
      <div className="space-y-3">
        {verbatims.map((v, i) => (
          <div key={i} className="border rounded-lg p-3 space-y-2">
            <p className="text-sm italic leading-relaxed">"{v.text}"</p>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${SOURCE_BADGE[v.source] || ''}`}>
                {v.source}
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${SENTIMENT_BADGE[v.sentiment] || ''}`}>
                {v.sentiment}
              </span>
              <span className="text-xs text-muted-foreground ml-auto">{v.cliente}</span>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

// ──────── Recommendations ────────
const PRIORITY_STYLES: Record<string, string> = {
  alta: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  media: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  baja: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
};

function RecommendationsList({ recommendations }: { recommendations: VoCRecommendation[] }) {
  return (
    <ScrollArea className="h-[260px] pr-3">
      <div className="space-y-3">
        {recommendations.map((r, i) => (
          <div key={i} className="border rounded-lg p-3 space-y-1.5">
            <div className="flex items-start gap-2">
              <Lightbulb className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
              <p className="text-sm font-medium leading-snug">{r.action}</p>
            </div>
            <div className="flex items-center gap-2 pl-6">
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${PRIORITY_STYLES[r.priority] || ''}`}>
                {r.priority}
              </span>
              <span className="text-xs text-muted-foreground">{r.context}</span>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

// ──────── Empty State ────────
function VoCEmptyState() {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center space-y-3">
        <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
          <Brain className="h-7 w-7 text-muted-foreground" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">Análisis VoC no disponible</h3>
          <p className="text-sm text-muted-foreground max-w-md mt-1">
            Registra al menos 2 quejas, encuestas CSAT/NPS o touchpoints con comentarios para activar el análisis de Voz del Cliente con inteligencia artificial.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// ──────── Loading State ────────
function VoCLoading() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Analizando voz del cliente con IA...</span>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Skeleton className="h-40 lg:col-span-2" />
        <Skeleton className="h-40" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Skeleton className="h-52" />
        <Skeleton className="h-52" />
      </div>
    </div>
  );
}

// ──────── Main Component ────────
export function CSVoiceOfCustomer() {
  const { data, isLoading, isError, error, regenerate, isFetching } = useCSVoC();

  if (isLoading) return <VoCLoading />;
  if (isError) {
    return (
      <Card className="border-destructive/50">
        <CardContent className="flex items-center gap-3 py-6">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <div>
            <p className="text-sm font-medium">Error al obtener análisis VoC</p>
            <p className="text-xs text-muted-foreground">{(error as Error)?.message}</p>
          </div>
          <Button variant="outline" size="sm" className="ml-auto gap-1.5" onClick={regenerate}>
            <RefreshCw className="h-3.5 w-3.5" /> Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }
  if (!data || data.empty) return <VoCEmptyState />;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Voz del Cliente (VoC)</h2>
          <Badge variant="secondary" className="text-[10px]">
            {data.total_texts} textos analizados
          </Badge>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={regenerate}
          disabled={isFetching}
          className="gap-1.5"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          Regenerar
        </Button>
      </div>

      {/* Row 1: Executive Summary + Temperature */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" />
              Resumen Ejecutivo IA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-muted-foreground">{data.executive_summary}</p>
            <p className="text-[10px] text-muted-foreground/60 mt-3">
              Fuentes: {data.sources.quejas} quejas · {data.sources.touchpoints} touchpoints · {data.sources.csat} CSAT · {data.sources.nps} NPS
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Thermometer className="h-4 w-4 text-primary" />
              Temperatura del Sentimiento
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <SentimentGauge score={data.sentiment_score} />
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Theme Bubbles + Word Cloud */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-primary" />
              Temas Detectados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ThemeBubbles themes={data.themes} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CloudFog className="h-4 w-4 text-primary" />
              Nube de Palabras
            </CardTitle>
          </CardHeader>
          <CardContent>
            <WordCloud words={data.word_cloud} />
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Verbatims + Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-primary" />
              Verbatims Recientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <VerbatimFeed verbatims={data.verbatims} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-primary" />
              Recomendaciones de Acción
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RecommendationsList recommendations={data.recommendations} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
