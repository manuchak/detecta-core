
import { CircleCheck, Clock, MapPin, TriangleAlert } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";

interface MetricsProps {
  onTimeCount: number;
  onTimePercent: number;
  delayedCount: number;
  delayedPercent: number;
  riskZones: number;
  riskZonePercent: number;
  activeIncidents: {
    critical: number;
    major: number;
    minor: number;
  };
  totalServices: number;
}

export const SupplyChainMetrics = ({
  onTimeCount,
  onTimePercent,
  delayedCount,
  delayedPercent,
  riskZones,
  riskZonePercent,
  activeIncidents,
  totalServices
}: MetricsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card className="bg-white shadow-sm border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center">
                <CircleCheck className="h-5 w-5 mr-2 text-green-600" />
                <h3 className="text-sm font-medium text-gray-700">En tiempo</h3>
              </div>
              <p className="text-2xl font-bold mt-1">{onTimeCount}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <span className="text-sm font-medium text-green-700">{onTimePercent}%</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-white shadow-sm border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center">
                <Clock className="h-5 w-5 mr-2 text-red-600" />
                <h3 className="text-sm font-medium text-gray-700">Retrasos</h3>
              </div>
              <p className="text-2xl font-bold mt-1">{delayedCount}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
              <span className="text-sm font-medium text-red-700">{delayedPercent}%</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-white shadow-sm border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-yellow-600" />
                <h3 className="text-sm font-medium text-gray-700">Zonas riesgo</h3>
              </div>
              <p className="text-2xl font-bold mt-1">{riskZones}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
              <span className="text-sm font-medium text-yellow-700">{riskZonePercent}%</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-white shadow-sm border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center">
                <TriangleAlert className="h-5 w-5 mr-2 text-orange-600" />
                <h3 className="text-sm font-medium text-gray-700">Incidentes</h3>
              </div>
              <p className="text-2xl font-bold mt-1">{activeIncidents.critical + activeIncidents.major + activeIncidents.minor}</p>
            </div>
            <div className="flex gap-1">
              <span className="px-1.5 py-0.5 bg-red-100 text-red-800 rounded text-xs font-medium">{activeIncidents.critical}</span>
              <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">{activeIncidents.major}</span>
              <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-medium">{activeIncidents.minor}</span>
            </div>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {totalServices} servicios activos
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SupplyChainMetrics;
