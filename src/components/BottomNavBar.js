import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, rs } from '../theme';

const TABS = [
  { key: 'home', label: 'Inicio', icon: 'home-outline', iconActive: 'home' },
  { key: 'catalog', label: 'Tienda', icon: 'shirt-outline', iconActive: 'shirt' },
  { key: 'tickets', label: 'Entradas', icon: 'ticket-outline', iconActive: 'ticket' },
  { key: 'cart', label: 'Carrito', icon: 'cart-outline', iconActive: 'cart' },
];

export default function BottomNavBar({ current, onNavigate, cartCount }) {
  return (
    <View style={styles.bar}>
      {TABS.map((tab) => {
        const active = current === tab.key;
        const isCart = tab.key === 'cart';
        return (
          <Pressable
            key={tab.key}
            style={styles.tab}
            onPress={() => onNavigate(tab.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={isCart ? `Carrito, ${cartCount} artículos` : tab.label}
          >
            <View>
              <Ionicons
                name={active ? tab.iconActive : tab.icon}
                size={rs(24)}
                color={active ? colors.primary : colors.muted}
              />
              {isCart && (
                <View style={[styles.badge, cartCount === 0 && styles.badgeEmpty]}>
                  <Text style={styles.badgeText}>{cartCount > 99 ? '99+' : cartCount}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.label, active && styles.labelActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: rs(6),
    paddingBottom: rs(4),
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: rs(48) },
  label: { fontSize: rs(11), color: colors.muted, marginTop: rs(2), fontWeight: '500' },
  labelActive: { color: colors.primary, fontWeight: '700' },
  badge: {
    position: 'absolute',
    top: -rs(6),
    right: -rs(10),
    minWidth: rs(18),
    height: rs(18),
    paddingHorizontal: rs(4),
    borderRadius: 999,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeEmpty: { backgroundColor: colors.muted },
  badgeText: { color: '#fff', fontSize: rs(10), fontWeight: '800' },
});
