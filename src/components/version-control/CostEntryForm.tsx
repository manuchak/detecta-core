import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";

interface CostEntryFormProps {
  onSubmit: (data: {
    entry_date: string;
    messages_count: number;
    estimated_cost_usd: number;
    participants: string[];
    category: string;
    notes?: string;
  }) => void;
  isLoading: boolean;
  costPerMessage: number;
}

export const CostEntryForm = ({ onSubmit, isLoading, costPerMessage }: CostEntryFormProps) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [messages, setMessages] = useState("");
  const [participants, setParticipants] = useState("Ricardo");
  const [category, setCategory] = useState("development");
  const [notes, setNotes] = useState("");

  const estimatedCost = messages ? Number(messages) * costPerMessage : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messages || Number(messages) <= 0) return;
    onSubmit({
      entry_date: date,
      messages_count: Number(messages),
      estimated_cost_usd: estimatedCost,
      participants: participants.split(",").map(p => p.trim()).filter(Boolean),
      category,
      notes: notes || undefined,
    });
    setMessages("");
    setNotes("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Registrar Entrada de Costo
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="date">Fecha</Label>
            <Input id="date" type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="messages">Mensajes</Label>
            <Input id="messages" type="number" min="1" placeholder="Ej: 25" value={messages} onChange={e => setMessages(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Costo Estimado</Label>
            <div className="flex h-9 items-center rounded-lg border border-input bg-muted px-3 text-sm font-medium">
              ${estimatedCost.toFixed(2)} USD
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="category">Categoría</Label>
            <select
              id="category"
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm"
            >
              <option value="development">Desarrollo</option>
              <option value="bugfix">Bugfix</option>
              <option value="maintenance">Mantenimiento</option>
            </select>
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="participants">Participantes (separados por coma)</Label>
            <Input id="participants" value={participants} onChange={e => setParticipants(e.target.value)} />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea id="notes" rows={1} placeholder="Descripción del trabajo..." value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
          <div className="lg:col-span-4 flex justify-end">
            <Button type="submit" disabled={isLoading || !messages}>
              <Plus className="w-4 h-4 mr-2" />
              Registrar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
