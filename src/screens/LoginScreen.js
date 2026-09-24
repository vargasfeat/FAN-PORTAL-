import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Checkbox from '../components/Checkbox';
import { authenticate } from '../data/mockData';
import { colors, rs } from '../theme';
import { formatRut, isValidRut } from '../utils/helpers';

const TERMS_TEXT =
  'Al ingresar al Fan Portal declaras ser socio vigente de la institución y aceptas que tus datos ' +
  'personales sean tratados para gestionar compras de indumentaria y entradas, conforme a la ' +
  'Ley N° 19.628 sobre protección de la vida privada. Las compras están sujetas a disponibilidad ' +
  'de stock y a las condiciones de retracto y cambio publicadas por la institución.';

export default function LoginScreen({ onLogin }) {
  const [rut, setRut] = useState('');
  const [password, setPassword] = useState('');
  const [accepted, setAccepted] = useState(false); // PC-01 / R08
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  // PC-01 / R08: el botón permanece inactivo hasta aceptar los T&C
  const canSubmit = accepted && !loading;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    if (!isValidRut(rut)) return setError('El RUT no es válido. Revisa el número y el dígito verificador.');
    if (password.length < 4) return setError('Ingresa tu contraseña.');

    setError('');
    setLoading(true);
    try {
      const user = await authenticate(rut, password);
      onLogin(user);
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.brand}>
          <Text style={styles.crest}>⚽</Text>
          <Text style={styles.title}>Fan Portal</Text>
          <Text style={styles.subtitle}>Ingresa con tu RUT de socio</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>RUT</Text>
          <TextInput
            style={styles.input}
            value={rut}
            onChangeText={(t) => setRut(formatRut(t))}
            placeholder="12.345.678-5"
            placeholderTextColor={colors.disabledText}
            keyboardType="default"
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={12}
            accessibilityLabel="RUT"
          />

          <Text style={styles.label}>Contraseña</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Tu contraseña"
            placeholderTextColor={colors.disabledText}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            accessibilityLabel="Contraseña"
          />

          <View style={styles.terms}>
            <Checkbox checked={accepted} onToggle={() => setAccepted((v) => !v)}>
              <Text style={styles.termsText}>
                Acepto los{' '}
                <Text style={styles.link} onPress={() => setShowTerms(true)}>
                  Términos y Condiciones
                </Text>
              </Text>
            </Checkbox>
          </View>

          {!!error && (
            <Text style={styles.error} accessibilityLiveRegion="polite">
              {error}
            </Text>
          )}

          <Pressable
            disabled={!canSubmit}
            onPress={handleSubmit}
            accessibilityRole="button"
            accessibilityState={{ disabled: !canSubmit }}
            style={({ pressed }) => [styles.button, !canSubmit && styles.buttonDisabled, pressed && canSubmit && { opacity: 0.85 }]}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={[styles.buttonText, !canSubmit && styles.buttonTextDisabled]}>Ingresar</Text>
            )}
          </Pressable>

          {!accepted && <Text style={styles.hint}>Marca la casilla para poder ingresar.</Text>}
        </View>

        <Text style={styles.demo}>Demo: 12.345.678-5 · socio123</Text>
      </ScrollView>

      <Modal visible={showTerms} animationType="slide" transparent onRequestClose={() => setShowTerms(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Términos y Condiciones</Text>
            <ScrollView style={styles.modalBody}>
              <Text style={styles.modalText}>{TERMS_TEXT}</Text>
            </ScrollView>
            <Pressable style={styles.modalButton} onPress={() => setShowTerms(false)}>
              <Text style={styles.buttonText}>Cerrar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.primary },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: '6%', paddingVertical: '6%' },
  brand: { alignItems: 'center', marginBottom: '7%' },
  crest: { fontSize: rs(52) },
  title: { fontSize: rs(30), fontWeight: '800', color: '#fff', marginTop: rs(6) },
  subtitle: { fontSize: rs(14), color: '#B8C7DA', marginTop: rs(4) },
  card: { width: '100%', backgroundColor: colors.surface, borderRadius: rs(18), padding: '6%' },
  label: { fontSize: rs(13), fontWeight: '600', color: colors.text, marginBottom: rs(6) },
  input: {
    width: '100%',
    minHeight: rs(50),
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: rs(10),
    paddingHorizontal: '4%',
    fontSize: rs(16),
    color: colors.text,
    backgroundColor: colors.background,
    marginBottom: rs(14),
  },
  terms: { marginTop: rs(4), marginBottom: rs(14) },
  termsText: { fontSize: rs(13), color: colors.text },
  link: { color: colors.accent, fontWeight: '700', textDecorationLine: 'underline' },
  error: { color: colors.accent, fontSize: rs(13), marginBottom: rs(10) },
  button: {
    width: '100%',
    minHeight: rs(52),
    borderRadius: rs(12),
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: { backgroundColor: colors.disabled },
  buttonText: { color: '#fff', fontSize: rs(16), fontWeight: '700' },
  buttonTextDisabled: { color: colors.disabledText },
  hint: { textAlign: 'center', fontSize: rs(12), color: colors.muted, marginTop: rs(10) },
  demo: { textAlign: 'center', color: '#8FA3BC', fontSize: rs(12), marginTop: '6%' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  modalCard: { maxHeight: '70%', backgroundColor: colors.surface, borderTopLeftRadius: rs(20), borderTopRightRadius: rs(20), padding: '6%' },
  modalTitle: { fontSize: rs(18), fontWeight: '800', color: colors.text, marginBottom: rs(10) },
  modalBody: { marginBottom: rs(14) },
  modalText: { fontSize: rs(14), lineHeight: rs(21), color: colors.text },
  modalButton: { minHeight: rs(50), borderRadius: rs(12), backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
});
