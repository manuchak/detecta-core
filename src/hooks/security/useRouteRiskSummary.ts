import { useMemo } from 'react';
import { useRouteCoverage } from './useRouteCoverage';
import {
  OPERATIONAL_CONSTANTS,
  calculateTouchpointAnalysis,
  determineCustodyType,
  generateISO28000Recommendations,
  getOverallAlertLevel,
  type ISO28000Recommendations,
  type AlertLevel,
  type ProtocolType,
  type TouchpointGapZone,
  type OperationalImpact
} from '@/lib/security/securityRecommendations';
import { type RiskLevel } from '@/lib/security/highwaySegments';

interface RiskZoneCrossed {
  h3Index: string;
  riskLevel: RiskLevel;
  priceMultiplier: number;
}

interface UseRouteRiskSummaryProps {
  routeCoordinates: [number, number][] | null;
  totalDistanceKm: number;
  riskZonesCrossed?: RiskZoneCrossed[];
  cargoValueMXN?: number;
}

interface UseRouteRiskSummaryReturn {
  connectivityReport: ReturnType<typeof useRouteCoverage>['report'];
  connectivityBadge: ReturnType<typeof useRouteCoverage>['connectivityBadge'];
  operationalImpact: OperationalImpact | null;
  overallRiskLevel: RiskLevel;
  overallAlertLevel: AlertLevel;
  custodyType: ReturnType<typeof determineCustodyType>;
  recommendations: ISO28000Recommendations;
  hasConnectivityIssues: boolean;
  hasCriticalZones: boolean;
  requiresSatellite: boolean;
  totalLostTouchpoints: number;
}

export const useRouteRiskSummary = ({
  routeCoordinates, totalDistanceKm, riskZonesCrossed = [], cargoValueMXN,
}: UseRouteRiskSummaryProps): UseRouteRiskSummaryReturn => {
  const { report, connectivityBadge, hasIssues } = useRouteCoverage({
    routeCoordinates, totalRouteKm: totalDistanceKm,
  });

  const operationalImpact = useMemo((): OperationalImpact | null => {
    if (!report || !report.deadZonesCrossed.length) {
      return {
        estimatedTransitTimeMinutes: Math.round((totalDistanceKm / OPERATIONAL_CONSTANTS.avgTruckSpeedKmh) * 60),
        expectedTouchpoints: Math.floor((totalDistanceKm / OPERATIONAL_CONSTANTS.avgTruckSpeedKmh) * 60 / OPERATIONAL_CONSTANTS.touchpointIntervalMinutes),
        lostTouchpoints: 0, maxConsecutiveMinutesNoContact: 0, zonesWithLostTouchpoints: [],
        alertLevel: 'normal', protocolRequired: 'standard',
      };
    }
    
    const zonesWithLostTouchpoints: TouchpointGapZone[] = [];
    let totalLostTouchpoints = 0;
    let maxConsecutiveMinutes = 0;
    
    for (const zone of report.deadZonesCrossed) {
      const analysis = calculateTouchpointAnalysis(zone.estimatedLengthKm);
      if (analysis.touchpointsLost > 0 || analysis.transitTimeMinutes >= OPERATIONAL_CONSTANTS.maxAcceptableNoContactMinutes) {
        zonesWithLostTouchpoints.push({
          zoneName: zone.name, kmLength: zone.estimatedLengthKm,
          transitMinutes: analysis.transitTimeMinutes, touchpointsLost: analysis.touchpointsLost,
          requiresCheckIn: analysis.checkInRequired, requiresSatellite: analysis.satelliteRequired,
        });
        totalLostTouchpoints += analysis.touchpointsLost;
        maxConsecutiveMinutes = Math.max(maxConsecutiveMinutes, analysis.transitTimeMinutes);
      }
    }
    
    const alertLevel = getOverallAlertLevel(zonesWithLostTouchpoints);
    let protocolRequired: ProtocolType = 'standard';
    if (totalLostTouchpoints >= 3) protocolRequired = 'satellite';
    else if (totalLostTouchpoints >= 1) protocolRequired = 'enhanced';
    
    return {
      estimatedTransitTimeMinutes: Math.round((totalDistanceKm / OPERATIONAL_CONSTANTS.avgTruckSpeedKmh) * 60),
      expectedTouchpoints: Math.floor((totalDistanceKm / OPERATIONAL_CONSTANTS.avgTruckSpeedKmh) * 60 / OPERATIONAL_CONSTANTS.touchpointIntervalMinutes),
      lostTouchpoints: totalLostTouchpoints, maxConsecutiveMinutesNoContact: maxConsecutiveMinutes,
      zonesWithLostTouchpoints, alertLevel, protocolRequired,
    };
  }, [report, totalDistanceKm]);

  const overallRiskLevel = useMemo((): RiskLevel => {
    if (!riskZonesCrossed.length) return 'bajo';
    if (riskZonesCrossed.some(z => z.riskLevel === 'extremo')) return 'extremo';
    if (riskZonesCrossed.some(z => z.riskLevel === 'alto')) return 'alto';
    if (riskZonesCrossed.some(z => z.riskLevel === 'medio')) return 'medio';
    return 'bajo';
  }, [riskZonesCrossed]);

  const custodyType = useMemo(() => determineCustodyType(cargoValueMXN), [cargoValueMXN]);

  const overallAlertLevel = useMemo((): AlertLevel => {
    const connectivityAlert = operationalImpact?.alertLevel || 'normal';
    if (overallRiskLevel === 'extremo' || connectivityAlert === 'emergency') return 'emergency';
    if (overallRiskLevel === 'alto' || connectivityAlert === 'critical') return 'critical';
    if (connectivityAlert === 'warning') return 'warning';
    return 'normal';
  }, [overallRiskLevel, operationalImpact]);

  const recommendations = useMemo((): ISO28000Recommendations => {
    const touchpointAnalysis = operationalImpact ? calculateTouchpointAnalysis(
      operationalImpact.maxConsecutiveMinutesNoContact > 0
        ? (operationalImpact.maxConsecutiveMinutesNoContact / 60) * OPERATIONAL_CONSTANTS.avgTruckSpeedKmh
        : 0
    ) : null;
    return generateISO28000Recommendations(overallRiskLevel, touchpointAnalysis, cargoValueMXN);
  }, [overallRiskLevel, operationalImpact, cargoValueMXN]);

  return {
    connectivityReport: report, connectivityBadge, operationalImpact,
    overallRiskLevel, overallAlertLevel, custodyType, recommendations,
    hasConnectivityIssues: hasIssues,
    hasCriticalZones: riskZonesCrossed.some(z => z.riskLevel === 'extremo' || z.riskLevel === 'alto'),
    requiresSatellite: operationalImpact?.protocolRequired === 'satellite',
    totalLostTouchpoints: operationalImpact?.lostTouchpoints || 0,
  };
};