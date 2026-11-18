import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fetchLastMatches, fetchNextMatches, fetchStandings, formatMatchDate } from '../services/sportsApi';
import { colors, rs } from '../theme';

const TABS = [
  { key: 'next', label: 'Próximos' },
  { key: 'last', label: 'Resultados' },
  { key: 'table', label: 'Tabla' },
];

const OUTCOME = {
  W: { label: 'G', color: colors.success },
  D: { label: 'E', color: colors.muted },
  L: { label: 'P', color: colors.accent },
};

function Badge({ uri, size }) {
  return uri ? (
    <Image source={{ uri }} style={{ width: size, height: size }} resizeMode="contain" />
  ) : (
    <Text style={{ fontSize: size * 0.8 }}>⚽</Text>
  );
}

function MatchCard({ match, showScore }) {
  const outcome = showScore && match.outcome ? OUTCOME[match.outcome] : null;
  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <Text style={styles.cardMeta} numberOfLines={1}>
          {formatMatchDate(match.date)}
          {!showScore && match.time ? ` · ${match.time}` : ''}
          {match.round ? ` · Fecha ${match.round}` : ''}
        </Text>
        {outcome && (
          <View style={[styles.outcome, { backgroundColor: outcome.color }]}>
            <Text style={styles.outcomeText}>{outcome.label}</Text>
          </View>
        )}
      </View>

      <View style={styles.teams}>
        <View style={styles.side}>
          <Badge uri={match.homeBadge} size={rs(36)} />
          <Text style={styles.sideName} numberOfLines={2}>
            {match.homeTeam}
          </Text>
        </View>

        <Text style={styles.center}>{showScore ? `${match.homeScore} - ${match.awayScore}` : 'vs'}</Text>

        <View style={styles.side}>
          <Badge uri={match.awayBadge} size={rs(36)} />
          <Text style={styles.sideName} numberOfLines={2}>
            {match.awayTeam}
          </Text>
        </View>
      </View>

      {!!match.venue && (
        <View style={styles.venue}>
          <Ionicons name="location-outline" size={rs(14)} color={colors.muted} />
          <Text style={styles.venueText} numberOfLines={1}>
            {match.venue}
          </Text>
        </View>
      )}
    </View>
  );
}

function TableHeader() {
  return (
    <View style={[styles.tr, styles.thead]}>
      <Text style={[styles.th, styles.cPos]}>#</Text>
      <Text style={[styles.th, styles.cTeam]}>Equipo</Text>
      <Text style={[styles.th, styles.cNum]}>PJ</Text>
      <Text style={[styles.th, styles.cNum]}>DG</Text>
      <Text style={[styles.th, styles.cPts]}>Pts</Text>
    </View>
  );
}

function TableRow({ row }) {
  const dg = row.goalDifference;
  return (
    <View style={[styles.tr, row.isClub && styles.trClub]}>
      <Text style={[styles.td, styles.cPos, row.isClub && styles.bold]}>{row.rank}</Text>
      <View style={[styles.cTeam, styles.teamCell]}>
        <Badge uri={row.badge} size={rs(22)} />
        <Text style={[styles.td, styles.teamName, row.isClub && styles.bold]} numberOfLines={1}>
          {row.team}
        </Text>
      </View>
      <Text style={[styles.td, styles.cNum]}>{row.played ?? '-'}</Text>
      <Text style={[styles.td, styles.cNum]}>{dg === null ? '-' : dg > 0 ? `+${dg}` : dg}</Text>
      <Text style={[styles.td, styles.cPts, styles.bold]}>{row.points ?? '-'}</Text>
    </View>
  );
}

export default function LeagueScreen() {
  const [tab, setTab] = useState('next');
  const [data, setData] = useState(null); // { next, last, table }
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [next, last, table] = await Promise.all([fetchNextMatches(), fetchLastMatches(), fetchStandings()]);
    setData({ next, last, table });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const current = data?.[tab];
  const rows = current?.data || [];
  const offline = current && current.source !== 'live';
  const limited = current && current.source === 'live' && current.limited;

  const emptyText = {
    next: 'No hay partidos programados por ahora.',
    last: 'Aún no hay resultados disponibles.',
    table: 'La tabla de posiciones no está disponible por ahora.',
  }[tab];

  return (
    <View style={styles.container}>
      <FlatList
        data={rows}
        key={tab}
        keyExtractor={(item, i) => String(item.id ?? item.teamId ?? i)}
        renderItem={({ item }) =>
          tab === 'table' ? <TableRow row={item} /> : <MatchCard match={item} showScore={tab === 'last'} />
        }
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <View>
            <Text style={styles.title}>Liga</Text>

            <View style={styles.segment}>
              {TABS.map((t) => (
                <Pressable
                  key={t.key}
                  onPress={() => setTab(t.key)}
                  style={[styles.segBtn, tab === t.key && styles.segBtnOn]}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: tab === t.key }}
                >
                  <Text style={[styles.segText, tab === t.key && styles.segTextOn]}>{t.label}</Text>
                </Pressable>
              ))}
            </View>

            {offline && (
              <Text style={styles.warn}>Sin datos en línea por ahora. Desliza hacia abajo para reintentar.</Text>
            )}
            {limited && rows.length > 0 && (
              <Text style={styles.note}>Plan gratuito de TheSportsDB: se muestran datos limitados.</Text>
            )}
            {tab === 'table' && rows.length > 0 && <TableHeader />}
          </View>
        }
        ListEmptyComponent={
          !data ? (
            <ActivityIndicator style={styles.loader} color={colors.primary} />
          ) : (
            <View style={styles.empty}>
              <Ionicons name="trophy-outline" size={rs(52)} color={colors.disabled} />
              <Text style={styles.emptyText}>{emptyText}</Text>
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
  segment: {
    flexDirection: 'row',
    backgroundColor: '#E4E8EF',
    borderRadius: rs(12),
    padding: rs(3),
    marginBottom: rs(12),
  },
  segBtn: { flex: 1, minHeight: rs(38), borderRadius: rs(10), alignItems: 'center', justifyContent: 'center' },
  segBtnOn: { backgroundColor: colors.surface },
  segText: { fontSize: rs(13), fontWeight: '600', color: colors.muted },
  segTextOn: { color: colors.primary, fontWeight: '800' },
  warn: { fontSize: rs(12), color: colors.warning, fontWeight: '600', marginBottom: rs(10) },
  note: { fontSize: rs(11), color: colors.muted, marginBottom: rs(10) },
  loader: { paddingVertical: rs(40) },
  empty: { alignItems: 'center', paddingVertical: '15%' },
  emptyText: { fontSize: rs(14), color: colors.muted, textAlign: 'center', marginTop: rs(10) },
  card: {
    backgroundColor: colors.surface,
    borderRadius: rs(14),
    borderWidth: 1,
    borderColor: colors.border,
    padding: '4%',
    marginBottom: rs(10),
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardMeta: { flex: 1, fontSize: rs(12), fontWeight: '700', color: colors.accent },
  outcome: { width: rs(24), height: rs(24), borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  outcomeText: { color: '#fff', fontSize: rs(12), fontWeight: '800' },
  teams: { flexDirection: 'row', alignItems: 'center', marginVertical: rs(10) },
  side: { flex: 1, alignItems: 'center' },
  sideName: { fontSize: rs(12), fontWeight: '700', color: colors.text, textAlign: 'center', marginTop: rs(4) },
  center: { fontSize: rs(20), fontWeight: '800', color: colors.text, paddingHorizontal: rs(8) },
  venue: { flexDirection: 'row', alignItems: 'center' },
  venueText: { flex: 1, fontSize: rs(12), color: colors.muted, marginLeft: rs(4) },
  tr: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingVertical: rs(9),
    paddingHorizontal: '3%',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  thead: { backgroundColor: '#E4E8EF', borderTopLeftRadius: rs(10), borderTopRightRadius: rs(10), borderBottomWidth: 0 },
  trClub: { backgroundColor: '#FDECEE' },
  th: { fontSize: rs(11), fontWeight: '800', color: colors.muted },
  td: { fontSize: rs(13), color: colors.text },
  bold: { fontWeight: '800' },
  cPos: { width: '9%' },
  cTeam: { width: '45%' },
  teamCell: { flexDirection: 'row', alignItems: 'center' },
  teamName: { flex: 1, marginLeft: rs(6) },
  cNum: { width: '15%', textAlign: 'center' },
  cPts: { width: '16%', textAlign: 'center' },
});
