import { useState, useCallback } from 'react';
import { ArrowLeft, Save, Variable, Eye } from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import Color from '@tiptap/extension-color';
import TextStyle from '@tiptap/extension-text-style';
import Link from '@tiptap/extension-link';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Image from '@tiptap/extension-image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useUpdatePlantilla,
  extractVariables,
  type PlantillaContrato,
} from '@/hooks/useLegalTemplates';
import { getDatosInterpolacion } from '@/hooks/useContratosCandidato';
import SafeHtml from '@/components/common/SafeHtml';

// Sample data for preview
const SAMPLE_DATA: Record<string, string> = getDatosInterpolacion({
  nombre: 'Juan Pérez García',
  email: 'juan@ejemplo.com',
  telefono: '55 1234 5678',
  direccion: 'Av. Reforma 123, CDMX',
  curp: 'PEGJ900101HDFRRL01',
  marca_vehiculo: 'Toyota',
  modelo_vehiculo: 'Hilux 2023',
  placas: 'ABC-123',
  banco: 'BBVA',
  clabe: '012345678901234567',
});

const AVAILABLE_VARIABLES = Object.keys(SAMPLE_DATA);

interface Props {
  plantilla: PlantillaContrato;
  onClose: () => void;
}

const TemplateEditor = ({ plantilla, onClose }: Props) => {
  const [changeDescription, setChangeDescription] = useState('');
  const [editorView, setEditorView] = useState<'editor' | 'preview'>('editor');
  const updatePlantilla = useUpdatePlantilla();

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Highlight,
      Color,
      TextStyle,
      Link.configure({ openOnClick: false }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      Image,
    ],
    content: plantilla.contenido_html,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none min-h-[400px] p-4 focus:outline-none',
      },
    },
  });

  const insertVariable = useCallback(
    (varName: string) => {
      editor?.chain().focus().insertContent(`{{${varName}}}`).run();
    },
    [editor]
  );

  const handleSave = async () => {
    if (!editor) return;
    const html = editor.getHTML();
    const vars = extractVariables(html);
    await updatePlantilla.mutateAsync({
      plantillaId: plantilla.id,
      contenidoHtml: html,
      variablesRequeridas: vars,
      changeDescription: changeDescription || 'Actualización de contenido',
    });
    onClose();
  };

  const getPreviewHtml = () => {
    if (!editor) return '';
    let html = editor.getHTML();
    AVAILABLE_VARIABLES.forEach((v) => {
      html = html.replace(
        new RegExp(`\\{\\{${v}\\}\\}`, 'g'),
        `<span style="color:hsl(var(--primary));font-weight:600">${SAMPLE_DATA[v] || v}</span>`
      );
    });
    return html;
  };

  const detectedVars = editor ? extractVariables(editor.getHTML()) : [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-lg font-semibold">{plantilla.nombre}</h2>
            <p className="text-xs text-muted-foreground">
              {plantilla.tipo_contrato} · v{plantilla.version || 1}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Descripción del cambio..."
            value={changeDescription}
            onChange={(e) => setChangeDescription(e.target.value)}
            className="w-64"
          />
          <Button onClick={handleSave} disabled={updatePlantilla.isPending} className="gap-1.5">
            <Save className="h-4 w-4" />
            {updatePlantilla.isPending ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Editor / Preview */}
        <div className="lg:col-span-3">
          <Tabs value={editorView} onValueChange={(v) => setEditorView(v as 'editor' | 'preview')}>
            <TabsList>
              <TabsTrigger value="editor">Editor</TabsTrigger>
              <TabsTrigger value="preview" className="gap-1.5">
                <Eye className="h-3.5 w-3.5" /> Preview
              </TabsTrigger>
            </TabsList>
            <TabsContent value="editor">
              <Card>
                <CardContent className="p-0">
                  <div className="border-b p-2 flex flex-wrap gap-1">
                    <Button size="sm" variant="ghost" onClick={() => editor?.chain().focus().toggleBold().run()} className={editor?.isActive('bold') ? 'bg-muted' : ''}>
                      <strong>B</strong>
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => editor?.chain().focus().toggleItalic().run()} className={editor?.isActive('italic') ? 'bg-muted' : ''}>
                      <em>I</em>
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => editor?.chain().focus().toggleUnderline().run()} className={editor?.isActive('underline') ? 'bg-muted' : ''}>
                      <u>U</u>
                    </Button>
                    <span className="w-px bg-border mx-1" />
                    <Button size="sm" variant="ghost" onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}>
                      H2
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}>
                      H3
                    </Button>
                    <span className="w-px bg-border mx-1" />
                    <Button size="sm" variant="ghost" onClick={() => editor?.chain().focus().toggleBulletList().run()}>
                      • Lista
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => editor?.chain().focus().toggleOrderedList().run()}>
                      1. Lista
                    </Button>
                  </div>
                  <EditorContent editor={editor} />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="preview">
              <Card>
                <CardContent className="p-6">
                  <SafeHtml content={getPreviewHtml()} className="prose prose-sm max-w-none" />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Variables sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-1.5">
                <Variable className="h-4 w-4" /> Variables detectadas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {detectedVars.length === 0 ? (
                <p className="text-xs text-muted-foreground">Sin variables</p>
              ) : (
                detectedVars.map((v) => (
                  <Badge key={v} variant="secondary" className="text-xs mr-1 mb-1">
                    {`{{${v}}}`}
                  </Badge>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Insertar variable</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 max-h-80 overflow-y-auto">
              {AVAILABLE_VARIABLES.map((v) => (
                <Button
                  key={v}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs h-7 font-mono"
                  onClick={() => insertVariable(v)}
                >
                  {`{{${v}}}`}
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TemplateEditor;
