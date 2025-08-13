import React, { forwardRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { sanitizeUserInput } from '@/utils/sanitization';

interface SecureTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  sanitize?: boolean;
  onSecureChange?: (value: string) => void;
}

/**
 * Secure textarea component with built-in sanitization
 */
export const SecureTextarea = forwardRef<HTMLTextAreaElement, SecureTextareaProps>(
  ({ sanitize = true, onSecureChange, onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      let value = e.target.value;
      
      if (sanitize) {
        value = sanitizeUserInput(value);
      }
      
      if (onSecureChange) {
        onSecureChange(value);
      }
      
      if (onChange) {
        // Create a new event with sanitized value
        const sanitizedEvent = {
          ...e,
          target: { ...e.target, value }
        } as React.ChangeEvent<HTMLTextAreaElement>;
        onChange(sanitizedEvent);
      }
    };

    return (
      <Textarea
        {...props}
        ref={ref}
        onChange={handleChange}
      />
    );
  }
);

SecureTextarea.displayName = 'SecureTextarea';

export default SecureTextarea;