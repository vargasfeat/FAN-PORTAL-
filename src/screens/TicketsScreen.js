import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, rs } from '../theme';

// Fuera del alcance de esta iteración: solo reserva el destino de navegación.
export default function TicketsScreen() {
  return (
    <View style={styles.container}>
      <Ionicons name="ticket-outline" size={rs(64)} color={colors.accent} />
      <Text style={styles.title}>Venta de entradas</Text>
      <Text style={styles.text}>Pronto podrás comprar tus entradas desde aquí.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background, paddingHorizontal: '10%' },
  title: { fontSize: rs(22), fontWeight: '800', color: colors.text, marginTop: rs(12) },
  text: { fontSize: rs(14), color: colors.muted, textAlign: 'center', marginTop: rs(6) },
});
