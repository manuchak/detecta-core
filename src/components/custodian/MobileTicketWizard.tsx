import { useState } from 'react';
import { ArrowLeft, DollarSign, Truck, Wrench, HelpCircle, FileText, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { BigCategoryButton } from './BigCategoryButton';
import { CameraUploader } from './CameraUploader';
import { TicketSuccessScreen } from './TicketSuccessScreen';
import { useTicketCategories } from '@/hooks/useTicketCategories';
import { useCustodianTicketsEnhanced } from '@/hooks/useCustodianTicketsEnhanced';
import { toast } from 'sonner';

// Map categories to icons and colors
const categoryConfig: Record<string, { icon: any; color: string; subtitle: string }> = {
  'Pagos': { 
    icon: DollarSign, 
    color: 'bg-green-500',
    subtitle: 'Problemas con pagos, bonos o comisiones'
  },
  'Gastos Extra': { 
    icon: FileText, 
    color: 'bg-amber-500',
    subtitle: 'Gastos de casetas, gasolina, viáticos'
  },
  'Servicios / Asignaciones': { 
    icon: Truck, 
    color: 'bg-blue-500',
    subtitle: 'Problemas con rutas o servicios'
  },
  'Equipamiento': { 
    icon: Wrench, 
    color: 'bg-purple-500',
    subtitle: 'GPS, radio, uniforme, vehículo'
  },
  'Administrativo': { 
    icon: Users, 
    color: 'bg-indigo-500',
    subtitle: 'Contratos, documentos, IMSS'
  },
  'Otros': { 
    icon: HelpCircle, 
    color: 'bg-gray-500',
    subtitle: 'Cualquier otro tema'
  },
};

interface MobileTicketWizardProps {
  custodianPhone: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const MobileTicketWizard = ({
  custodianPhone,
  onSuccess,
  onCancel
}: MobileTicketWizardProps) => {
  const { categorias, loading: loadingCategories } = useTicketCategories();
  const { createTicket } = useCustodianTicketsEnhanced(custodianPhone);
  
  const [step, setStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdTicketNumber, setCreatedTicketNumber] = useState('');

  const selectedCategoryData = categorias.find(c => c.id === selectedCategory);
  const needsAmount = selectedCategoryData?.nombre === 'Pagos' || selectedCategoryData?.nombre === 'Gastos Extra';

  const canProceed = () => {
    switch (step) {
      case 1: return selectedCategory !== null;
      case 2: return description.trim().length >= 10;
      case 3: return true; // Photos are optional
      default: return false;
    }
  };

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      onCancel();
    }
  };

  const handleSubmit = async () => {
    if (!selectedCategoryData) return;
    
    setIsSubmitting(true);
    try {
      // Auto-assign priority based on category
      const priority = ['Pagos', 'Servicios / Asignaciones'].includes(selectedCategoryData.nombre)
        ? 'alta'
        : 'media';

      const result = await createTicket({
        categoria_custodio_id: selectedCategory!,
        subcategoria_custodio_id: undefined,
        subject: `${selectedCategoryData.nombre} - Reporte`,
        description: description,
        priority: priority,
        monto_reclamado: needsAmount && amount ? parseFloat(amount) : undefined,
      }, files.length > 0 ? files : undefined);

      if (result) {
        setCreatedTicketNumber(result.ticket_number || 'TKT-XXXX');
        setStep(4); // Success screen
      }
    } catch (error) {
      toast.error('Error al enviar la queja. Intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 4: Success screen
  if (step === 4) {
    return (
      <TicketSuccessScreen
        ticketNumber={createdTicketNumber}
        categoryName={selectedCategoryData?.nombre || ''}
        onViewTickets={onSuccess}
        onGoHome={onCancel}
      />
    );
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-140px)]">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b border-border">
        <Button
          variant="ghost"
          size="icon"
          className="w-12 h-12 rounded-full"
          onClick={handleBack}
        >
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground">
            {step === 1 && '¿Qué problema tienes?'}
            {step === 2 && 'Cuéntanos más'}
            {step === 3 && 'Agrega fotos (opcional)'}
          </h1>
          <p className="text-sm text-muted-foreground">
            Paso {step} de 3
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-muted">
        <div 
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${(step / 3) * 100}%` }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Step 1: Category selection */}
        {step === 1 && (
          <div className="space-y-3">
            {loadingCategories ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : (
              categorias.map((cat) => {
                const config = categoryConfig[cat.nombre] || categoryConfig['Otros'];
                return (
                  <BigCategoryButton
                    key={cat.id}
                    icon={config.icon}
                    title={cat.nombre}
                    subtitle={config.subtitle}
                    color={config.color}
                    selected={selectedCategory === cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                  />
                );
              })
            )}
          </div>
        )}

        {/* Step 2: Description */}
        {step === 2 && (
          <div className="space-y-6">
            {/* Amount field for financial categories */}
            {needsAmount && (
              <div className="space-y-2">
                <label className="text-base font-semibold text-foreground">
                  💰 ¿Cuánto dinero es? (opcional)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-muted-foreground">$</span>
                  <Input
                    type="number"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="h-14 text-xl pl-10 rounded-xl"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-base font-semibold text-foreground">
                📝 Describe tu problema
              </label>
              <Textarea
                placeholder="Ejemplo: No me pagaron el bono del servicio del martes pasado..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[180px] text-base rounded-xl resize-none"
              />
              <p className="text-sm text-muted-foreground text-right">
                {description.length} caracteres (mínimo 10)
              </p>
            </div>
          </div>
        )}

        {/* Step 3: Photos */}
        {step === 3 && (
          <div className="space-y-4">
            <p className="text-base text-muted-foreground">
              📸 Sube fotos de comprobantes, capturas de pantalla o cualquier evidencia que ayude a resolver tu problema.
            </p>
            <CameraUploader
              files={files}
              onFilesChange={setFiles}
              maxFiles={5}
            />
          </div>
        )}
      </div>

      {/* Footer with action button */}
      <div className="p-4 border-t border-border bg-background">
        <Button
          onClick={handleNext}
          disabled={!canProceed() || isSubmitting}
          size="lg"
          className="w-full h-14 text-lg font-semibold rounded-2xl"
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full" />
              Enviando...
            </div>
          ) : step === 3 ? (
            files.length > 0 ? 'Enviar Queja' : 'Enviar sin fotos'
          ) : (
            'Continuar'
          )}
        </Button>
      </div>
    </div>
  );
};
