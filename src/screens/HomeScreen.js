import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fetchTeam } from '../services/sportsApi';
import { colors, rs } from '../theme';

export default function HomeScreen({ user, navigate, onLogout }) {
  const [team, setTeam] = useState(null);

  // Datos del club desde TheSportsDB (a traves del backend)
  useEffect(() => {
    let active = true;
    fetchTeam().then((res) => active && setTeam(res));
    return () => {
      active = false;
    };
  }, []);

  const info = team?.data;
  const offline = team && team.source !== 'live';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.greeting}>Hola, {user.name.split(' ')[0]}</Text>
          <Text style={styles.member}>{user.memberType}</Text>
        </View>
        <Pressable onPress={onLogout} hitSlop={12} accessibilityRole="button" accessibilityLabel="Cerrar sesión">
          <Ionicons name="log-out-outline" size={rs(26)} color="#fff" />
        </Pressable>
      </View>

      {/* Tarjeta del club */}
      <View style={styles.teamCard}>
        {!team ? (
          <ActivityIndicator color={colors.primary} style={styles.teamLoader} />
        ) : (
          <>
            <View style={styles.badgeBox}>
              {info.badge ? (
                <Image source={{ uri: info.badge }} style={styles.badge} resizeMode="contain" />
              ) : (
                <Text style={styles.badgeFallback}>⚽</Text>
              )}
            </View>
            <View style={styles.teamInfo}>
              <Text style={styles.teamName} numberOfLines={1}>
                {info.name}
              </Text>
              <Text style={styles.teamMeta} numberOfLines={1}>
                {[info.stadium, info.formedYear && `Fundado en ${info.formedYear}`].filter(Boolean).join(' · ') ||
                  info.league}
              </Text>
              {offline && <Text style={styles.offline}>Datos del club no disponibles en línea</Text>}
            </View>
          </>
        )}
      </View>

      <Text style={styles.question}>¿Qué quieres hacer hoy?</Text>

      {/* Dos acciones grandes, diferenciadas por color e ícono */}
      <View style={styles.actions}>
        <Pressable
          style={({ pressed }) => [styles.action, styles.actionStore, pressed && styles.pressed]}
          onPress={() => navigate('catalog')}
          accessibilityRole="button"
        >
          <Ionicons name="shirt" size={rs(44)} color="#fff" />
          <Text style={styles.actionTitle}>Tienda de indumentaria</Text>
          <Text style={styles.actionDesc}>Camisetas, abrigos y accesorios oficiales</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.action, styles.actionTickets, pressed && styles.pressed]}
          onPress={() => navigate('tickets')}
          accessibilityRole="button"
        >
          <Ionicons name="ticket" size={rs(44)} color="#fff" />
          <Text style={styles.actionTitle}>Entradas</Text>
          <Text style={styles.actionDesc}>Compra tu entrada para el próximo partido</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: '6%',
    paddingVertical: '5%',
    borderBottomLeftRadius: rs(22),
    borderBottomRightRadius: rs(22),
  },
  headerText: { flex: 1 },
  greeting: { fontSize: rs(22), fontWeight: '800', color: '#fff' },
  member: { fontSize: rs(13), color: '#B8C7DA', marginTop: rs(2) },
  teamCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: rs(16),
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: '6%',
    marginTop: '4%',
    padding: '3.5%',
    minHeight: rs(72),
  },
  teamLoader: { flex: 1 },
  badgeBox: { width: '18%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  badge: { width: '100%', height: '100%' },
  badgeFallback: { fontSize: rs(34) },
  teamInfo: { flex: 1, marginLeft: '3%' },
  teamName: { fontSize: rs(17), fontWeight: '800', color: colors.text },
  teamMeta: { fontSize: rs(12), color: colors.muted, marginTop: rs(2) },
  offline: { fontSize: rs(11), color: colors.warning, marginTop: rs(2), fontWeight: '600' },
  question: { fontSize: rs(17), fontWeight: '700', color: colors.text, paddingHorizontal: '6%', paddingTop: '4%' },
  actions: { flex: 1, paddingHorizontal: '6%', paddingVertical: '3%', justifyContent: 'space-between' },
  action: {
    flex: 1,
    borderRadius: rs(20),
    padding: '6%',
    justifyContent: 'center',
    marginBottom: '4%',
  },
  actionStore: { backgroundColor: colors.primary },
  actionTickets: { backgroundColor: colors.accent, marginBottom: 0 },
  pressed: { opacity: 0.88, transform: [{ scale: 0.99 }] },
  actionTitle: { fontSize: rs(22), fontWeight: '800', color: '#fff', marginTop: rs(10) },
  actionDesc: { fontSize: rs(14), color: 'rgba(255,255,255,0.85)', marginTop: rs(4) },
});
