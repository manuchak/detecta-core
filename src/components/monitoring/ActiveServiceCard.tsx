
import { CalendarClock, MapPin } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface ServiceProps {
  id: string;
  serviceId: string;
  driver: string;
  vehicleType: string;
  destination: string;
  eta: string;
  progress: number;
  status: string;
  delayMinutes?: number;
  onClick: (id: string) => void;
}

export const ActiveServiceCard = ({
  id,
  serviceId,
  driver,
  vehicleType,
  destination,
  eta,
  progress,
  status,
  delayMinutes,
  onClick
}: ServiceProps) => {
  return (
    <Card
      className={`cursor-pointer hover:border-primary/50 transition-all ${
        status === "delayed" ? "border-red-300 bg-red-50" : 
        status === "on-time" ? "border-green-300 bg-green-50" : "border-gray-200"
      }`}
      onClick={() => onClick(id)}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center">
            <span className="text-sm font-bold text-blue-600 mr-1">{serviceId}</span>
            <span className="text-sm font-medium">{driver}</span>
          </div>
          <Badge
            variant="outline"
            className={`${
              status === "delayed" ? "bg-red-100 text-red-800" : 
              status === "on-time" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
            }`}
          >
            {status === "delayed" ? "Retraso" : 
             status === "on-time" ? "En tiempo" : "En ruta"}
          </Badge>
        </div>
        
        <div className="text-xs text-gray-500 mb-1">{vehicleType}</div>
        
        <div className="flex items-start mb-2">
          <MapPin className="h-4 w-4 mt-0.5 mr-1 text-gray-400" />
          <div className="text-sm">
            <span>Destino</span>
            <p className="font-medium">{destination}</p>
          </div>
        </div>
        
        <div className="flex items-center mb-2">
          <CalendarClock className="h-4 w-4 mr-1 text-gray-400" />
          <div className="text-sm">
            <span>ETA: </span>
            <span className={`font-medium ${status === "delayed" ? "text-red-600" : ""}`}>
              {eta}
            </span>
            {delayMinutes && delayMinutes > 0 && (
              <span className="text-red-500 text-xs ml-1">
                +{delayMinutes} min
              </span>
            )}
          </div>
        </div>
        
        <div className="mt-3">
          <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full ${status === "delayed" ? "bg-red-500" : "bg-green-500"}`}
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-gray-500">Progreso: {progress}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ActiveServiceCard;
