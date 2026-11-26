import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import StepIndicator from '../components/StepIndicator';
import { useCart } from '../context/CartContext';
import { fetchMemberDiscount, processPayment } from '../data/mockData';
import { colors, rs } from '../theme';
import { formatCLP } from '../utils/helpers';

export default function CartScreen({ user, navigate }) {
  const { items, subtotal, updateQuantity, removeItem, clearCart } = useCart();
  const [phase, setPhase] = useState('cart'); // 'cart' | 'processing' | 'success'
  const [discount, setDiscount] = useState({ rate: 0, amount: 0 });
  const [calculating, setCalculating] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [error, setError] = useState('');

  // PC-03: el descuento de socio viene de la "respuesta del backend" (simulada)
  useEffect(() => {
    if (phase !== 'cart') return;
    if (subtotal === 0) {
      setDiscount({ rate: 0, amount: 0 });
      setCalculating(false);
      return;
    }
    let cancelled = false;
    setCalculating(true);
    fetchMemberDiscount(subtotal, user.discountRate)
      .then((d) => {
        if (!cancelled) {
          setDiscount(d);
          setCalculating(false);
        }
      })
      .catch(() => {
        if (!cancelled) setCalculating(false);
      });
    return () => {
      cancelled = true;
    };
  }, [subtotal, phase, user.discountRate]);

  const total = Math.max(subtotal - discount.amount, 0);
  const canPay = items.length > 0 && !calculating && phase === 'cart';

  // PC-04: pago simulado -> limpia AsyncStorage y el contador vuelve a 0
  const handlePay = async () => {
    if (!canPay) return;
    setError('');
    setPhase('processing');
    try {
      const result = await processPayment({ total });
      if (!result.ok) throw new Error('Pago rechazado');
      setReceipt({ orderId: result.orderId, total: result.total });
      setPhase('success'); // primero la confirmación, para no mostrar un carrito vacío un instante
      await clearCart(); // luego se borra el estado y AsyncStorage (contador => 0)
    } catch (e) {
      setError('No pudimos procesar el pago. Tu carrito sigue intacto, intenta nuevamente.');
      setPhase('cart');
    }
  };

  // ---------- Paso 3: Confirmación ----------
  if (phase === 'success' && receipt) {
    return (
      <View style={styles.container}>
        <View style={styles.padded}>
          <StepIndicator current={3} />
        </View>
        <View style={styles.successBox}>
          <Ionicons name="checkmark-circle" size={rs(84)} color={colors.success} />
          <Text style={styles.successTitle}>¡Pago exitoso!</Text>
          <Text style={styles.successText}>Pagaste {formatCLP(receipt.total)}</Text>
          <Text style={styles.successOrder}>Pedido {receipt.orderId}</Text>
        </View>
        <View style={styles.footer}>
          <Pressable style={styles.payButton} onPress={() => navigate('home')} accessibilityRole="button">
            <Text style={styles.payText}>Volver al inicio</Text>
          </Pressable>
          <Pressable style={styles.secondary} onPress={() => navigate('catalog')} accessibilityRole="button">
            <Text style={styles.secondaryText}>Seguir comprando</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ---------- Paso 2: Carrito ----------
  const renderItem = ({ item }) => (
    <View style={styles.row}>
      <View style={styles.thumb}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.thumbImg} resizeMode="cover" />
        ) : (
          <Text style={styles.thumbEmoji}>{item.emoji}</Text>
        )}
      </View>
      <View style={styles.rowInfo}>
        <Text style={styles.rowName} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.rowPrice}>{formatCLP(item.price)}</Text>
        <View style={styles.stepper}>
          <Pressable style={styles.stepBtn} onPress={() => updateQuantity(item.id, -1)} accessibilityLabel="Quitar una unidad" hitSlop={6}>
            <Ionicons name="remove" size={rs(18)} color={colors.primary} />
          </Pressable>
          <Text style={styles.qty}>{item.quantity}</Text>
          <Pressable
            style={[styles.stepBtn, item.quantity >= item.stock && styles.stepBtnDisabled]}
            disabled={item.quantity >= item.stock}
            onPress={() => updateQuantity(item.id, 1)}
            accessibilityLabel="Agregar una unidad"
            hitSlop={6}
          >
            <Ionicons name="add" size={rs(18)} color={item.quantity >= item.stock ? colors.disabledText : colors.primary} />
          </Pressable>
        </View>
      </View>
      <Pressable onPress={() => removeItem(item.id)} hitSlop={10} accessibilityLabel={`Eliminar ${item.name}`}>
        <Ionicons name="trash-outline" size={rs(22)} color={colors.muted} />
      </Pressable>
    </View>
  );

  const Summary = (
    <View style={styles.summary}>
      <SummaryRow label="Subtotal" value={formatCLP(subtotal)} />
      <SummaryRow
        label={`Descuento de Socio${discount.rate ? ` (${Math.round(discount.rate * 100)}%)` : ''}`}
        value={calculating ? null : `-${formatCLP(discount.amount)}`}
        valueColor={colors.success}
      />
      <View style={styles.divider} />
      <SummaryRow label="Total a Pagar" value={calculating ? null : formatCLP(total)} bold />
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <StepIndicator current={2} />
            <Text style={styles.title}>Tu carrito</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="cart-outline" size={rs(64)} color={colors.disabled} />
            <Text style={styles.emptyTitle}>Tu carrito está vacío</Text>
            <Text style={styles.emptyText}>Agrega productos desde la tienda para continuar.</Text>
            <Pressable style={styles.secondary} onPress={() => navigate('catalog')} accessibilityRole="button">
              <Text style={styles.secondaryText}>Ir a la tienda</Text>
            </Pressable>
          </View>
        }
        ListFooterComponent={items.length > 0 ? Summary : null}
      />

      {items.length > 0 && (
        <View style={styles.footer}>
          {!!error && <Text style={styles.error}>{error}</Text>}
          <Pressable
            disabled={!canPay}
            onPress={handlePay}
            accessibilityRole="button"
            accessibilityState={{ disabled: !canPay }}
            style={[styles.payButton, !canPay && styles.payDisabled]}
          >
            {phase === 'processing' ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={[styles.payText, !canPay && styles.payTextDisabled]}>Pagar {calculating ? '' : formatCLP(total)}</Text>
            )}
          </Pressable>
        </View>
      )}
    </View>
  );
}

function SummaryRow({ label, value, bold, valueColor }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryLabel, bold && styles.summaryBold]}>{label}</Text>
      {value === null ? (
        <ActivityIndicator size="small" color={colors.muted} />
      ) : (
        <Text style={[styles.summaryValue, bold && styles.summaryBold, valueColor && { color: valueColor }]}>{value}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  padded: { paddingHorizontal: '4%' },
  list: { paddingHorizontal: '4%', paddingBottom: rs(16), flexGrow: 1 },
  title: { fontSize: rs(22), fontWeight: '800', color: colors.text, marginBottom: rs(12) },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: rs(14),
    borderWidth: 1,
    borderColor: colors.border,
    padding: '3%',
    marginBottom: rs(10),
  },
  thumb: { width: '20%', aspectRatio: 1, borderRadius: rs(10), backgroundColor: colors.tint, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  thumbImg: { width: '100%', height: '100%' },
  thumbEmoji: { fontSize: rs(30) },
  rowInfo: { flex: 1, marginHorizontal: '3%' },
  rowName: { fontSize: rs(14), fontWeight: '600', color: colors.text },
  rowPrice: { fontSize: rs(14), fontWeight: '800', color: colors.primary, marginTop: rs(2) },
  stepper: { flexDirection: 'row', alignItems: 'center', marginTop: rs(8) },
  stepBtn: {
    width: rs(32),
    height: rs(32),
    borderRadius: rs(8),
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  stepBtnDisabled: { backgroundColor: colors.softDisabled },
  qty: { minWidth: rs(34), textAlign: 'center', fontSize: rs(15), fontWeight: '700', color: colors.text },
  summary: { backgroundColor: colors.surface, borderRadius: rs(14), borderWidth: 1, borderColor: colors.border, padding: '5%', marginTop: rs(6) },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: rs(6) },
  summaryLabel: { fontSize: rs(14), color: colors.muted },
  summaryValue: { fontSize: rs(14), fontWeight: '600', color: colors.text },
  summaryBold: { fontSize: rs(17), fontWeight: '800', color: colors.text },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: rs(6) },
  footer: { paddingHorizontal: '4%', paddingVertical: rs(12), backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  error: { color: colors.accent, fontSize: rs(13), marginBottom: rs(8) },
  payButton: { minHeight: rs(52), borderRadius: rs(12), backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  payDisabled: { backgroundColor: colors.disabled },
  payText: { color: '#fff', fontSize: rs(16), fontWeight: '800' },
  payTextDisabled: { color: colors.disabledText },
  secondary: { minHeight: rs(48), borderRadius: rs(12), borderWidth: 1.5, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: rs(10), paddingHorizontal: rs(20) },
  secondaryText: { color: colors.primary, fontSize: rs(15), fontWeight: '700' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: '15%' },
  emptyTitle: { fontSize: rs(18), fontWeight: '700', color: colors.text, marginTop: rs(10) },
  emptyText: { fontSize: rs(14), color: colors.muted, textAlign: 'center', marginTop: rs(4) },
  successBox: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: '8%' },
  successTitle: { fontSize: rs(26), fontWeight: '800', color: colors.text, marginTop: rs(12) },
  successText: { fontSize: rs(17), color: colors.text, marginTop: rs(6) },
  successOrder: { fontSize: rs(13), color: colors.muted, marginTop: rs(4) },
});
