import React from 'react';
import { sanitizeHtml } from '@/utils/sanitization';

interface SafeHtmlProps {
  content: string;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

/**
 * Safe HTML component that sanitizes content before rendering
 * Replaces direct use of dangerouslySetInnerHTML
 */
export const SafeHtml: React.FC<SafeHtmlProps> = ({ 
  content, 
  className, 
  as: Component = 'div' 
}) => {
  const sanitizedContent = sanitizeHtml(content);
  
  return (
    <Component 
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  );
};

export default SafeHtml;