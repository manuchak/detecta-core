import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TEMPLATE_VARIABLES, type DetectaTemplateName } from '@/types/kapso';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Send,
  Phone,
  User,
  FileText,
  Image,
  MapPin,
  MessageCircle,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Copy,
  Inbox,
  MessagesSquare,
  Database,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { normalizePhone } from '@/lib/phoneUtils';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

/* ─── Types ─── */

interface LogEntry {
  id: string;
  timestamp: Date;
  action: string;
  success: boolean;
  payload: any;
  response: any;
}

interface DbMessage {
  id: string;
  chat_id: string;
  message_text: string | null;
  message_type: string | null;
  is_from_bot: boolean;
  is_read: boolean;
  delivery_status: string | null;
  servicio_id: string | null;
  sent_by_user_id: string | null;
  media_url: string | null;
  created_at: string;
}

/* ─── Template definitions (loaded from DB) ─── */

interface TemplateDefinition {
  name: string;
  label: string;
  category: string;
  variable_count: number;
  params: Array<{ key: string; label: string; default: string }>;
}

/* ─── Main Component ─── */

export const CommTestPanel: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [servicioId, setServicioId] = useState('');

  const normalizedPhone = phone ? normalizePhone(phone) : '';

  const addLog = (action: string, success: boolean, payload: any, response: any) => {
    setLogs(prev => [{
      id: crypto.randomUUID(),
      timestamp: new Date(),
      action,
      success,
      payload,
      response,
    }, ...prev]);
  };

  // Load current user phone
  const handleUseMyPhone = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error('No autenticado'); return; }
    const { data: profile } = await supabase
      .from('profiles')
      .select('phone')
      .eq('id', user.id)
      .single();
    if (profile?.phone) {
      setPhone(profile.phone);
      toast.success(`Teléfono cargado: ${profile.phone}`);
    } else {
      toast.error('No tienes teléfono registrado en tu perfil');
    }
  };

  return (
    <div className="space-y-6">
      {/* ─── Phone Config ─── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Phone className="h-5 w-5 text-primary" />
            Configuración de Destino
          </CardTitle>
          <CardDescription>Número al que se enviarán los mensajes de prueba</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 items-end">
            <div className="flex-1 space-y-1.5">
              <label className="text-xs text-muted-foreground font-medium">Teléfono destino</label>
              <Input
                placeholder="52 1 614 123 4567"
                value={phone}
                onChange={e => setPhone(e.target.value)}
              />
            </div>
            <Button variant="outline" size="sm" onClick={handleUseMyPhone}>
              <User className="h-3.5 w-3.5 mr-1.5" />
              Mi número
            </Button>
          </div>
          {normalizedPhone && (
            <div className="mt-2 flex items-center gap-2">
              <Badge variant="secondary" className="font-mono text-xs">
                Normalizado: {normalizedPhone}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Sub-tabs ─── */}
      <Tabs defaultValue="send" className="space-y-4">
        <TabsList>
          <TabsTrigger value="send" className="gap-1.5">
            <Send className="h-3.5 w-3.5" /> Envío
          </TabsTrigger>
          <TabsTrigger value="template" className="gap-1.5">
            <FileText className="h-3.5 w-3.5" /> Templates
          </TabsTrigger>
          <TabsTrigger value="receive" className="gap-1.5">
            <Inbox className="h-3.5 w-3.5" /> Recepción
          </TabsTrigger>
          <TabsTrigger value="conversation" className="gap-1.5">
            <MessagesSquare className="h-3.5 w-3.5" /> Conversación
          </TabsTrigger>
          <TabsTrigger value="persistence" className="gap-1.5">
            <Database className="h-3.5 w-3.5" /> Persistencia
          </TabsTrigger>
        </TabsList>

        {/* ─── Tab: Send ─── */}
        <TabsContent value="send">
          <SendTestSection phone={normalizedPhone} servicioId={servicioId} onLog={addLog} />
        </TabsContent>

        {/* ─── Tab: Templates ─── */}
        <TabsContent value="template">
          <TemplateTestSection phone={normalizedPhone} servicioId={servicioId} onLog={addLog} />
        </TabsContent>

        {/* ─── Tab: Receive ─── */}
        <TabsContent value="receive">
          <ReceiveSimSection phone={normalizedPhone} servicioId={servicioId} setServicioId={setServicioId} onLog={addLog} />
        </TabsContent>

        {/* ─── Tab: Conversation ─── */}
        <TabsContent value="conversation">
          <ConversationSection phone={normalizedPhone} servicioId={servicioId} onLog={addLog} />
        </TabsContent>

        {/* ─── Tab: Persistence ─── */}
        <TabsContent value="persistence">
          <PersistenceSection phone={normalizedPhone} />
        </TabsContent>
      </Tabs>

      {/* ─── Activity Log ─── */}
      {logs.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Log de Actividad ({logs.length})</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setLogs([])}>Limpiar</Button>
            </div>
          </CardHeader>
          <CardContent className="max-h-[300px] overflow-auto space-y-2">
            {logs.map(log => (
              <LogItem key={log.id} log={log} />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   SUB-SECTIONS
   ═══════════════════════════════════════════════════════ */

/* ─── Send Test ─── */

const SendTestSection: React.FC<{
  phone: string;
  servicioId: string;
  onLog: (action: string, success: boolean, payload: any, response: any) => void;
}> = ({ phone, servicioId, onLog }) => {
  const [msgType, setMsgType] = useState<'text' | 'image' | 'document'>('text');
  const [text, setText] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!phone) { toast.error('Configura un teléfono destino'); return; }
    if (msgType === 'text' && !text.trim()) { toast.error('Escribe un mensaje'); return; }
    if (msgType !== 'text' && !mediaUrl.trim()) { toast.error('Proporciona una URL de media'); return; }

    setSending(true);
    const { data: { user } } = await supabase.auth.getUser();
    const payload: any = {
      to: phone,
      type: msgType,
      sent_by_user_id: user?.id || null,
      context: servicioId ? { servicio_id: servicioId } : undefined,
    };
    if (msgType === 'text') {
      payload.text = text;
    } else {
      payload.mediaUrl = mediaUrl;
      if (text) payload.caption = text;
    }

    try {
      const { data, error } = await supabase.functions.invoke('kapso-send-message', { body: payload });
      if (error) throw error;
      onLog(`Envío ${msgType}`, true, payload, data);
      toast.success('Mensaje enviado');
      setText('');
      setMediaUrl('');
    } catch (err: any) {
      onLog(`Envío ${msgType}`, false, payload, err.message);
      toast.error(`Error: ${err.message}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Mensaje Libre</CardTitle>
        <CardDescription>Envía un mensaje real vía kapso-send-message</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Select value={msgType} onValueChange={(v: any) => setMsgType(v)}>
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">Texto</SelectItem>
              <SelectItem value="image">Imagen</SelectItem>
              <SelectItem value="document">Documento</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {msgType !== 'text' && (
          <Input
            placeholder="URL de la imagen o documento"
            value={mediaUrl}
            onChange={e => setMediaUrl(e.target.value)}
          />
        )}

        <Textarea
          placeholder={msgType === 'text' ? 'Escribe tu mensaje...' : 'Caption (opcional)'}
          value={text}
          onChange={e => setText(e.target.value)}
          rows={3}
        />

        <Button onClick={handleSend} disabled={sending || !phone} className="w-full">
          {sending ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
          Enviar Mensaje
        </Button>
      </CardContent>
    </Card>
  );
};

/* ─── Template Test ─── */

const TemplateTestSection: React.FC<{
  phone: string;
  servicioId: string;
  onLog: (action: string, success: boolean, payload: any, response: any) => void;
}> = ({ phone, servicioId, onLog }) => {
  const [templates, setTemplates] = useState<TemplateDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [params, setParams] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [showPayload, setShowPayload] = useState(false);

  // Fetch approved templates from DB
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const { data, error } = await supabase
          .from('whatsapp_templates')
          .select('name, content, category, variable_count, meta_status, is_active')
          .eq('meta_status', 'approved')
          .eq('is_active', true)
          .order('category')
          .order('name');

        if (error) throw error;

        const mapped: TemplateDefinition[] = (data || []).map((t: any) => {
          const vars = TEMPLATE_VARIABLES[t.name as DetectaTemplateName] || [];
          return {
            name: t.name,
            label: t.name.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
            category: t.category,
            variable_count: t.variable_count,
            params: vars.map(v => ({
              key: v,
              label: v.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
              default: `Test ${v}`,
            })),
          };
        });

        setTemplates(mapped);
        if (mapped.length > 0) setSelectedTemplate(mapped[0].name);
      } catch (err) {
        console.error('Error fetching templates:', err);
        toast.error('Error al cargar templates aprobados');
      } finally {
        setLoading(false);
      }
    };
    fetchTemplates();
  }, []);

  const template = templates.find(t => t.name === selectedTemplate);

  // Reset params when template changes
  useEffect(() => {
    if (!template) return;
    const defaults: Record<string, string> = {};
    template.params.forEach(p => { defaults[p.key] = p.default; });
    setParams(defaults);
  }, [selectedTemplate, template]);

  const buildPayload = () => {
    if (!template) return {};
    const parameters = template.params.map(p => ({
      type: 'text' as const,
      text: params[p.key] || p.default,
    }));
    return {
      to: phone,
      templateName: template.name,
      languageCode: 'es_MX',
      components: { body: { parameters } },
      context: servicioId ? { servicio_id: servicioId } : undefined,
    };
  };

  const handleSend = async () => {
    if (!phone) { toast.error('Configura un teléfono destino'); return; }
    if (!template) return;
    setSending(true);
    const { data: { user } } = await supabase.auth.getUser();
    const payload = { ...buildPayload(), sent_by_user_id: user?.id || null };

    try {
      const { data, error } = await supabase.functions.invoke('kapso-send-template', { body: payload });
      if (error) throw error;
      onLog(`Template: ${template.name}`, true, payload, data);
      toast.success('Template enviado');
    } catch (err: any) {
      onLog(`Template: ${template.name}`, false, payload, err.message);
      toast.error(`Error: ${err.message}`);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Prueba de Templates</CardTitle>
          <CardDescription>Cargando templates aprobados...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (templates.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Prueba de Templates</CardTitle>
          <CardDescription>No hay templates aprobados disponibles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <FileText className="h-10 w-10 mb-3" />
            <p className="text-sm">No se encontraron templates con status "approved" y activos</p>
            <p className="text-xs mt-1">Ve a Configuración → Kapso → Templates para aprobar templates</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group templates by category for the select
  const grouped = templates.reduce((acc, t) => {
    if (!acc[t.category]) acc[t.category] = [];
    acc[t.category].push(t);
    return acc;
  }, {} as Record<string, TemplateDefinition[]>);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Prueba de Templates</CardTitle>
        <CardDescription>
          Envía templates aprobados vía kapso-send-template ({templates.length} disponibles)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona un template" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(grouped).map(([category, catTemplates]) => (
              <SelectGroup key={category}>
                <SelectLabel className="text-xs uppercase text-muted-foreground">{category}</SelectLabel>
                {catTemplates.map(t => (
                  <SelectItem key={t.name} value={t.name}>{t.label}</SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>

        {template && (
          <Badge variant="outline" className="text-xs">
            {template.variable_count} variables · {template.category}
          </Badge>
        )}

        {template?.params.map(p => (
          <div key={p.key} className="space-y-1">
            <label className="text-xs text-muted-foreground font-medium">{p.label}</label>
            <Input
              value={params[p.key] || ''}
              onChange={e => setParams(prev => ({ ...prev, [p.key]: e.target.value }))}
              placeholder={p.default}
            />
          </div>
        ))}

        <button
          onClick={() => setShowPayload(!showPayload)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {showPayload ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          Vista previa del payload
        </button>
        {showPayload && (
          <pre className="text-[10px] bg-muted/50 border border-border/50 rounded-lg p-3 overflow-auto max-h-[200px] font-mono">
            {JSON.stringify(buildPayload(), null, 2)}
          </pre>
        )}

        <Button onClick={handleSend} disabled={sending || !phone || !template} className="w-full">
          {sending ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <FileText className="h-4 w-4 mr-2" />}
          Enviar Template
        </Button>
      </CardContent>
    </Card>
  );
};

/* ─── Receive Simulator ─── */

const ReceiveSimSection: React.FC<{
  phone: string;
  servicioId: string;
  setServicioId: (id: string) => void;
  onLog: (action: string, success: boolean, payload: any, response: any) => void;
}> = ({ phone, servicioId, setServicioId, onLog }) => {
  const [text, setText] = useState('');
  const [simMsgType, setSimMsgType] = useState<'text' | 'image' | 'location'>('text');
  const [simMediaUrl, setSimMediaUrl] = useState('');
  const [inserting, setInserting] = useState(false);

  const handleSimulate = async () => {
    if (!phone) { toast.error('Configura un teléfono destino'); return; }
    if (simMsgType === 'text' && !text.trim()) { toast.error('Escribe el texto simulado'); return; }

    setInserting(true);
    const record: any = {
      chat_id: phone,
      message_text: text || null,
      message_type: simMsgType,
      is_from_bot: false,
      is_read: false,
      delivery_status: 'delivered',
      servicio_id: servicioId || null,
      sent_by_user_id: null,
      media_url: simMediaUrl || null,
    };

    try {
      const { data, error } = await supabase
        .from('whatsapp_messages')
        .insert(record as any)
        .select()
        .single();
      if (error) throw error;
      onLog('Simular recepción', true, record, data);
      toast.success('Mensaje entrante simulado — verifica el chat del servicio');
      setText('');
      setSimMediaUrl('');
    } catch (err: any) {
      onLog('Simular recepción', false, record, err.message);
      toast.error(`Error: ${err.message}`);
    } finally {
      setInserting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Simulador de Mensaje Entrante</CardTitle>
        <CardDescription>
          Inserta directamente en whatsapp_messages con is_from_bot=false, simulando una respuesta del custodio
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground font-medium">Servicio ID (UUID, opcional)</label>
          <Input
            placeholder="UUID del servicio para vincular al chat"
            value={servicioId}
            onChange={e => setServicioId(e.target.value)}
            className="font-mono text-xs"
          />
        </div>

        <Select value={simMsgType} onValueChange={(v: any) => setSimMsgType(v)}>
          <SelectTrigger className="w-[130px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="text">Texto</SelectItem>
            <SelectItem value="image">Imagen</SelectItem>
            <SelectItem value="location">Ubicación</SelectItem>
          </SelectContent>
        </Select>

        {simMsgType !== 'text' && (
          <Input
            placeholder="URL de media (imagen, etc.)"
            value={simMediaUrl}
            onChange={e => setSimMediaUrl(e.target.value)}
          />
        )}

        <Textarea
          placeholder="Texto del mensaje entrante simulado..."
          value={text}
          onChange={e => setText(e.target.value)}
          rows={3}
        />

        <Button onClick={handleSimulate} disabled={inserting || !phone} variant="secondary" className="w-full">
          {inserting ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Inbox className="h-4 w-4 mr-2" />}
          Simular Mensaje Entrante
        </Button>
      </CardContent>
    </Card>
  );
};

/* ─── Conversation View ─── */

const ConversationSection: React.FC<{
  phone: string;
  servicioId: string;
  onLog: (action: string, success: boolean, payload: any, response: any) => void;
}> = ({ phone, servicioId, onLog }) => {
  const [messages, setMessages] = useState<DbMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [quickText, setQuickText] = useState('');
  const [sendingAs, setSendingAs] = useState<'monitorista' | 'custodio'>('monitorista');
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    if (!phone) return;
    setLoading(true);
    let query = supabase
      .from('whatsapp_messages')
      .select('id, chat_id, message_text, message_type, is_from_bot, is_read, delivery_status, servicio_id, sent_by_user_id, media_url, created_at')
      .in('chat_id', [phone, `52${phone}`])
      .order('created_at', { ascending: true })
      .limit(50);
    if (servicioId) query = query.or(`servicio_id.eq.${servicioId},servicio_id.is.null`);
    const { data, error } = await query;
    if (!error) setMessages((data || []) as DbMessage[]);
    setLoading(false);
  };

  useEffect(() => { fetchMessages(); }, [phone, servicioId]);

  // Realtime
  useEffect(() => {
    if (!phone) return;
    const channel = supabase
      .channel(`comm-test-${phone}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'whatsapp_messages',
        filter: `chat_id=eq.52${phone}`,
      }, () => { fetchMessages(); })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'whatsapp_messages',
        filter: `chat_id=eq.${phone}`,
      }, () => { fetchMessages(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [phone, servicioId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleQuickSend = async () => {
    if (!quickText.trim() || !phone) return;
    const { data: { user } } = await supabase.auth.getUser();

    if (sendingAs === 'monitorista') {
      // Real edge function
      const payload = {
        to: phone,
        type: 'text',
        text: quickText,
        sent_by_user_id: user?.id || null,
        context: servicioId ? { servicio_id: servicioId } : undefined,
      };
      const { data, error } = await supabase.functions.invoke('kapso-send-message', { body: payload });
      onLog('Conv → Monitorista', !error, payload, error ? error.message : data);
    } else {
      // Direct insert
      const record: any = {
        chat_id: `521${phone}`,
        message_text: quickText,
        message_type: 'text',
        is_from_bot: false,
        is_read: false,
        delivery_status: 'delivered',
        servicio_id: servicioId || null,
        sent_by_user_id: null,
        media_url: null,
      };
      const { data, error } = await supabase.from('whatsapp_messages').insert(record as any).select().single();
      onLog('Conv → Custodio (sim)', !error, record, error ? error.message : data);
    }
    setQuickText('');
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Vista de Conversación</CardTitle>
          <Button variant="ghost" size="sm" onClick={fetchMessages}>
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          </Button>
        </div>
        <CardDescription>
          Chat bidireccional en tiempo real — alterna entre enviar como monitorista o simular custodio
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Chat area */}
        <div ref={scrollRef} className="h-[350px] overflow-auto rounded-lg border border-border/50 bg-muted/20 p-3 space-y-2">
          {loading && <Skeleton className="h-8 w-3/4" />}
          {!loading && messages.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-10">
              Sin mensajes. Envía uno para comenzar.
            </p>
          )}
          {messages.map(msg => (
            <div
              key={msg.id}
              className={cn(
                'max-w-[80%] rounded-2xl px-3 py-2 text-sm',
                msg.is_from_bot
                  ? 'ml-auto bg-primary text-primary-foreground rounded-br-md'
                  : 'mr-auto bg-secondary text-secondary-foreground rounded-bl-md'
              )}
            >
              <p className="break-words">{msg.message_text || `[${msg.message_type}]`}</p>
              {msg.media_url && (
                <a href={msg.media_url} target="_blank" rel="noopener" className="text-[10px] underline opacity-70 block mt-1">
                  📎 Ver media
                </a>
              )}
              <div className="flex items-center gap-1.5 mt-1 opacity-60">
                <span className="text-[9px]">{format(new Date(msg.created_at), 'HH:mm:ss')}</span>
                {msg.is_from_bot && (
                  <Badge variant="outline" className="text-[8px] h-3 px-1">
                    {msg.sent_by_user_id ? 'monitorista' : 'bot'}
                  </Badge>
                )}
                {msg.delivery_status && (
                  <span className="text-[9px]">{msg.delivery_status}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Quick send */}
        <div className="flex gap-2">
          <Select value={sendingAs} onValueChange={(v: any) => setSendingAs(v)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monitorista">🔵 Monitorista</SelectItem>
              <SelectItem value="custodio">⚪ Custodio (sim)</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="Escribe un mensaje..."
            value={quickText}
            onChange={e => setQuickText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleQuickSend(); } }}
            className="flex-1"
          />
          <Button size="icon" onClick={handleQuickSend} disabled={!quickText.trim() || !phone}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

/* ─── Persistence Verifier ─── */

const PersistenceSection: React.FC<{ phone: string }> = ({ phone }) => {
  const [rows, setRows] = useState<DbMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRows = async () => {
    if (!phone) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('whatsapp_messages')
      .select('id, chat_id, message_text, message_type, is_from_bot, is_read, delivery_status, servicio_id, sent_by_user_id, media_url, created_at')
      .in('chat_id', [phone, `521${phone}`])
      .order('created_at', { ascending: false })
      .limit(20);
    if (!error) setRows((data || []) as DbMessage[]);
    setLoading(false);
  };

  useEffect(() => { fetchRows(); }, [phone]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Verificación de Persistencia</CardTitle>
          <Button variant="outline" size="sm" onClick={fetchRows} disabled={!phone}>
            <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", loading && "animate-spin")} />
            Refrescar
          </Button>
        </div>
        <CardDescription>
          Últimos 20 registros de whatsapp_messages para chat_id = {phone || '(sin configurar)'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-auto max-h-[400px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[10px] w-[60px]">Tipo</TableHead>
                <TableHead className="text-[10px]">Texto</TableHead>
                <TableHead className="text-[10px] w-[50px]">Bot</TableHead>
                <TableHead className="text-[10px] w-[50px]">Read</TableHead>
                <TableHead className="text-[10px] w-[70px]">Status</TableHead>
                <TableHead className="text-[10px] w-[70px]">Serv ID</TableHead>
                <TableHead className="text-[10px] w-[70px]">User ID</TableHead>
                <TableHead className="text-[10px] w-[70px]">Hora</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 8 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-3 w-12" /></TableCell>
                  ))}
                </TableRow>
              ))}
              {!loading && rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground text-xs py-6">
                    Sin registros
                  </TableCell>
                </TableRow>
              )}
              {!loading && rows.map(r => (
                <TableRow key={r.id} className="text-[10px]">
                  <TableCell>
                    <Badge variant="outline" className="text-[9px]">{r.message_type}</Badge>
                  </TableCell>
                  <TableCell className="max-w-[150px] truncate">{r.message_text || '—'}</TableCell>
                  <TableCell>{r.is_from_bot ? '✅' : '❌'}</TableCell>
                  <TableCell>{r.is_read ? '✅' : '❌'}</TableCell>
                  <TableCell>{r.delivery_status || '—'}</TableCell>
                  <TableCell className="font-mono">{r.servicio_id ? r.servicio_id.slice(0, 8) + '…' : '—'}</TableCell>
                  <TableCell className="font-mono">{r.sent_by_user_id ? r.sent_by_user_id.slice(0, 8) + '…' : '—'}</TableCell>
                  <TableCell>{format(new Date(r.created_at), 'HH:mm:ss')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

/* ─── Log Item ─── */

const LogItem: React.FC<{ log: LogEntry }> = ({ log }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={cn(
      'rounded-lg border p-2.5 text-xs',
      log.success ? 'border-chart-2/30 bg-chart-2/5' : 'border-destructive/30 bg-destructive/5'
    )}>
      <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-2">
          {log.success ? <CheckCircle2 className="h-3.5 w-3.5 text-chart-2" /> : <XCircle className="h-3.5 w-3.5 text-destructive" />}
          <span className="font-medium">{log.action}</span>
        </div>
        <span className="text-muted-foreground text-[10px]">{format(log.timestamp, 'HH:mm:ss')}</span>
      </div>
      {expanded && (
        <div className="mt-2 space-y-1">
          <p className="text-[10px] text-muted-foreground font-medium">Payload:</p>
          <pre className="text-[9px] bg-muted/50 rounded p-2 overflow-auto max-h-[150px] font-mono">
            {JSON.stringify(log.payload, null, 2)}
          </pre>
          <p className="text-[10px] text-muted-foreground font-medium">Response:</p>
          <pre className="text-[9px] bg-muted/50 rounded p-2 overflow-auto max-h-[150px] font-mono">
            {JSON.stringify(log.response, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};
