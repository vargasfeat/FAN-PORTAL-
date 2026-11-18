import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fetchNextMatches, formatMatchDate } from '../services/sportsApi';
import { colors, rs } from '../theme';

function TeamSide({ name, badge }) {
  return (
    <View style={styles.side}>
      {badge ? (
        <Image source={{ uri: badge }} style={styles.sideBadge} resizeMode="contain" />
      ) : (
        <Text style={styles.sideFallback}>⚽</Text>
      )}
      <Text style={styles.sideName} numberOfLines={2}>
        {name}
      </Text>
    </View>
  );
}

function MatchCard({ match }) {
  return (
    <View style={styles.card}>
      <Text style={styles.league} numberOfLines={1}>
        {match.league}
        {match.round ? ` · Fecha ${match.round}` : ''}
      </Text>

      <View style={styles.teams}>
        <TeamSide name={match.homeTeam} badge={match.homeBadge} />
        <Text style={styles.vs}>vs</Text>
        <TeamSide name={match.awayTeam} badge={match.awayBadge} />
      </View>

      <View style={styles.detail}>
        <Ionicons name="calendar-outline" size={rs(16)} color={colors.muted} />
        <Text style={styles.detailText}>
          {formatMatchDate(match.date)}
          {match.time ? ` · ${match.time}` : ''}
        </Text>
      </View>
      {!!match.venue && (
        <View style={styles.detail}>
          <Ionicons name="location-outline" size={rs(16)} color={colors.muted} />
          <Text style={styles.detailText} numberOfLines={1}>
            {match.venue}
          </Text>
        </View>
      )}

      {/* La venta de entradas se implementa en una etapa posterior */}
      <Pressable disabled style={[styles.button, styles.buttonDisabled]} accessibilityState={{ disabled: true }}>
        <Text style={styles.buttonTextDisabled}>Venta próximamente</Text>
      </Pressable>
    </View>
  );
}

export default function TicketsScreen() {
  const [result, setResult] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setResult(await fetchNextMatches());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const matches = result?.data || [];
  const offline = result && result.source !== 'live';

  return (
    <View style={styles.container}>
      <FlatList
        data={matches}
        keyExtractor={(m) => String(m.id)}
        renderItem={({ item }) => <MatchCard match={item} />}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <View>
            <Text style={styles.title}>Próximos partidos</Text>
            {offline && (
              <Text style={styles.offline}>Sin conexión con el servidor de datos deportivos. Desliza para reintentar.</Text>
            )}
          </View>
        }
        ListEmptyComponent={
          !result ? (
            <ActivityIndicator style={styles.loader} color={colors.primary} />
          ) : (
            <View style={styles.empty}>
              <Ionicons name="ticket-outline" size={rs(56)} color={colors.disabled} />
              <Text style={styles.emptyTitle}>No hay partidos programados</Text>
              <Text style={styles.emptyText}>Cuando se publique el calendario, aparecerá aquí.</Text>
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: '4%', paddingTop: rs(16), paddingBottom: rs(24), flexGrow: 1 },
  title: { fontSize: rs(22), fontWeight: '800', color: colors.text, marginBottom: rs(12) },
  offline: { fontSize: rs(12), color: colors.warning, fontWeight: '600', marginBottom: rs(12) },
  loader: { paddingVertical: rs(40) },
  card: {
    backgroundColor: colors.surface,
    borderRadius: rs(16),
    borderWidth: 1,
    borderColor: colors.border,
    padding: '4%',
    marginBottom: rs(12),
  },
  league: { fontSize: rs(12), fontWeight: '700', color: colors.accent },
  teams: { flexDirection: 'row', alignItems: 'center', marginVertical: rs(12) },
  side: { flex: 1, alignItems: 'center' },
  sideBadge: { width: '40%', aspectRatio: 1 },
  sideFallback: { fontSize: rs(32) },
  sideName: { fontSize: rs(13), fontWeight: '700', color: colors.text, textAlign: 'center', marginTop: rs(6) },
  vs: { fontSize: rs(13), fontWeight: '800', color: colors.muted, paddingHorizontal: rs(8) },
  detail: { flexDirection: 'row', alignItems: 'center', marginTop: rs(4) },
  detailText: { flex: 1, fontSize: rs(13), color: colors.muted, marginLeft: rs(6) },
  button: { minHeight: rs(46), borderRadius: rs(12), alignItems: 'center', justifyContent: 'center', marginTop: rs(14) },
  buttonDisabled: { backgroundColor: colors.disabled },
  buttonTextDisabled: { color: colors.disabledText, fontSize: rs(14), fontWeight: '700' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: '15%' },
  emptyTitle: { fontSize: rs(17), fontWeight: '700', color: colors.text, marginTop: rs(10) },
  emptyText: { fontSize: rs(14), color: colors.muted, textAlign: 'center', marginTop: rs(4) },
});
