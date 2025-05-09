
// Calculate ETA based on remaining distance, average speed and known incidents
export function calculateETA(
  remainingDistance: number,
  averageSpeed: number,
  incidents: { type: string; delayMinutes: number }[]
): { eta: string; delayMinutes: number } {
  // Base travel time in minutes
  const baseTravelTime = (remainingDistance / averageSpeed) * 60;
  
  // Calculate additional delay from incidents
  const totalDelayMinutes = incidents.reduce((sum, incident) => sum + incident.delayMinutes, 0);
  
  // Total travel time
  const totalTravelTime = baseTravelTime + totalDelayMinutes;
  
  // Calculate arrival time
  const now = new Date();
  const arrivalTime = new Date(now.getTime() + totalTravelTime * 60000);
  
  // Format the time as HH:MM
  const hours = arrivalTime.getHours();
  const minutes = arrivalTime.getMinutes();
  const formattedETA = `${hours}:${minutes.toString().padStart(2, '0')}`;
  
  return {
    eta: formattedETA,
    delayMinutes: totalDelayMinutes
  };
}

// Calculate risk score for a route based on various factors
export function calculateRiskScore(
  weatherCondition: string,
  timeOfDay: string,
  knownRiskZones: number,
  historicalIncidents: number
): number {
  let riskScore = 0;
  
  // Weather risk factors
  if (weatherCondition === 'rainy') {
    riskScore += 25;
  } else if (weatherCondition === 'foggy') {
    riskScore += 20;
  }
  
  // Time of day risk factors
  if (timeOfDay === 'night') {
    riskScore += 15;
  }
  
  // Known risk zones
  riskScore += knownRiskZones * 10;
  
  // Historical incidents
  riskScore += historicalIncidents * 5;
  
  // Cap at 100
  return Math.min(riskScore, 100);
}

// Determine if a service is delayed
export function isServiceDelayed(
  expectedProgress: number,
  actualProgress: number,
  tolerancePercent: number = 10
): boolean {
  return actualProgress < (expectedProgress - tolerancePercent);
}

// Calculate service progress percentage
export function calculateServiceProgress(
  startTime: Date,
  estimatedEndTime: Date,
  currentTime: Date = new Date()
): number {
  const totalDuration = estimatedEndTime.getTime() - startTime.getTime();
  const elapsedDuration = currentTime.getTime() - startTime.getTime();
  
  const progressPercent = Math.floor((elapsedDuration / totalDuration) * 100);
  
  // Ensure within 0-100 range
  return Math.min(100, Math.max(0, progressPercent));
}
