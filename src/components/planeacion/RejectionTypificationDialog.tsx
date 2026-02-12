import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, X, ChevronLeft, User, Car, Settings, MapPin, DollarSign, MessageCircle } from 'lucide-react';
import { REJECTION_CATEGORIES } from '@/constants/rejectionCategories';

interface RejectionTypificationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string, unavailabilityDays?: number) => void;
  guardName: string;
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  'disponibilidad_personal': User,
  'problemas_vehiculo': Car,
  'preferencias_servicio': Settings,
  'limitaciones_geograficas': MapPin,
  'problemas_economicos': DollarSign,
  'comunicacion_otros': MessageCircle,
};

const unavailabilityOptions = [
  { days: 1, label: '1 día' },
  { days: 3, label: '3 días' },
  { days: 7, label: '1 semana' },
  { days: 15, label: '2 semanas' },
  { days: 30, label: '1 mes' }
];

export function RejectionTypificationDialog({
  isOpen,
  onClose,
  onConfirm,
  guardName
}: RejectionTypificationDialogProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [observations, setObservations] = useState('');
  const [markAsUnavailable, setMarkAsUnavailable] = useState(false);
  const [unavailabilityDays, setUnavailabilityDays] = useState<number>();

  const canMarkUnavailable = useMemo(() => {
    if (!selectedCategory || !selectedReason) return false;
    const category = REJECTION_CATEGORIES[selectedCategory];
    return category?.requiresUnavailability?.includes(selectedReason) || false;
  }, [selectedCategory, selectedReason]);

  const handleConfirm = () => {
    if (!selectedCategory || !selectedReason) return;
    if (markAsUnavailable && !unavailabilityDays) return;

    const categoryLabel = REJECTION_CATEGORIES[selectedCategory].label;
    const fullReason = observations
      ? `${categoryLabel}: ${selectedReason}. Obs: ${observations}`
      : `${categoryLabel}: ${selectedReason}`;

    onConfirm(fullReason, markAsUnavailable ? unavailabilityDays : undefined);
    resetForm();
  };

  const resetForm = () => {
    setSelectedCategory(null);
    setSelectedReason(null);
    setObservations('');
    setMarkAsUnavailable(false);
    setUnavailabilityDays(undefined);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setSelectedReason(null);
    setMarkAsUnavailable(false);
    setUnavailabilityDays(undefined);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg z-[70]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <X className="h-5 w-5 text-destructive" />
            Tipificar Rechazo - {guardName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Step 1: Category selection */}
          {!selectedCategory && (
            <div className="space-y-3">
              <Label>Selecciona la categoría del rechazo</Label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(REJECTION_CATEGORIES).map(([catId, category]) => {
                  const Icon = CATEGORY_ICONS[catId] || MessageCircle;
                  return (
                    <Button
                      key={catId}
                      variant="outline"
                      className="h-auto p-3 flex flex-col items-center gap-1.5 text-center hover:border-primary"
                      onClick={() => setSelectedCategory(catId)}
                    >
                      <Icon className="h-5 w-5" style={{ color: category.color }} />
                      <span className="text-xs font-medium leading-tight">{category.label}</span>
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        {category.reasons.length}
                      </Badge>
                    </Button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 2: Reason selection within category */}
          {selectedCategory && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={handleBackToCategories} className="h-7 px-2">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Label className="flex items-center gap-2">
                  {(() => {
                    const Icon = CATEGORY_ICONS[selectedCategory] || MessageCircle;
                    return <Icon className="h-4 w-4" style={{ color: REJECTION_CATEGORIES[selectedCategory].color }} />;
                  })()}
                  {REJECTION_CATEGORIES[selectedCategory].label}
                </Label>
              </div>

              <ScrollArea className="max-h-48">
                <div className="space-y-1.5">
                  {REJECTION_CATEGORIES[selectedCategory].reasons.map((reason) => {
                    const isUnavailabilityReason = REJECTION_CATEGORIES[selectedCategory].requiresUnavailability?.includes(reason);
                    return (
                      <Button
                        key={reason}
                        variant={selectedReason === reason ? "default" : "outline"}
                        className="w-full justify-start text-left h-auto py-2 px-3"
                        onClick={() => {
                          setSelectedReason(reason);
                          setMarkAsUnavailable(false);
                          setUnavailabilityDays(undefined);
                        }}
                      >
                        <span className="text-sm">{reason}</span>
                        {isUnavailabilityReason && (
                          <Badge variant="outline" className="ml-auto text-[10px] px-1.5 border-orange-300 text-orange-600">
                            Indisponibilidad
                          </Badge>
                        )}
                      </Button>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Unavailability Option */}
          {canMarkUnavailable && selectedReason && (
            <Card className="border-orange-200 bg-orange-50/50">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-orange-600" />
                      Marcar como No Disponible
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Quitar de listados por período prolongado
                    </p>
                  </div>
                  <Switch
                    checked={markAsUnavailable}
                    onCheckedChange={setMarkAsUnavailable}
                  />
                </div>

                {markAsUnavailable && (
                  <div className="space-y-2 animate-fade-in">
                    <Label className="text-sm">Período de indisponibilidad:</Label>
                    <div className="flex flex-wrap gap-2">
                      {unavailabilityOptions.map((option) => (
                        <Button
                          key={option.days}
                          variant={unavailabilityDays === option.days ? "default" : "outline"}
                          size="sm"
                          onClick={() => setUnavailabilityDays(option.days)}
                        >
                          {option.label}
                        </Button>
                      ))}
                    </div>

                    {unavailabilityDays && (
                      <div className="mt-2">
                        <Badge variant="secondary" className="text-xs">
                          Se ocultará de listados por {unavailabilityDays} día{unavailabilityDays > 1 ? 's' : ''}
                        </Badge>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Observations */}
          {selectedReason && (
            <div className="space-y-2">
              <Label>Observaciones Adicionales (Opcional)</Label>
              <Textarea
                placeholder="Detalles adicionales sobre el rechazo..."
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                className="min-h-20 resize-none"
                maxLength={300}
              />
              <div className="text-xs text-muted-foreground text-right">
                {observations.length}/300
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Cancelar
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!selectedReason || (markAsUnavailable && !unavailabilityDays)}
              className="flex-1"
              variant="destructive"
            >
              Confirmar Rechazo
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
