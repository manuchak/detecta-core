import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lightbulb } from 'lucide-react';
import type { ManualSection as ManualSectionType } from './manualContent';

interface ManualSectionProps {
  section: ManualSectionType;
  searchQuery: string;
}

export const ManualSection: React.FC<ManualSectionProps> = ({ section, searchQuery }) => {
  const Icon = section.icon;
  const q = searchQuery.toLowerCase();

  const filteredArticles = q
    ? section.articles.filter(a =>
        a.question.toLowerCase().includes(q) ||
        a.answer.toLowerCase().includes(q) ||
        a.keywords.some(k => k.includes(q))
      )
    : section.articles;

  if (filteredArticles.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-3">
      <div className="flex items-center gap-2.5">
        <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">{section.title}</h3>
          <p className="text-xs text-muted-foreground">{section.description}</p>
        </div>
      </div>

      <Accordion type="single" collapsible className="w-full">
        {filteredArticles.map((article) => (
          <AccordionItem key={article.id} value={article.id} className="border-b border-border/50">
            <AccordionTrigger className="text-left text-sm py-3 hover:no-underline">
              <span className="font-medium">{article.question}</span>
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground pb-4 space-y-3">
              <p>{article.answer}</p>

              {article.steps && article.steps.length > 0 && (
                <ol className="space-y-2 pl-1">
                  {article.steps.map((step, i) => (
                    <li key={i} className="flex gap-3 items-start">
                      <span className="flex-shrink-0 flex items-center justify-center h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold mt-0.5">
                        {i + 1}
                      </span>
                      <span className="text-foreground/80">{step}</span>
                    </li>
                  ))}
                </ol>
              )}

              {article.tip && (
                <Alert className="bg-accent/30 border-accent">
                  <Lightbulb className="h-4 w-4 text-accent-foreground" />
                  <AlertDescription className="text-xs text-accent-foreground">
                    <strong>Tip:</strong> {article.tip}
                  </AlertDescription>
                </Alert>
              )}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};
