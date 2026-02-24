import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Plus, Search, Trash2, Twitter } from "lucide-react";
import {
  useTwitterAccounts,
  useMonthlyUsageSummary,
  useAddTwitterAccount,
  useToggleTwitterAccount,
  useDeleteTwitterAccount,
  useRunTwitterSearch,
} from "@/hooks/useTwitterConfig";

const CATEGORY_COLORS: Record<string, string> = {
  gobierno: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  periodismo: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  monitoreo: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  seguridad: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  otro: "bg-muted text-muted-foreground",
};

export function TwitterAccountsManager() {
  const { data: accounts, isLoading } = useTwitterAccounts();
  const usage = useMonthlyUsageSummary();
  const addAccount = useAddTwitterAccount();
  const toggleAccount = useToggleTwitterAccount();
  const deleteAccount = useDeleteTwitterAccount();
  const runSearch = useRunTwitterSearch();

  const [newUsername, setNewUsername] = useState("");
  const [newDisplayName, setNewDisplayName] = useState("");
  const [newCategoria, setNewCategoria] = useState("otro");
  const [newNotas, setNewNotas] = useState("");

  const handleAdd = () => {
    if (!newUsername.trim()) return;
    addAccount.mutate(
      { username: newUsername, display_name: newDisplayName, categoria: newCategoria, notas: newNotas },
      {
        onSuccess: () => {
          setNewUsername("");
          setNewDisplayName("");
          setNewCategoria("otro");
          setNewNotas("");
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Consumo API */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Twitter className="h-5 w-5" />
            Consumo API de X.com — Mes Actual
          </CardTitle>
          <CardDescription>
            Basic tier: 10,000 tweets/mes ($200 USD). Costo por tweet: $0.02
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span>
              {usage.totalTweets.toLocaleString()} / {usage.limit.toLocaleString()} tweets leídos
            </span>
            <span className="font-semibold">${usage.estimatedCost.toFixed(2)} USD</span>
          </div>
          <Progress
            value={usage.usagePercent}
            className={usage.usagePercent >= 80 ? "[&>div]:bg-destructive" : ""}
          />
          {usage.usagePercent >= 80 && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4" />
              Consumo superior al 80% del límite mensual
            </div>
          )}
          {usage.wasRateLimited && (
            <div className="flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400">
              <AlertTriangle className="h-4 w-4" />
              Se detectó rate limiting en alguna ejecución este mes
            </div>
          )}
          <div className="grid grid-cols-3 gap-4 text-center text-sm">
            <div>
              <div className="text-2xl font-bold">{usage.totalInserted}</div>
              <div className="text-muted-foreground">Insertados</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{usage.totalQueries}</div>
              <div className="text-muted-foreground">Queries</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{usage.dailyUsage.length}</div>
              <div className="text-muted-foreground">Días activos</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cuentas monitoreadas */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Cuentas Monitoreadas</CardTitle>
            <CardDescription>
              Agrega o administra cuentas de X.com para el feed de inteligencia
            </CardDescription>
          </div>
          <Button onClick={() => runSearch.mutate()} disabled={runSearch.isPending} size="sm">
            <Search className="h-4 w-4 mr-1" />
            {runSearch.isPending ? "Buscando..." : "Ejecutar búsqueda"}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add form */}
          <div className="flex flex-wrap gap-2 items-end border rounded-lg p-3 bg-muted/30">
            <div className="flex-1 min-w-[140px]">
              <label className="text-xs text-muted-foreground">@username</label>
              <Input
                placeholder="GN_Carreteras"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
              />
            </div>
            <div className="flex-1 min-w-[140px]">
              <label className="text-xs text-muted-foreground">Nombre</label>
              <Input
                placeholder="Guardia Nacional"
                value={newDisplayName}
                onChange={(e) => setNewDisplayName(e.target.value)}
              />
            </div>
            <div className="w-[150px]">
              <label className="text-xs text-muted-foreground">Categoría</label>
              <Select value={newCategoria} onValueChange={setNewCategoria}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gobierno">Gobierno</SelectItem>
                  <SelectItem value="periodismo">Periodismo</SelectItem>
                  <SelectItem value="monitoreo">Monitoreo</SelectItem>
                  <SelectItem value="seguridad">Seguridad</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[140px]">
              <label className="text-xs text-muted-foreground">Notas</label>
              <Input
                placeholder="Opcional"
                value={newNotas}
                onChange={(e) => setNewNotas(e.target.value)}
              />
            </div>
            <Button onClick={handleAdd} disabled={!newUsername.trim() || addAccount.isPending}>
              <Plus className="h-4 w-4 mr-1" />
              Agregar
            </Button>
          </div>

          {/* Accounts table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cuenta</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Notas</TableHead>
                <TableHead className="text-center">Activa</TableHead>
                <TableHead className="w-[60px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Cargando...
                  </TableCell>
                </TableRow>
              ) : !accounts?.length ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No hay cuentas configuradas
                  </TableCell>
                </TableRow>
              ) : (
                accounts.map((acc) => (
                  <TableRow key={acc.id}>
                    <TableCell>
                      <div>
                        <span className="font-medium">@{acc.username}</span>
                        {acc.display_name && (
                          <span className="text-muted-foreground text-xs ml-2">{acc.display_name}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={CATEGORY_COLORS[acc.categoria] ?? ""}>
                        {acc.categoria}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                      {acc.notas || "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={acc.activa}
                        onCheckedChange={(checked) =>
                          toggleAccount.mutate({ id: acc.id, activa: checked })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteAccount.mutate(acc.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Historial diario */}
      {usage.dailyUsage.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Historial Diario de Consumo</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Leídos</TableHead>
                  <TableHead className="text-right">Insertados</TableHead>
                  <TableHead className="text-right">Duplicados</TableHead>
                  <TableHead className="text-right">Queries</TableHead>
                  <TableHead className="text-center">Rate Limited</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usage.dailyUsage.map((day) => (
                  <TableRow key={day.id}>
                    <TableCell>{day.fecha}</TableCell>
                    <TableCell className="text-right">{day.tweets_leidos}</TableCell>
                    <TableCell className="text-right">{day.tweets_insertados}</TableCell>
                    <TableCell className="text-right">{day.tweets_duplicados}</TableCell>
                    <TableCell className="text-right">{day.queries_ejecutadas}</TableCell>
                    <TableCell className="text-center">
                      {day.rate_limited ? (
                        <Badge variant="destructive" className="text-xs">Sí</Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">No</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
