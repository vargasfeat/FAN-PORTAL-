import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, rs } from '../theme';

const STEPS = ['Catálogo', 'Carrito', 'Confirmación'];

/** current: 1 | 2 | 3. Los pasos anteriores se muestran completados. */
export default function StepIndicator({ current }) {
  return (
    <View style={styles.container} accessibilityLabel={`Paso ${current} de ${STEPS.length}: ${STEPS[current - 1]}`}>
      {STEPS.map((label, index) => {
        const step = index + 1;
        const done = step < current || (current === 3 && step === 3);
        const active = step === current;
        return (
          <React.Fragment key={label}>
            {index > 0 && <View style={[styles.line, step <= current && styles.lineDone]} />}
            <View style={styles.stepCol}>
              <View style={[styles.circle, (done || active) && styles.circleOn, active && !done && styles.circleActive]}>
                {done ? (
                  <Ionicons name="checkmark" size={rs(14)} color="#fff" />
                ) : (
                  <Text style={[styles.num, active && styles.numOn]}>{step}</Text>
                )}
              </View>
              <Text style={[styles.label, active && styles.labelOn]} numberOfLines={1}>
                {label}
              </Text>
            </View>
          </React.Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
    paddingVertical: '3%',
  },
  stepCol: { width: '24%', alignItems: 'center' },
  circle: {
    width: '46%',
    aspectRatio: 1,
    maxWidth: 34,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.disabled,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  circleActive: { backgroundColor: colors.surface, borderColor: colors.accent },
  num: { fontSize: rs(13), fontWeight: '700', color: colors.disabledText },
  numOn: { color: colors.accent },
  line: { flex: 1, height: 2, backgroundColor: colors.disabled, marginTop: rs(16) },
  lineDone: { backgroundColor: colors.primary },
  label: { marginTop: rs(4), fontSize: rs(11), color: colors.disabledText, fontWeight: '500' },
  labelOn: { color: colors.text, fontWeight: '700' },
});
