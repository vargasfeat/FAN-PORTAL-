import React, { memo, useEffect, useMemo, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, rs } from '../theme';
import { formatCLP } from '../utils/helpers';

function normalizeSizes(product) {
  if (Array.isArray(product.sizes) && product.sizes.length > 0) {
    return product.sizes.map((s) => ({
      talla: String(s.talla || 'Única').trim(),
      stock: Number(s.stock ?? 0),
    }));
  }
  return [{ talla: 'Única', stock: Number(product.stock ?? 0) }];
}

function ProductCard({ product, cartQtyBySize = {}, onAdd }) {
  const [imgFailed, setImgFailed] = useState(false);
  const [sizeMenuOpen, setSizeMenuOpen] = useState(false);

  const sizeOptions = useMemo(() => normalizeSizes(product), [product]);
  const isSingleSize = sizeOptions.length === 1;

  const defaultSize = useMemo(() => {
    const firstAvailable = sizeOptions.find((s) => s.stock > 0);
    return (firstAvailable || sizeOptions[0]).talla;
  }, [sizeOptions]);

  const [selectedSize, setSelectedSize] = useState(defaultSize);

  useEffect(() => {
    if (!sizeOptions.some((s) => s.talla === selectedSize)) {
      setSelectedSize(defaultSize);
    }
  }, [sizeOptions, selectedSize, defaultSize]);

  const activeSizeObj = sizeOptions.find((s) => s.talla === selectedSize) || sizeOptions[0];
  const activeStock = activeSizeObj ? activeSizeObj.stock : Number(product.stock ?? 0);
  const inCartQty = cartQtyBySize[selectedSize] || 0;

  // PC-02: stock <= 0 => estado visual deshabilitado y sin acción posible
  const allSoldOut = sizeOptions.every((s) => s.stock <= 0);
  const soldOut = activeStock <= 0;
  const reachedLimit = !soldOut && inCartQty >= activeStock;
  const disabled = soldOut || reachedLimit;
  const lowStock = !soldOut && activeStock <= 3;

  const label = soldOut ? 'Agotado' : reachedLimit ? 'Máximo en carrito' : 'Agregar al carrito';

  const handleAddPress = () => {
    if (disabled) return;
    onAdd({
      ...product,
      selectedSize,
      selectedStock: activeStock,
    });
  };

  return (
    <View style={styles.card}>
      <Pressable
        onPress={() => !isSingleSize && setSizeMenuOpen(true)}
        disabled={isSingleSize}
        style={[styles.imageBox, allSoldOut && styles.imageBoxSoldOut]}
      >
        {product.image && !imgFailed ? (
          <Image
            source={{ uri: product.image }}
            style={[styles.photo, allSoldOut && styles.photoSoldOut]}
            resizeMode="cover"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <Text style={[styles.emoji, allSoldOut && styles.emojiSoldOut]}>{product.emoji}</Text>
        )}
        {allSoldOut && (
          <View style={styles.soldOutTag}>
            <Text style={styles.soldOutTagText}>Sin stock</Text>
          </View>
        )}
      </Pressable>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={styles.price}>{formatCLP(product.price)}</Text>
        <Text style={[styles.stockNote, lowStock && styles.stockNoteLow]} numberOfLines={1}>
          {soldOut ? 'Sin stock en esta talla' : lowStock ? `Quedan ${activeStock}` : 'Disponible'}
        </Text>

        {isSingleSize ? (
          <View style={styles.singleSizeBadge}>
            <Text style={styles.singleSizeText} numberOfLines={1}>
              Talla: {sizeOptions[0].talla}
            </Text>
          </View>
        ) : (
          <Pressable
            onPress={() => setSizeMenuOpen(true)}
            style={({ pressed }) => [styles.dropdownBtn, pressed && { opacity: 0.8 }]}
            accessibilityRole="button"
            accessibilityLabel={`Seleccionar talla para ${product.name}, actual ${selectedSize}`}
          >
            <Text style={styles.dropdownText} numberOfLines={1}>
              Talla: {selectedSize}
            </Text>
            <Ionicons name="chevron-down" size={rs(14)} color={colors.primary} />
          </Pressable>
        )}
      </View>

      <Pressable
        disabled={disabled}
        onPress={handleAddPress}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        accessibilityLabel={`${label}: ${product.name} talla ${selectedSize}`}
        style={({ pressed }) => [styles.button, disabled && styles.buttonDisabled, pressed && !disabled && styles.buttonPressed]}
      >
        <Text style={[styles.buttonText, disabled && styles.buttonTextDisabled]} numberOfLines={1}>
          {label}
        </Text>
      </Pressable>

      {!isSingleSize && (
        <Modal
          visible={sizeMenuOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setSizeMenuOpen(false)}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setSizeMenuOpen(false)}>
            <Pressable style={styles.modalCard} onPress={() => {}}>
              <Text style={styles.modalTitle}>Selecciona tu talla</Text>
              <Text style={styles.modalSubtitle} numberOfLines={2}>
                {product.name}
              </Text>
              <ScrollView style={styles.modalList}>
                {sizeOptions.map((opt) => {
                  const isSelected = opt.talla === selectedSize;
                  const out = opt.stock <= 0;
                  return (
                    <Pressable
                      key={opt.talla}
                      disabled={out}
                      onPress={() => {
                        setSelectedSize(opt.talla);
                        setSizeMenuOpen(false);
                      }}
                      style={[
                        styles.sizeOption,
                        isSelected && styles.sizeOptionSelected,
                        out && styles.sizeOptionDisabled,
                      ]}
                    >
                      <Text
                        style={[
                          styles.sizeOptionLabel,
                          isSelected && styles.sizeOptionLabelSelected,
                          out && styles.sizeOptionLabelDisabled,
                        ]}
                      >
                        Talla {opt.talla}
                      </Text>
                      <Text style={[styles.sizeOptionStock, out && styles.sizeOptionStockOut]}>
                        {out ? 'Agotado' : `${opt.stock} disp.`}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
              <Pressable style={styles.modalCloseBtn} onPress={() => setSizeMenuOpen(false)}>
                <Text style={styles.modalCloseText}>Cerrar</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>
      )}
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
  singleSizeBadge: {
    marginTop: rs(8),
    minHeight: rs(34),
    borderRadius: rs(8),
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: rs(10),
    justifyContent: 'center',
  },
  singleSizeText: { fontSize: rs(12), fontWeight: '600', color: colors.muted },
  dropdownBtn: {
    marginTop: rs(8),
    minHeight: rs(34),
    borderRadius: rs(8),
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: rs(10),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownText: { fontSize: rs(12), fontWeight: '700', color: colors.primary, flex: 1 },
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    paddingHorizontal: '8%',
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: rs(16),
    padding: rs(18),
    maxHeight: '70%',
  },
  modalTitle: { fontSize: rs(17), fontWeight: '800', color: colors.text },
  modalSubtitle: { fontSize: rs(13), color: colors.muted, marginTop: rs(2), marginBottom: rs(12) },
  modalList: { maxHeight: rs(260) },
  sizeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: rs(12),
    paddingHorizontal: rs(12),
    borderRadius: rs(10),
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: rs(8),
    backgroundColor: colors.background,
  },
  sizeOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.tint,
  },
  sizeOptionDisabled: {
    opacity: 0.5,
    backgroundColor: colors.softDisabled,
  },
  sizeOptionLabel: { fontSize: rs(14), fontWeight: '700', color: colors.text },
  sizeOptionLabelSelected: { color: colors.primary },
  sizeOptionLabelDisabled: { color: colors.disabledText },
  sizeOptionStock: { fontSize: rs(12), fontWeight: '600', color: colors.success },
  sizeOptionStockOut: { color: colors.muted },
  modalCloseBtn: {
    marginTop: rs(8),
    minHeight: rs(42),
    borderRadius: rs(10),
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: { color: '#fff', fontSize: rs(14), fontWeight: '700' },
});
