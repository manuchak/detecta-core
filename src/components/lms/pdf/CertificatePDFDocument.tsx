import React from 'react';
import { Document, Page, View, Text, Image, Svg, Circle, Line } from '@react-pdf/renderer';
import { PDF_COLORS, PDF_FONT_SIZES } from '@/components/pdf/tokens';
import { registerPDFFonts } from '@/components/pdf/fontSetup';

registerPDFFonts();

export interface CertificatePDFData {
  nombreUsuario: string;
  tituloCurso: string;
  calificacion: number;
  fechaCompletado: string;
  codigoVerificacion: string;
  duracionCurso?: number;
  logoBase64?: string | null;
}

/**
 * Professional landscape certificate PDF using @react-pdf/renderer.
 * Matches the corporate design system with red/black accent bars.
 */
export const CertificatePDFDocument: React.FC<CertificatePDFData> = ({
  nombreUsuario,
  tituloCurso,
  calificacion,
  fechaCompletado,
  codigoVerificacion,
  duracionCurso,
  logoBase64,
}) => (
  <Document>
    <Page
      size="A4"
      orientation="landscape"
      style={{
        fontFamily: 'Poppins',
        position: 'relative',
        backgroundColor: PDF_COLORS.white,
        paddingHorizontal: 60,
        paddingVertical: 40,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {/* Top accent bar: red + black */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row' }}>
        <View style={{ flex: 3, height: 8, backgroundColor: PDF_COLORS.red }} />
        <View style={{ flex: 1, height: 8, backgroundColor: PDF_COLORS.black }} />
      </View>

      {/* Decorative inner border */}
      <View
        style={{
          position: 'absolute',
          top: 20,
          left: 30,
          right: 30,
          bottom: 20,
          borderWidth: 1,
          borderColor: PDF_COLORS.borderLight,
          borderRadius: 2,
        }}
      />

      {/* Logo */}
      {logoBase64 && (
        <Image
          src={logoBase64}
          style={{ height: 50, maxWidth: 160, objectFit: 'contain', marginBottom: 12 }}
        />
      )}

      {/* Title */}
      <Text
        style={{
          fontSize: 28,
          fontWeight: 700,
          color: PDF_COLORS.black,
          letterSpacing: 4,
          marginBottom: 4,
          textAlign: 'center',
        }}
      >
        CERTIFICADO DE FINALIZACIÓN
      </Text>

      {/* Red line divider */}
      <View style={{ width: 80, height: 2, backgroundColor: PDF_COLORS.red, marginVertical: 10 }} />

      {/* Subtitle */}
      <Text style={{ fontSize: 11, color: PDF_COLORS.gray, marginBottom: 16, textAlign: 'center' }}>
        Se certifica que
      </Text>

      {/* Student name */}
      <Text
        style={{
          fontSize: 32,
          fontWeight: 700,
          color: PDF_COLORS.black,
          marginBottom: 12,
          textAlign: 'center',
        }}
      >
        {nombreUsuario}
      </Text>

      {/* Course description */}
      <Text style={{ fontSize: 11, color: PDF_COLORS.gray, textAlign: 'center' }}>
        ha completado satisfactoriamente el curso
      </Text>

      <Text
        style={{
          fontSize: 18,
          fontWeight: 600,
          color: PDF_COLORS.black,
          marginTop: 6,
          marginBottom: 20,
          textAlign: 'center',
        }}
      >
        «{tituloCurso}»
      </Text>

      {/* Details row */}
      <View
        style={{
          flexDirection: 'row',
          gap: 30,
          marginBottom: 20,
          alignItems: 'center',
        }}
      >
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 8, color: PDF_COLORS.grayLight, fontWeight: 600, letterSpacing: 1 }}>
            CALIFICACIÓN
          </Text>
          <Text style={{ fontSize: 16, fontWeight: 700, color: PDF_COLORS.red, marginTop: 2 }}>
            {calificacion}%
          </Text>
        </View>

        <View style={{ width: 1, height: 30, backgroundColor: PDF_COLORS.border }} />

        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 8, color: PDF_COLORS.grayLight, fontWeight: 600, letterSpacing: 1 }}>
            FECHA
          </Text>
          <Text style={{ fontSize: 12, fontWeight: 600, color: PDF_COLORS.black, marginTop: 2 }}>
            {fechaCompletado}
          </Text>
        </View>

        {duracionCurso ? (
          <>
            <View style={{ width: 1, height: 30, backgroundColor: PDF_COLORS.border }} />
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 8, color: PDF_COLORS.grayLight, fontWeight: 600, letterSpacing: 1 }}>
                DURACIÓN
              </Text>
              <Text style={{ fontSize: 12, fontWeight: 600, color: PDF_COLORS.black, marginTop: 2 }}>
                {duracionCurso} min
              </Text>
            </View>
          </>
        ) : null}
      </View>

      {/* Decorative seal circle */}
      <Svg width={50} height={50} style={{ marginBottom: 8 }}>
        <Circle cx={25} cy={25} r={23} stroke={PDF_COLORS.red} strokeWidth={2} fill="none" />
        <Circle cx={25} cy={25} r={18} stroke={PDF_COLORS.borderLight} strokeWidth={1} fill="none" />
        <Line x1={18} y1={25} x2={23} y2={30} stroke={PDF_COLORS.red} strokeWidth={2} />
        <Line x1={23} y1={30} x2={33} y2={19} stroke={PDF_COLORS.red} strokeWidth={2} />
      </Svg>

      {/* Verification code */}
      <Text style={{ fontSize: 8, color: PDF_COLORS.grayMuted, letterSpacing: 2, textAlign: 'center' }}>
        CÓDIGO DE VERIFICACIÓN: {codigoVerificacion}
      </Text>

      {/* Institutional signature line */}
      <View style={{ marginTop: 16, alignItems: 'center' }}>
        <View style={{ width: 160, height: 1, backgroundColor: PDF_COLORS.border, marginBottom: 4 }} />
        <Text style={{ fontSize: 8, color: PDF_COLORS.grayLight }}>
          Detecta — Plataforma de Capacitación
        </Text>
      </View>

      {/* Bottom accent bar: black + red */}
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row' }}>
        <View style={{ flex: 1, height: 8, backgroundColor: PDF_COLORS.black }} />
        <View style={{ flex: 3, height: 8, backgroundColor: PDF_COLORS.red }} />
      </View>
    </Page>
  </Document>
);
