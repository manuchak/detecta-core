// @ts-nocheck
import React, { useState } from 'react';
import { useStarMapKPIs } from '@/hooks/useStarMapKPIs';
import { StarMapVisualization } from '@/components/starmap/StarMapVisualization';
import { PillarDetailPanel } from '@/components/starmap/PillarDetailPanel';
import { DataHealthSummary } from '@/components/starmap/DataHealthSummary';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Star, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const StarMapPage = () => {
  const { northStar, pillars, overallScore, overallCoverage, loading } = useStarMapKPIs();
  const [selectedPillar, setSelectedPillar] = useState<string | null>(null);
  const navigate = useNavigate();

  const handlePillarClick = (pillarId: string) => {
    setSelectedPillar(prev => prev === pillarId ? null : pillarId);
  };

  const activePillar = pillars.find(p => p.id === selectedPillar);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Calculando KPIs del StarMap…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="h-8 w-8 p-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-3xl font-light tracking-tight text-foreground flex items-center gap-2">
                  <Star className="h-7 w-7" />
                  StarMap
                </h1>
                <p className="text-muted-foreground text-sm">
                  Panel de KPIs estratégicos — 6 pilares + North Star (SCNV)
                </p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{overallScore}</div>
            <p className="text-xs text-muted-foreground">Score General</p>
          </div>
        </div>

        {/* North Star Banner */}
        <Card className="border-primary/20 bg-primary/[0.02]">
          <CardContent className="py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Star className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">NORTH STAR — SCNV</p>
                <p className="text-sm">Servicios Completados Netos Validados</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">
                {northStar.value !== null ? `${Math.round(northStar.value)}%` : '—'}
              </div>
              <div className="flex items-center gap-2">
                {northStar.isProxy && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 border border-amber-500/20">proxy</span>
                )}
                <span className="text-[10px] text-muted-foreground">
                  Faltan: {northStar.missingFields?.join(', ')}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Star Visualization + Detail */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-6">
              <StarMapVisualization
                pillars={pillars}
                northStar={northStar}
                overallScore={overallScore}
                onPillarClick={handlePillarClick}
                selectedPillar={selectedPillar}
              />
              <p className="text-[10px] text-muted-foreground text-center mt-2">
                Haz clic en un pilar para ver detalle · Datos de los últimos 90 días
              </p>
            </CardContent>
          </Card>

          {/* Detail panel */}
          {activePillar ? (
            <PillarDetailPanel pillar={activePillar} />
          ) : (
            <Card className="flex items-center justify-center">
              <CardContent className="text-center py-16">
                <Star className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Selecciona un pilar del StarMap</p>
                <p className="text-xs text-muted-foreground mt-1">para ver sus KPIs y estado de datos</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* All pillars overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {pillars.map(p => (
            <button
              key={p.id}
              onClick={() => handlePillarClick(p.id)}
              className={`text-left p-4 rounded-lg border transition-all hover:shadow-sm ${
                selectedPillar === p.id ? 'border-primary bg-primary/[0.02]' : 'border-border'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium flex items-center gap-2">
                  <span>{p.icon}</span>
                  {p.shortName}
                </span>
                <span className="text-lg font-bold">{p.score}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${p.coverage}%`,
                      backgroundColor: p.color,
                    }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground">{Math.round(p.coverage)}%</span>
              </div>
              <div className="flex gap-1 mt-2">
                {p.kpis.map(k => (
                  <div
                    key={k.id}
                    className={`h-1.5 flex-1 rounded-full ${
                      k.status === 'green' ? 'bg-emerald-500' :
                      k.status === 'yellow' ? 'bg-amber-500' :
                      k.status === 'red' ? 'bg-red-500' :
                      'bg-muted'
                    }`}
                  />
                ))}
              </div>
            </button>
          ))}
        </div>

        {/* Data Health Summary */}
        <DataHealthSummary
          pillars={pillars}
          overallCoverage={overallCoverage}
          overallScore={overallScore}
        />
      </div>
    </div>
  );
};

export default StarMapPage;
