import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { PDF_COLORS } from './tokens';

interface InsightBoxProps {
  /** Insight text */
  text: string;
  /** Accent color for the indicator dot and border */
  color?: string;
  /** Whether this is a positive or negative insight */
  positive?: boolean;
}

/**
 * Styled insight/callout box with colored accent bar and indicator dot.
 * Replaces loose "INSIGHT:" text patterns across sections.
 */
export const InsightBox: React.FC<InsightBoxProps> = ({
  text,
  color,
  positive = true,
}) => {
  const accentColor = color || (positive ? PDF_COLORS.success : PDF_COLORS.danger);

  return (
    <View
      style={{
        marginTop: 8,
        marginBottom: 6,
        padding: 8,
        paddingLeft: 12,
        borderLeftWidth: 3,
        borderLeftColor: accentColor,
        backgroundColor: PDF_COLORS.backgroundSubtle,
        borderRadius: 2,
        flexDirection: 'row',
        alignItems: 'flex-start',
      }}
    >
      <View
        style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: accentColor,
          marginRight: 8,
          marginTop: 1,
        }}
      />
      <Text style={{ fontSize: 8, color: PDF_COLORS.black, flex: 1, lineHeight: 1.4 }}>
        {text}
      </Text>
    </View>
  );
};
