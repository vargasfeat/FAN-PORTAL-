import React, { memo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, rs } from '../theme';
import { formatCLP } from '../utils/helpers';

function ProductCard({ product, inCartQty = 0, onAdd }) {
  const [imgFailed, setImgFailed] = useState(false);
  // PC-02: stock <= 0 => estado visual deshabilitado y sin acción posible
  const soldOut = product.stock <= 0;
  const reachedLimit = !soldOut && inCartQty >= product.stock;
  const disabled = soldOut || reachedLimit;
  const lowStock = !soldOut && product.stock <= 3;

  const label = soldOut ? 'Agotado' : reachedLimit ? 'Máximo en carrito' : 'Agregar al carrito';

  return (
    <View style={styles.card}>
      <View style={[styles.imageBox, soldOut && styles.imageBoxSoldOut]}>
        {product.image && !imgFailed ? (
          <Image
            source={{ uri: product.image }}
            style={[styles.photo, soldOut && styles.photoSoldOut]}
            resizeMode="cover"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <Text style={[styles.emoji, soldOut && styles.emojiSoldOut]}>{product.emoji}</Text>
        )}
        {soldOut && (
          <View style={styles.soldOutTag}>
            <Text style={styles.soldOutTagText}>Sin stock</Text>
          </View>
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={styles.price}>{formatCLP(product.price)}</Text>
        <Text style={[styles.stockNote, lowStock && styles.stockNoteLow]} numberOfLines={1}>
          {soldOut ? ' ' : lowStock ? `Quedan ${product.stock}` : 'Disponible'}
        </Text>
      </View>

      <Pressable
        disabled={disabled}
        onPress={() => onAdd(product)}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        accessibilityLabel={`${label}: ${product.name}`}
        style={({ pressed }) => [styles.button, disabled && styles.buttonDisabled, pressed && !disabled && styles.buttonPressed]}
      >
        <Text style={[styles.buttonText, disabled && styles.buttonTextDisabled]} numberOfLines={1}>
          {label}
        </Text>
      </Pressable>
    </View>
  );
}

export default memo(ProductCard);

const styles = StyleSheet.create({
  card: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: rs(14),
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: rs(12),
  },
  imageBox: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: colors.tint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageBoxSoldOut: { backgroundColor: colors.softDisabled },
  photo: { width: '100%', height: '100%' },
  photoSoldOut: { opacity: 0.35 },
  emoji: { fontSize: rs(54) },
  emojiSoldOut: { opacity: 0.35 },
  soldOutTag: {
    position: 'absolute',
    top: '6%',
    left: '6%',
    backgroundColor: colors.text,
    paddingHorizontal: rs(8),
    paddingVertical: rs(3),
    borderRadius: rs(6),
  },
  soldOutTagText: { color: '#fff', fontSize: rs(11), fontWeight: '600' },
  info: { paddingHorizontal: '6%', paddingTop: '6%' },
  name: { fontSize: rs(13), fontWeight: '600', color: colors.text, minHeight: rs(34) },
  price: { fontSize: rs(16), fontWeight: '800', color: colors.primary, marginTop: rs(4) },
  stockNote: { fontSize: rs(11), color: colors.success, marginTop: rs(2) },
  stockNoteLow: { color: colors.warning, fontWeight: '600' },
  button: {
    margin: '6%',
    marginTop: rs(8),
    minHeight: rs(42),
    borderRadius: rs(10),
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: rs(6),
  },
  buttonPressed: { opacity: 0.85 },
  buttonDisabled: { backgroundColor: colors.disabled },
  buttonText: { color: '#fff', fontSize: rs(12), fontWeight: '700' },
  buttonTextDisabled: { color: colors.disabledText },
});
