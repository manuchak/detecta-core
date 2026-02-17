import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { pdfBaseStyles } from './styles';
import type { Style } from '@react-pdf/types';

export interface DataTableColumn {
  /** Column header label */
  header: string;
  /** Key or accessor function */
  accessor: string | ((row: any, index: number) => string);
  /** Flex width (default 1) */
  flex?: number;
  /** Fixed width in points (overrides flex) */
  width?: number;
  /** Text alignment */
  align?: 'left' | 'center' | 'right';
}

interface DataTableProps {
  columns: DataTableColumn[];
  data: any[];
  /** Show alternating row backgrounds */
  striped?: boolean;
  /** Optional title above the table */
  title?: string;
}

/**
 * Generic data table with header row, optional striping, and flexible columns.
 */
export const DataTable: React.FC<DataTableProps> = ({ columns, data, striped = true, title }) => {
  const getCellStyle = (col: DataTableColumn): Style => ({
    flex: col.width ? undefined : (col.flex ?? 1),
    width: col.width,
    textAlign: col.align || 'left',
  });

  const getValue = (row: any, col: DataTableColumn, index: number): string => {
    if (typeof col.accessor === 'function') return col.accessor(row, index);
    return String(row[col.accessor] ?? '-');
  };

  return (
    <View style={pdfBaseStyles.table}>
      {title && (
        <View style={pdfBaseStyles.sectionHeader}>
          <Text style={pdfBaseStyles.sectionTitle}>{title}</Text>
        </View>
      )}

      {/* Header */}
      <View style={pdfBaseStyles.tableHeaderRow} minPresenceAhead={40}>
        {columns.map((col, i) => (
          <Text key={i} style={[pdfBaseStyles.tableCellHeader, getCellStyle(col)]}>
            {col.header}
          </Text>
        ))}
      </View>

      {/* Rows */}
      {data.map((row, rowIdx) => (
        <View
          key={rowIdx}
          style={striped && rowIdx % 2 === 1 ? pdfBaseStyles.tableRowAlt : pdfBaseStyles.tableRow}
        >
          {columns.map((col, colIdx) => (
            <Text key={colIdx} style={[pdfBaseStyles.tableCell, getCellStyle(col)]}>
              {getValue(row, col, rowIdx)}
            </Text>
          ))}
        </View>
      ))}

      {data.length === 0 && (
        <View style={pdfBaseStyles.tableRow}>
          <Text style={[pdfBaseStyles.tableCellMuted, { flex: 1, textAlign: 'center', paddingVertical: 8 }]}>
            Sin datos disponibles
          </Text>
        </View>
      )}
    </View>
  );
};
