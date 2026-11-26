import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import qrcode from 'qrcode-generator';

/**
 * Renderiza un código QR real usando únicamente Views de React Native
 * (compatible con Web, Android e iOS sin dependencias nativas ni SVG).
 */
export default function QrCodeBox({ value, size = 132, color = '#111827', backgroundColor = '#ffffff' }) {
  const matrix = useMemo(() => {
    const qr = qrcode(0, 'M');
    qr.addData(String(value || 'SOCIO'));
    qr.make();
    const count = qr.getModuleCount();
    const rows = [];
    for (let r = 0; r < count; r += 1) {
      const cols = [];
      for (let c = 0; c < count; c += 1) {
        cols.push(qr.isDark(r, c));
      }
      rows.push(cols);
    }
    return rows;
  }, [value]);

  const count = matrix.length || 1;
  const padding = 8;
  const innerSize = Math.max(40, size - padding * 2);
  const cellSize = innerSize / count;

  return (
    <View
      style={[
        styles.wrap,
        {
          width: size,
          height: size,
          padding,
          backgroundColor,
        },
      ]}
      accessibilityLabel={`Código QR: ${value}`}
    >
      <View style={{ width: innerSize, height: innerSize }}>
        {matrix.map((row, rIdx) => (
          <View key={rIdx} style={{ flexDirection: 'row', height: cellSize }}>
            {row.map((dark, cIdx) => (
              <View
                key={cIdx}
                style={{
                  width: cellSize,
                  height: cellSize,
                  backgroundColor: dark ? color : backgroundColor,
                }}
              />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
});
