import React, { forwardRef } from 'react';
import { Input } from '@/components/ui/input';
import { sanitizeUserInput } from '@/utils/sanitization';

interface SecureInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  sanitize?: boolean;
  onSecureChange?: (value: string) => void;
}

/**
 * Secure input component with built-in sanitization
 */
export const SecureInput = forwardRef<HTMLInputElement, SecureInputProps>(
  ({ sanitize = true, onSecureChange, onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        } as React.ChangeEvent<HTMLInputElement>;
        onChange(sanitizedEvent);
      }
    };

    return (
      <Input
        {...props}
        ref={ref}
        onChange={handleChange}
      />
    );
  }
);

SecureInput.displayName = 'SecureInput';

export default SecureInput;