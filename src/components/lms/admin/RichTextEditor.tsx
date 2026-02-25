import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import ImageExt from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect, useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Heading1, Heading2, Heading3,
  AlignLeft, AlignCenter, AlignRight,
  List, ListOrdered, Quote, Minus,
  Link as LinkIcon, Image, Table as TableIcon,
  RemoveFormatting, Sparkles, Loader2,
  Palette, Highlighter,
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  onGenerateAI?: () => void;
  aiLoading?: boolean;
  placeholder?: string;
}

const COLORS = [
  '#000000', '#434343', '#666666', '#999999',
  '#b7b7b7', '#dc2626', '#ea580c', '#d97706',
  '#65a30d', '#16a34a', '#0891b2', '#2563eb',
  '#7c3aed', '#c026d3', '#e11d48', '#0d9488',
];

function ToolbarButton({ 
  onClick, active, disabled, children, title 
}: { 
  onClick: () => void; active?: boolean; disabled?: boolean; children: React.ReactNode; title?: string 
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        'p-1.5 rounded-md transition-colors disabled:opacity-40',
        active 
          ? 'bg-primary/10 text-primary' 
          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
      )}
    >
      {children}
    </button>
  );
}

export function RichTextEditor({ value, onChange, onGenerateAI, aiLoading, placeholder }: RichTextEditorProps) {
  const [linkUrl, setLinkUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      ImageExt.configure({ inline: false, allowBase64: true }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'text-primary underline underline-offset-2' } }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Table.configure({ resizable: false }),
      TableRow,
      TableCell,
      TableHeader,
      Placeholder.configure({ placeholder: placeholder || 'Escribe el contenido aquí...' }),
    ],
    content: value || '',
    onUpdate: ({ editor: e }) => {
      onChange(e.getHTML());
    },
  });

  // Sync external value changes (e.g. AI generation)
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '', false);
    }
  }, [value, editor]);

  const setLink = useCallback(() => {
    if (!editor || !linkUrl) return;
    editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
    setLinkUrl('');
  }, [editor, linkUrl]);

  const insertImage = useCallback(() => {
    if (!editor || !imageUrl) return;
    editor.chain().focus().setImage({ src: imageUrl }).run();
    setImageUrl('');
  }, [editor, imageUrl]);

  if (!editor) return null;

  return (
    <div className="border rounded-lg overflow-hidden bg-background">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 p-1.5 border-b bg-muted/30">
        {/* Headings */}
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="Título 1">
          <Heading1 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Título 2">
          <Heading2 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Título 3">
          <Heading3 className="w-4 h-4" />
        </ToolbarButton>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Inline formatting */}
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Negrita">
          <Bold className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Cursiva">
          <Italic className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Subrayado">
          <UnderlineIcon className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Tachado">
          <Strikethrough className="w-4 h-4" />
        </ToolbarButton>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Color */}
        <Popover>
          <PopoverTrigger asChild>
            <button type="button" title="Color de texto" className="p-1.5 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
              <Palette className="w-4 h-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" align="start">
            <div className="grid grid-cols-4 gap-1">
              {COLORS.map(c => (
                <button key={c} type="button" onClick={() => editor.chain().focus().setColor(c).run()} className="w-6 h-6 rounded-full border border-border hover:scale-110 transition-transform" style={{ backgroundColor: c }} />
              ))}
            </div>
            <button type="button" onClick={() => editor.chain().focus().unsetColor().run()} className="mt-2 text-xs text-muted-foreground hover:text-foreground w-full text-center">
              Quitar color
            </button>
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <button type="button" title="Resaltado" className={cn("p-1.5 rounded-md transition-colors", editor.isActive('highlight') ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground')}>
              <Highlighter className="w-4 h-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" align="start">
            <div className="grid grid-cols-4 gap-1">
              {['#fef08a', '#bbf7d0', '#bfdbfe', '#e9d5ff', '#fecaca', '#fed7aa', '#d1fae5', '#dbeafe'].map(c => (
                <button key={c} type="button" onClick={() => editor.chain().focus().toggleHighlight({ color: c }).run()} className="w-6 h-6 rounded border border-border hover:scale-110 transition-transform" style={{ backgroundColor: c }} />
              ))}
            </div>
            <button type="button" onClick={() => editor.chain().focus().unsetHighlight().run()} className="mt-2 text-xs text-muted-foreground hover:text-foreground w-full text-center">
              Quitar resaltado
            </button>
          </PopoverContent>
        </Popover>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Alignment */}
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Alinear izquierda">
          <AlignLeft className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Centrar">
          <AlignCenter className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Alinear derecha">
          <AlignRight className="w-4 h-4" />
        </ToolbarButton>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Lists & blocks */}
        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Lista con viñetas">
          <List className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Lista numerada">
          <ListOrdered className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Cita">
          <Quote className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Separador">
          <Minus className="w-4 h-4" />
        </ToolbarButton>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Link */}
        <Popover>
          <PopoverTrigger asChild>
            <button type="button" title="Insertar enlace" className={cn("p-1.5 rounded-md transition-colors", editor.isActive('link') ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground')}>
              <LinkIcon className="w-4 h-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-3 space-y-2" align="start">
            <Input placeholder="https://..." value={linkUrl} onChange={e => setLinkUrl(e.target.value)} className="h-8 text-sm" onKeyDown={e => e.key === 'Enter' && setLink()} />
            <div className="flex gap-2">
              <Button size="sm" className="h-7 text-xs flex-1" onClick={setLink}>Insertar</Button>
              {editor.isActive('link') && (
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => editor.chain().focus().unsetLink().run()}>Quitar</Button>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Image */}
        <Popover>
          <PopoverTrigger asChild>
            <button type="button" title="Insertar imagen" className="p-1.5 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
              <Image className="w-4 h-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-3 space-y-2" align="start">
            <Input placeholder="URL de la imagen..." value={imageUrl} onChange={e => setImageUrl(e.target.value)} className="h-8 text-sm" onKeyDown={e => e.key === 'Enter' && insertImage()} />
            <Button size="sm" className="h-7 text-xs w-full" onClick={insertImage}>Insertar imagen</Button>
          </PopoverContent>
        </Popover>

        {/* Table */}
        <ToolbarButton onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} title="Insertar tabla">
          <TableIcon className="w-4 h-4" />
        </ToolbarButton>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Clear formatting */}
        <ToolbarButton onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()} title="Limpiar formato">
          <RemoveFormatting className="w-4 h-4" />
        </ToolbarButton>

        {/* AI Generate */}
        {onGenerateAI && (
          <>
            <div className="flex-1" />
            <Button type="button" variant="outline" size="sm" onClick={onGenerateAI} disabled={aiLoading} className="h-7 text-xs gap-1">
              {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
              Generar con IA
            </Button>
          </>
        )}
      </div>

      {/* Editor content */}
      <EditorContent editor={editor} className="rich-text-editor-content" />
    </div>
  );
}
