import { useMemo } from 'react';
import { HIGHWAY_SEGMENTS, type HighwaySegment, type RiskLevel } from '@/lib/security/highwaySegments';

interface SegmentCrossed {
  segmentId: string;
  name: string;
  riskLevel: RiskLevel;
  corridorId: string;
  recommendations: string[];
}

interface CorredorRiskAnalysis {
  overallRiskLevel: RiskLevel;
  segmentsCrossed: SegmentCrossed[];
  recommendations: string[];
  isAnalyzed: boolean;
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function isNearSegment(lat: number, lng: number, segment: HighwaySegment, thresholdKm: number = 15): boolean {
  return segment.waypoints.some(([wpLng, wpLat]) =>
    haversineDistance(lat, lng, wpLat, wpLng) <= thresholdKm
  );
}

function routeCrossesSegment(startLat: number, startLng: number, endLat: number, endLng: number, segment: HighwaySegment, thresholdKm: number = 15): boolean {
  if (isNearSegment(startLat, startLng, segment, thresholdKm)) return true;
  if (isNearSegment(endLat, endLng, segment, thresholdKm)) return true;
  
  const numSteps = 10;
  for (let i = 1; i < numSteps; i++) {
    const t = i / numSteps;
    const interpLat = startLat + (endLat - startLat) * t;
    const interpLng = startLng + (endLng - startLng) * t;
    if (isNearSegment(interpLat, interpLng, segment, thresholdKm)) return true;
  }
  return false;
}

const RISK_PRIORITY: Record<RiskLevel, number> = { extremo: 4, alto: 3, medio: 2, bajo: 1 };

function getMaxRiskLevel(segments: SegmentCrossed[]): RiskLevel {
  if (segments.length === 0) return 'bajo';
  return segments.reduce((maxLevel, seg) =>
    RISK_PRIORITY[seg.riskLevel] > RISK_PRIORITY[maxLevel] ? seg.riskLevel : maxLevel,
    'bajo' as RiskLevel
  );
}

export function useCorredorRiskAnalysis(
  startCoords: { lat: number; lng: number } | null,
  endCoords: { lat: number; lng: number } | null
): CorredorRiskAnalysis {
  return useMemo(() => {
    if (!startCoords || !endCoords || !startCoords.lat || !startCoords.lng || !endCoords.lat || !endCoords.lng) {
      return { overallRiskLevel: 'bajo' as RiskLevel, segmentsCrossed: [], recommendations: [], isAnalyzed: false };
    }

    const crossedSegments: SegmentCrossed[] = [];
    for (const segment of HIGHWAY_SEGMENTS) {
      if (routeCrossesSegment(startCoords.lat, startCoords.lng, endCoords.lat, endCoords.lng, segment)) {
        crossedSegments.push({
          segmentId: segment.id, name: segment.name, riskLevel: segment.riskLevel,
          corridorId: segment.corridorId, recommendations: segment.recommendations,
        });
      }
    }

    const maxLevel = getMaxRiskLevel(crossedSegments);
    const recommendations: string[] = [];
    const seenRecommendations = new Set<string>();
    const sortedSegments = [...crossedSegments].sort((a, b) => RISK_PRIORITY[b.riskLevel] - RISK_PRIORITY[a.riskLevel]);

    for (const seg of sortedSegments) {
      for (const rec of seg.recommendations) {
        if (!seenRecommendations.has(rec)) {
          seenRecommendations.add(rec);
          recommendations.push(rec);
        }
      }
      if (recommendations.length >= 5) break;
    }

    return { overallRiskLevel: maxLevel, segmentsCrossed: sortedSegments, recommendations, isAnalyzed: crossedSegments.length > 0 };
  }, [startCoords, endCoords]);
}