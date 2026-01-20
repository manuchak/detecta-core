import React from 'react';
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
}

export const SIERCPRadarProfile: React.FC<SIERCPRadarProfileProps> = ({
  modules,
  size = 'md',
}) => {
  const sizeConfig = {
    sm: { height: 200, fontSize: 9 },
    md: { height: 280, fontSize: 11 },
    lg: { height: 350, fontSize: 12 },
  };

  const config = sizeConfig[size];

  const radarData = modules.map((m) => ({
    modulo: m.shortName || m.modulo,
    score: m.score,
    fullMark: 100,
  }));

  return (
    <div style={{ width: '100%', height: config.height }}>
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
