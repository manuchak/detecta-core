import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Phone, Send } from "lucide-react";

export const DialfireTestPanel = () => {
  const [campaignId, setCampaignId] = useState('test-campaign-2025');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [testPayload, setTestPayload] = useState(JSON.stringify({
    call_id: "test-" + Date.now(),
    campaign_id: "test-campaign-2025",
    phone_number: "+5215512345678",
    call_status: "answered",
    call_duration: 180,
    agent_id: "agent-test-01",
    agent_notes: "Candidato interesado, buena comunicación",
    started_at: new Date().toISOString(),
    ended_at: new Date(Date.now() + 180000).toISOString(),
    recording_url: null,
    custom_data: {
      is_test: true,
      test_notes: "Prueba de integración Dialfire"
    }
  }, null, 2));
  const [isLoading, setIsLoading] = useState(false);

  const handleTestWebhook = async () => {
    setIsLoading(true);
    try {
      const payload = JSON.parse(testPayload);
      
      const response = await fetch(
        'https://yydzzeljaewsfhmilnhm.supabase.co/functions/v1/dialfire-webhook',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();
      
      if (response.ok) {
        toast.success('✅ Webhook Dialfire procesado correctamente', {
          description: `Call log ID: ${result.call_log_id}`,
        });
      } else {
        toast.error('Error al procesar webhook', {
          description: result.error || 'Error desconocido',
        });
      }
    } catch (error) {
      console.error('Error testing webhook:', error);
      toast.error('Error al enviar prueba', {
        description: error instanceof Error ? error.message : 'Error desconocido',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Phone className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Simulador de Webhook Dialfire</h3>
        </div>

        <div className="grid gap-4">
          <div>
            <Label htmlFor="campaign-id">Campaign ID</Label>
            <Input
              id="campaign-id"
              value={campaignId}
              onChange={(e) => setCampaignId(e.target.value)}
              placeholder="test-campaign-2025"
            />
          </div>

          <div>
            <Label htmlFor="test-payload">Payload de Prueba (JSON)</Label>
            <Textarea
              id="test-payload"
              value={testPayload}
              onChange={(e) => setTestPayload(e.target.value)}
              rows={12}
              className="font-mono text-xs"
            />
          </div>

          <Button 
            onClick={handleTestWebhook}
            disabled={isLoading}
            className="w-full"
          >
            <Send className="h-4 w-4 mr-2" />
            {isLoading ? 'Enviando...' : 'Probar Webhook'}
          </Button>
        </div>

        <div className="text-xs text-muted-foreground bg-muted p-3 rounded">
          <strong>Nota:</strong> Este panel simula un callback de Dialfire. En producción, 
          Dialfire enviará estos datos automáticamente después de cada llamada.
        </div>
      </div>
    </Card>
  );
};
