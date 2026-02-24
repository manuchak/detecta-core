import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Key, Plus, Search, Trash2, Twitter } from "lucide-react";
import {
  useTwitterAccounts,
  useMonthlyUsageSummary,
  useAddTwitterAccount,
  useToggleTwitterAccount,
  useDeleteTwitterAccount,
  useRunTwitterSearch,
  useTwitterKeywords,
  useAddTwitterKeyword,
  useToggleTwitterKeyword,
  useDeleteTwitterKeyword,
} from "@/hooks/useTwitterConfig";

const CATEGORY_COLORS: Record<string, string> = {
  gobierno: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  periodismo: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  monitoreo: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  seguridad: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  otro: "bg-muted text-muted-foreground",
};

const KW_CATEGORY_COLORS: Record<string, string> = {
  robo_carga: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  bloqueos: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  violencia_vial: "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200",
  accidentes: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  tecnologia_criminal: "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200",
  otro: "bg-muted text-muted-foreground",
};

const KW_CATEGORIES = [
  { value: "robo_carga", label: "Robo de carga" },
  { value: "bloqueos", label: "Bloqueos" },
  { value: "violencia_vial", label: "Violencia vial" },
  { value: "accidentes", label: "Accidentes" },
  { value: "tecnologia_criminal", label: "Tecnología criminal" },
  { value: "otro", label: "Otro" },
];

export function TwitterAccountsManager() {
  const { data: accounts, isLoading } = useTwitterAccounts();
  const usage = useMonthlyUsageSummary();
  const addAccount = useAddTwitterAccount();
  const toggleAccount = useToggleTwitterAccount();
  const deleteAccount = useDeleteTwitterAccount();
  const runSearch = useRunTwitterSearch();

  const { data: keywords, isLoading: kwLoading } = useTwitterKeywords();
  const addKeyword = useAddTwitterKeyword();
  const toggleKeyword = useToggleTwitterKeyword();
  const deleteKeyword = useDeleteTwitterKeyword();

  const [newUsername, setNewUsername] = useState("");
  const [newDisplayName, setNewDisplayName] = useState("");
  const [newCategoria, setNewCategoria] = useState("otro");
  const [newNotas, setNewNotas] = useState("");

  const [kwQuery, setKwQuery] = useState("");
  const [kwCategoria, setKwCategoria] = useState("otro");
  const [kwNotas, setKwNotas] = useState("");

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

  const handleAddKeyword = () => {
    if (!kwQuery.trim()) return;
    addKeyword.mutate(
      { query_text: kwQuery, categoria: kwCategoria, notas: kwNotas },
      {
        onSuccess: () => {
          setKwQuery("");
          setKwCategoria("otro");
          setKwNotas("");
        },
      }
    );
  };

  const activeKeywords = keywords?.filter((k) => k.activa).length ?? 0;

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

      {/* Palabras Clave de Búsqueda */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Palabras Clave de Búsqueda
              </CardTitle>
              <CardDescription>
                Frases que se buscan en X.com cada ciclo automático. Cada keyword genera una query a la API.
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-sm">
              {activeKeywords} activas
            </Badge>
          </div>
          {activeKeywords > 15 && (
            <div className="flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400 mt-2">
              <AlertTriangle className="h-4 w-4" />
              Muchas keywords activas pueden aumentar significativamente el consumo de API (~{activeKeywords * 25} tweets/ciclo)
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add keyword form */}
          <div className="flex flex-wrap gap-2 items-end border rounded-lg p-3 bg-muted/30">
            <div className="flex-[2] min-w-[200px]">
              <label className="text-xs text-muted-foreground">Frase de búsqueda</label>
              <Input
                placeholder='ej: robo trailer OR robo carga -is:retweet lang:es'
                value={kwQuery}
                onChange={(e) => setKwQuery(e.target.value)}
              />
            </div>
            <div className="w-[180px]">
              <label className="text-xs text-muted-foreground">Categoría</label>
              <Select value={kwCategoria} onValueChange={setKwCategoria}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {KW_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[140px]">
              <label className="text-xs text-muted-foreground">Notas</label>
              <Input
                placeholder="Descripción opcional"
                value={kwNotas}
                onChange={(e) => setKwNotas(e.target.value)}
              />
            </div>
            <Button onClick={handleAddKeyword} disabled={!kwQuery.trim() || addKeyword.isPending}>
              <Plus className="h-4 w-4 mr-1" />
              Agregar
            </Button>
          </div>

          {/* Keywords table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Query</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Notas</TableHead>
                <TableHead className="text-center">Activa</TableHead>
                <TableHead className="w-[60px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {kwLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Cargando...
                  </TableCell>
                </TableRow>
              ) : !keywords?.length ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No hay palabras clave configuradas
                  </TableCell>
                </TableRow>
              ) : (
                keywords.map((kw) => (
                  <TableRow key={kw.id}>
                    <TableCell className="font-mono text-xs max-w-[300px]">
                      <span className="break-all">{kw.query_text}</span>
                      {kw.es_predeterminada && (
                        <Badge variant="outline" className="ml-2 text-[10px] px-1.5 py-0">sistema</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={KW_CATEGORY_COLORS[kw.categoria] ?? KW_CATEGORY_COLORS.otro}>
                        {KW_CATEGORIES.find((c) => c.value === kw.categoria)?.label ?? kw.categoria}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                      {kw.notas || "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={kw.activa}
                        onCheckedChange={(checked) =>
                          toggleKeyword.mutate({ id: kw.id, activa: checked })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      {kw.es_predeterminada ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteKeyword.mutate(kw.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
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
