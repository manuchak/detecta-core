import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DollarSign, MessageSquare, Users, TrendingUp, Settings } from "lucide-react";
import { useProjectCosts } from "@/hooks/useProjectCosts";
import { CostEntryForm } from "./CostEntryForm";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

export const ProjectCostTracker = () => {
  const [costPerMessage, setCostPerMessage] = useState(0.25);
  const {
    costEntries, isLoading, addEntry,
    totalCost, totalMessages, uniqueParticipants, avgDailyCost,
    accumulatedCostData, messagesByVersion,
  } = useProjectCosts();

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Cargando costos...</div>;
  }

  const kpis = [
    { label: "Costo Total", value: `$${totalCost.toFixed(2)}`, sub: "USD estimado", icon: DollarSign, color: "text-emerald-500" },
    { label: "Mensajes Totales", value: totalMessages.toLocaleString(), sub: "mensajes de Lovable", icon: MessageSquare, color: "text-blue-500" },
    { label: "Participantes", value: uniqueParticipants.length, sub: uniqueParticipants.join(", "), icon: Users, color: "text-violet-500" },
    { label: "Promedio Diario", value: `$${avgDailyCost.toFixed(2)}`, sub: "USD / día", icon: TrendingUp, color: "text-amber-500" },
  ];

  return (
    <div className="space-y-6">
      {/* Config */}
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <Settings className="w-4 h-4" />
        <Label htmlFor="cpm" className="text-xs">Costo por mensaje:</Label>
        <Input
          id="cpm"
          type="number"
          step="0.01"
          min="0.01"
          className="w-24 h-7 text-xs"
          value={costPerMessage}
          onChange={e => setCostPerMessage(Number(e.target.value) || 0.25)}
        />
        <span className="text-xs">USD</span>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {kpis.map(kpi => (
          <Card key={kpi.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">{kpi.label}</span>
                <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
              </div>
              <div className="text-2xl font-bold">{kpi.value}</div>
              <p className="text-xs text-muted-foreground truncate">{kpi.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Costo Acumulado</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={accumulatedCostData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="version" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `$${v}`} />
                <Tooltip formatter={(v: number) => [`$${v.toFixed(2)}`, '']} />
                <Line type="monotone" dataKey="costo_acumulado" stroke="hsl(var(--primary))" strokeWidth={2} name="Acumulado" dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Mensajes por Versión</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={messagesByVersion}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="version" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="mensajes" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Mensajes" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Desglose por Versión</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Versión</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead className="text-right">Mensajes</TableHead>
                <TableHead className="text-right">Costo USD</TableHead>
                <TableHead>Participantes</TableHead>
                <TableHead>Notas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {costEntries?.map(entry => (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium text-xs">
                    {entry.version_number || '—'}
                    {entry.version_name && <span className="text-muted-foreground ml-1">({entry.version_name})</span>}
                  </TableCell>
                  <TableCell className="text-xs">{entry.entry_date}</TableCell>
                  <TableCell>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      entry.category === 'development' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                      entry.category === 'bugfix' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                      'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                    }`}>
                      {entry.category}
                    </span>
                  </TableCell>
                  <TableCell className="text-right text-xs">{entry.messages_count.toLocaleString()}</TableCell>
                  <TableCell className="text-right text-xs font-medium">${Number(entry.estimated_cost_usd).toFixed(2)}</TableCell>
                  <TableCell className="text-xs">{entry.participants?.join(", ")}</TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{entry.notes}</TableCell>
                </TableRow>
              ))}
              {/* Total row */}
              <TableRow className="font-bold border-t-2">
                <TableCell>TOTAL</TableCell>
                <TableCell />
                <TableCell />
                <TableCell className="text-right">{totalMessages.toLocaleString()}</TableCell>
                <TableCell className="text-right">${totalCost.toFixed(2)}</TableCell>
                <TableCell>{uniqueParticipants.length} participante(s)</TableCell>
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Form */}
      <CostEntryForm
        onSubmit={data => addEntry.mutateAsync(data)}
        isLoading={addEntry.isPending}
        costPerMessage={costPerMessage}
      />
    </div>
  );
};
