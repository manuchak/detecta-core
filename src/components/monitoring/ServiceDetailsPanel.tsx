
import { 
  CalendarClock, 
  Map,
  MapPin
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface ServiceDetailsProps {
  service?: {
    id: string;
    serviceId: string;
    driver: string;
    vehicleType: string;
    origin: string;
    destination: string;
    eta: string;
    progress: number;
    status: string;
    custodian: string;
    trackingId: string;
    delayMinutes?: number;
  };
  onClose: () => void;
}

export const ServiceDetailsPanel = ({ service, onClose }: ServiceDetailsProps) => {
  if (!service) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "on-time":
        return "text-green-600";
      case "delayed":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <Card className="bg-white shadow-lg border">
      <CardHeader className="pb-2 border-b">
        <CardTitle className="text-lg font-medium flex justify-between">
          <span>Detalles del Servicio #{service.serviceId}</span>
          <button 
            onClick={onClose}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[460px]">
          <div className="p-4">
            <div className="flex items-center mb-4">
              <div className="bg-blue-100 p-1 rounded-lg mr-2">
                <Map className="h-5 w-5 text-blue-700" />
              </div>
              <h3 className="text-base font-medium">Información del Servicio</h3>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-500">Custodio</p>
                <p className="font-medium">{service.custodian}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">ID Rastreo</p>
                <p className="font-medium">#{service.trackingId}</p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <div className="flex items-start mb-1">
                  <MapPin className="h-4 w-4 mt-0.5 mr-2 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Origen</p>
                    <p className="font-medium">{service.origin}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <div className="flex items-start">
                  <MapPin className="h-4 w-4 mt-0.5 mr-2 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Destino</p>
                    <p className="font-medium">{service.destination}</p>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-start">
                  <CalendarClock className="h-4 w-4 mt-0.5 mr-2 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Hora estimada de llegada</p>
                    <p className={`font-medium ${getStatusColor(service.status)}`}>
                      {service.eta}
                      {service.delayMinutes && service.delayMinutes > 0 && (
                        <span className="text-red-500 text-sm ml-2">
                          (+{service.delayMinutes} min)
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-2">Progreso de ruta</p>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${service.status === "delayed" ? "bg-red-500" : "bg-green-500"}`}
                  style={{ width: `${service.progress}%` }}
                ></div>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-xs text-gray-500">Origen</span>
                <span className="text-xs text-gray-500">{service.progress}%</span>
                <span className="text-xs text-gray-500">Destino</span>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="space-y-4">
              <div className="flex justify-between">
                <p className="text-sm text-gray-500">Conductor</p>
                <p className="font-medium">{service.driver}</p>
              </div>
              <div className="flex justify-between">
                <p className="text-sm text-gray-500">Vehículo</p>
                <p className="font-medium">{service.vehicleType}</p>
              </div>
              <div className="flex justify-between">
                <p className="text-sm text-gray-500">Estado</p>
                <Badge
                  variant="outline" 
                  className={`${service.status === "on-time" ? "bg-green-100 text-green-800" : 
                    service.status === "delayed" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}`}
                >
                  {service.status === "on-time" ? "En tiempo" : 
                   service.status === "delayed" ? "Retraso" : "En ruta"}
                </Badge>
              </div>
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ServiceDetailsPanel;
