import React from 'react';
import { View } from '@react-pdf/renderer';
import { FieldRow } from './FieldRow';
import { SectionHeader } from './SectionHeader';

interface FieldGroupProps {
  /** Section title (e.g. "1. Datos Generales") */
  title: string;
  /** Array of [label, value] tuples */
  fields: [string, string][];
  /** Custom label width */
  labelWidth?: number;
}

/**
 * A section header followed by a list of label-value field rows.
 */
export const FieldGroup: React.FC<FieldGroupProps> = ({ title, fields, labelWidth }) => (
  <View>
    <SectionHeader title={title} />
    {fields.map(([label, value], i) => (
      <FieldRow key={i} label={label} value={value} labelWidth={labelWidth} />
    ))}
  </View>
);
