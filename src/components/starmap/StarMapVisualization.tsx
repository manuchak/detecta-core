// @ts-nocheck
import React, { useState } from 'react';
import type { StarMapPillar, StarMapKPI } from '@/hooks/useStarMapKPIs';

interface Props {
  pillars: StarMapPillar[];
  northStar: StarMapKPI;
  overallScore: number;
  onPillarClick: (pillarId: string) => void;
  selectedPillar: string | null;
}

export const StarMapVisualization: React.FC<Props> = ({
  pillars,
  northStar,
  overallScore,
  onPillarClick,
  selectedPillar,
}) => {
  const cx = 200;
  const cy = 200;
  const outerR = 160;
  const innerR = 65;

  // Generate 5 outer points + 5 inner points for a 5-pointed star
  // We have 6 pillars, so we use a hexagon-star hybrid
  const numPoints = 6;
  const points: { x: number; y: number; pillar: StarMapPillar }[] = [];

  for (let i = 0; i < numPoints; i++) {
    const angle = (Math.PI * 2 * i) / numPoints - Math.PI / 2;
    const r = outerR;
    points.push({
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
      pillar: pillars[i],
    });
  }

  // Create star path with alternating outer/inner vertices
  const starPath = points
    .flatMap((p, i) => {
      const nextI = (i + 1) % numPoints;
      const midAngle = (Math.PI * 2 * (i + 0.5)) / numPoints - Math.PI / 2;
      const ix = cx + innerR * Math.cos(midAngle);
      const iy = cy + innerR * Math.sin(midAngle);
      return [
        `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`,
        `L ${ix} ${iy}`,
      ];
    })
    .join(' ') + ' Z';

  // Score-based filled star (radar-like)
  const filledPoints = points.map((p, i) => {
    const angle = (Math.PI * 2 * i) / numPoints - Math.PI / 2;
    const score = pillars[i]?.score || 0;
    const r = innerR + (outerR - innerR) * (score / 100);
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  });
  const filledPath = filledPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'hsl(var(--success))';
    if (score >= 50) return 'hsl(var(--warning))';
    return 'hsl(var(--destructive))';
  };

  return (
    <div className="flex items-center justify-center">
      <svg viewBox="0 0 400 400" className="w-full max-w-[420px] h-auto">
        {/* Background grid circles */}
        {[0.25, 0.5, 0.75, 1].map(ratio => (
          <circle
            key={ratio}
            cx={cx}
            cy={cy}
            r={innerR + (outerR - innerR) * ratio}
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth="0.5"
            strokeDasharray="3 3"
            opacity={0.4}
          />
        ))}

        {/* Axis lines */}
        {points.map((p, i) => (
          <line
            key={`axis-${i}`}
            x1={cx}
            y1={cy}
            x2={p.x}
            y2={p.y}
            stroke="hsl(var(--border))"
            strokeWidth="0.5"
            opacity={0.4}
          />
        ))}

        {/* Star outline */}
        <path
          d={starPath}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth="1"
          opacity={0.3}
        />

        {/* Filled radar area */}
        <path
          d={filledPath}
          fill="hsl(var(--primary) / 0.1)"
          stroke="hsl(var(--primary))"
          strokeWidth="2"
        />

        {/* Pillar nodes */}
        {points.map((p, i) => {
          const pillar = pillars[i];
          if (!pillar) return null;
          const isSelected = selectedPillar === pillar.id;
          const nodeR = isSelected ? 28 : 22;

          return (
            <g
              key={pillar.id}
              onClick={() => onPillarClick(pillar.id)}
              className="cursor-pointer"
              role="button"
              tabIndex={0}
            >
              {/* Node circle */}
              <circle
                cx={p.x}
                cy={p.y}
                r={nodeR}
                fill={isSelected ? 'hsl(var(--primary))' : 'hsl(var(--card))'}
                stroke={pillar.coverage > 0 ? getScoreColor(pillar.score) : 'hsl(var(--muted-foreground))'}
                strokeWidth={isSelected ? 3 : 2}
                className="transition-all duration-200"
              />
              {/* Score text */}
              <text
                x={p.x}
                y={p.y - 4}
                textAnchor="middle"
                fontSize="11"
                fontWeight="700"
                fill={isSelected ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))'}
              >
                {pillar.coverage > 0 ? `${pillar.score}` : '—'}
              </text>
              <text
                x={p.x}
                y={p.y + 8}
                textAnchor="middle"
                fontSize="7"
                fill={isSelected ? 'hsl(var(--primary-foreground))' : 'hsl(var(--muted-foreground))'}
              >
                {pillar.shortName}
              </text>

              {/* Label outside */}
              <text
                x={p.x + (p.x > cx ? 20 : p.x < cx ? -20 : 0)}
                y={p.y + (p.y > cy ? 38 : p.y < cy ? -30 : p.y === cy ? 0 : 0)}
                textAnchor="middle"
                fontSize="9"
                fill="hsl(var(--muted-foreground))"
                fontWeight="500"
              >
                {Math.round(pillar.coverage)}% datos
              </text>
            </g>
          );
        })}

        {/* North Star center */}
        <circle
          cx={cx}
          cy={cy}
          r={32}
          fill="hsl(var(--card))"
          stroke="hsl(var(--primary))"
          strokeWidth="2.5"
        />
        <text
          x={cx}
          y={cy - 8}
          textAnchor="middle"
          fontSize="8"
          fill="hsl(var(--muted-foreground))"
          fontWeight="500"
        >
          NORTH STAR
        </text>
        <text
          x={cx}
          y={cy + 6}
          textAnchor="middle"
          fontSize="14"
          fontWeight="800"
          fill="hsl(var(--foreground))"
        >
          {northStar.value !== null ? `${Math.round(northStar.value)}%` : '—'}
        </text>
        <text
          x={cx}
          y={cy + 18}
          textAnchor="middle"
          fontSize="7"
          fill="hsl(var(--muted-foreground))"
        >
          SCNV (proxy)
        </text>
      </svg>
    </div>
  );
};
