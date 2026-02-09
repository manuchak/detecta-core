import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, BookOpen } from 'lucide-react';
import { manualSections } from './manualContent';
import { ManualSection } from './ManualSection';

export const ManualFacturacionTab: React.FC = () => {
  const [search, setSearch] = useState('');
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const q = search.toLowerCase();

  const visibleSections = useMemo(() => {
    let sections = manualSections;

    if (activeSection) {
      sections = sections.filter(s => s.id === activeSection);
    }

    if (q) {
      sections = sections.filter(s =>
        s.title.toLowerCase().includes(q) ||
        s.articles.some(a =>
          a.question.toLowerCase().includes(q) ||
          a.answer.toLowerCase().includes(q) ||
          a.keywords.some(k => k.includes(q))
        )
      );
    }

    return sections;
  }, [q, activeSection]);

  const totalArticles = manualSections.reduce((acc, s) => acc + s.articles.length, 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-primary/10">
          <BookOpen className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Manual de Usuario</h2>
          <p className="text-xs text-muted-foreground">
            {manualSections.length} secciones · {totalArticles} artículos de ayuda
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar en el manual... (ej: pernocta, generar factura, aging)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Section chips */}
      <div className="flex flex-wrap gap-2">
        <Badge
          variant={activeSection === null ? 'default' : 'outline'}
          className="cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => setActiveSection(null)}
        >
          Todos
        </Badge>
        {manualSections.map((s) => {
          const Icon = s.icon;
          return (
            <Badge
              key={s.id}
              variant={activeSection === s.id ? 'default' : 'outline'}
              className="cursor-pointer hover:opacity-80 transition-opacity gap-1"
              onClick={() => setActiveSection(activeSection === s.id ? null : s.id)}
            >
              <Icon className="h-3 w-3" />
              {s.title.split('—')[0].trim()}
            </Badge>
          );
        })}
      </div>

      {/* Sections */}
      <div className="space-y-4">
        {visibleSections.length > 0 ? (
          visibleSections.map((section) => (
            <ManualSection key={section.id} section={section} searchQuery={search} />
          ))
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Search className="h-8 w-8 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No se encontraron resultados para "{search}"</p>
            <p className="text-xs mt-1">Intenta con otras palabras clave</p>
          </div>
        )}
      </div>
    </div>
  );
};
