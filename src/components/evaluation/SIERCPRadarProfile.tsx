import React, { useRef, useEffect, useState } from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from 'recharts';

interface ModuleScore {
  modulo: string;
  score: number;
  shortName?: string;
}

interface SIERCPRadarProfileProps {
  modules: ModuleScore[];
  size?: 'sm' | 'md' | 'lg';
  forPrint?: boolean;
}

export const SIERCPRadarProfile: React.FC<SIERCPRadarProfileProps> = ({
  modules,
  size = 'md',
  forPrint = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 280, height: 280 });

  const sizeConfig = {
    sm: { height: 180, fontSize: 8, chartSize: 160 },
    md: { height: 280, fontSize: 10, chartSize: 250 },
    lg: { height: 350, fontSize: 11, chartSize: 320 },
  };

  const config = sizeConfig[size];

  // For print, use fixed dimensions to ensure proper rendering
  const chartWidth = forPrint ? config.chartSize : dimensions.width;
  const chartHeight = forPrint ? config.chartSize : config.height;

  useEffect(() => {
    if (!forPrint && containerRef.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          setDimensions({
            width: entry.contentRect.width || config.chartSize,
            height: entry.contentRect.height || config.height,
          });
        }
      });
      resizeObserver.observe(containerRef.current);
      return () => resizeObserver.disconnect();
    }
  }, [forPrint, config.chartSize, config.height]);

  const radarData = modules.map((m) => ({
    modulo: m.shortName || m.modulo,
    score: m.score,
    fullMark: 100,
  }));

  // For print mode, render with fixed dimensions (no ResponsiveContainer)
  if (forPrint) {
    return (
      <div 
        className="flex items-center justify-center print-avoid-break"
        style={{ width: config.chartSize, height: config.chartSize }}
      >
        <RadarChart 
          width={config.chartSize} 
          height={config.chartSize} 
          data={radarData}
          margin={{ top: 15, right: 25, bottom: 15, left: 25 }}
        >
          <PolarGrid stroke="#d1d5db" strokeDasharray="3 3" />
          <PolarAngleAxis
            dataKey="modulo"
            tick={{ fontSize: config.fontSize, fill: '#374151' }}
            tickLine={false}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 100]}
            tick={{ fontSize: 8, fill: '#9ca3af' }}
            tickCount={5}
            axisLine={false}
          />
          <Radar
            name="Perfil"
            dataKey="score"
            stroke="#2563eb"
            fill="#3b82f6"
            fillOpacity={0.4}
            strokeWidth={2}
            dot={{ r: 3, fill: '#2563eb' }}
          />
        </RadarChart>
      </div>
    );
  }

  // For screen, use ResponsiveContainer
  return (
    <div ref={containerRef} style={{ width: '100%', height: config.height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={radarData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis
            dataKey="modulo"
            tick={{ fontSize: config.fontSize, fill: '#374151' }}
            tickLine={false}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 100]}
            tick={{ fontSize: 9, fill: '#9ca3af' }}
            tickCount={5}
            axisLine={false}
          />
          <Radar
            name="Perfil"
            dataKey="score"
            stroke="#2563eb"
            fill="#3b82f6"
            fillOpacity={0.4}
            strokeWidth={2}
            dot={{ r: 3, fill: '#2563eb' }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SIERCPRadarProfile;
