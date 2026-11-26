import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { createProduct, listAdminProducts, updateProduct, uploadProductImage } from '../services/adminApi';
import { colors, rs } from '../theme';
import { formatCLP } from '../utils/helpers';

const digits = (t) => t.replace(/[^0-9]/g, '');
const DEFAULT_SIZE_PRESETS = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

function hasMultipleOrNamedSizes(product) {
  if (!Array.isArray(product?.sizes) || product.sizes.length === 0) return false;
  if (product.sizes.length === 1 && String(product.sizes[0].talla || '').toLowerCase() === 'única') {
    return false;
  }
  return true;
}

function Thumb({ product, size }) {
  return (
    <View style={[styles.thumb, { width: size, height: size }]}>
      {product.image ? (
        <Image source={{ uri: product.image }} style={styles.thumbImg} resizeMode="cover" />
      ) : (
        <Text style={{ fontSize: size * 0.5 }}>{product.emoji}</Text>
      )}
    </View>
  );
}

/** Editor de un producto (nuevo o existente). */
function EditorModal({ visible, product, token, onClose, onSaved }) {
  const isNew = !product;
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [active, setActive] = useState(true);
  const [sizeMode, setSizeMode] = useState('single'); // 'single' | 'multiple'
  const [sizeRows, setSizeRows] = useState([]); // [{ talla, stock }]
  const [customSize, setCustomSize] = useState('');
  const [photo, setPhoto] = useState(null); // { uri, base64 } elegida en este editor
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!visible) return;
    setName(product?.name ?? '');
    setPrice(product ? String(product.price) : '');
    setStock(product ? String(product.stock) : '');
    setActive(product ? product.active : true);

    if (hasMultipleOrNamedSizes(product)) {
      setSizeMode('multiple');
      setSizeRows(
        product.sizes.map((s) => ({
          talla: String(s.talla),
          stock: String(s.stock ?? 0),
        }))
      );
    } else {
      setSizeMode('single');
      setSizeRows([
        { talla: 'S', stock: '0' },
        { talla: 'M', stock: '0' },
        { talla: 'L', stock: '0' },
        { talla: 'XL', stock: '0' },
      ]);
    }
    setCustomSize('');
    setPhoto(null);
    setError('');
    setSaving(false);
  }, [visible, product]);

  const togglePresetSize = (talla) => {
    setSizeRows((prev) => {
      const exists = prev.some((r) => r.talla.toUpperCase() === talla.toUpperCase());
      if (exists) return prev.filter((r) => r.talla.toUpperCase() !== talla.toUpperCase());
      return [...prev, { talla, stock: '0' }];
    });
  };

  const addCustomSize = () => {
    const clean = customSize.trim().toUpperCase();
    if (!clean) return;
    setSizeRows((prev) => {
      if (prev.some((r) => r.talla.toUpperCase() === clean)) return prev;
      return [...prev, { talla: clean, stock: '0' }];
    });
    setCustomSize('');
  };

  const updateSizeStock = (talla, val) => {
    const cleanNum = digits(val);
    setSizeRows((prev) =>
      prev.map((r) => (r.talla === talla ? { ...r, stock: cleanNum } : r))
    );
  };

  const totalSizeStock = sizeRows.reduce((sum, r) => sum + Number(r.stock || 0), 0);

  const pickPhoto = async () => {
    setError('');
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });
      if (result.canceled || !result.assets?.length) return;
      const asset = result.assets[0];
      let base64 = asset.base64;
      if (!base64 && asset.uri?.startsWith('data:')) {
        base64 = asset.uri.split(',')[1];
      }
      if (!base64 && asset.uri) {
        const resp = await fetch(asset.uri);
        const blob = await resp.blob();
        base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const resStr = String(reader.result || '');
            resolve(resStr.includes(',') ? resStr.split(',')[1] : '');
          };
          reader.onerror = () => reject(new Error('No se pudo leer la imagen elegida.'));
          reader.readAsDataURL(blob);
        });
      }
      if (!base64) throw new Error('No se pudo leer la imagen elegida.');
      setPhoto({ uri: asset.uri, base64 });
    } catch (e) {
      setError(e.message || 'No se pudo abrir la galería.');
    }
  };

  const save = async () => {
    if (!name.trim()) return setError('Escribe el nombre del producto.');
    if (price === '') return setError('Escribe el precio.');
    if (sizeMode === 'single' && stock === '') {
      return setError('Escribe el stock (0 si está agotado).');
    }
    if (sizeMode === 'multiple' && sizeRows.length === 0) {
      return setError('Selecciona al menos una talla o cambia a Talla única.');
    }

    setSaving(true);
    setError('');
    try {
      const sizesPayload =
        sizeMode === 'multiple'
          ? sizeRows.map((r) => ({ talla: r.talla, stock: Number(r.stock || 0) }))
          : [];
      const stockPayload = sizeMode === 'multiple' ? totalSizeStock : Number(stock);

      const data = {
        name: name.trim(),
        price: Number(price),
        stock: stockPayload,
        active,
        sizes: sizesPayload,
      };
      let saved = isNew ? await createProduct(token, data) : await updateProduct(token, product.id, data);
      if (photo) saved = await uploadProductImage(token, saved.id, photo.base64);
      onSaved(saved);
    } catch (e) {
      setError(e.message);
      setSaving(false);
    }
  };

  const preview = photo ? { image: photo.uri, emoji: '🛍️' } : product || { image: null, emoji: '🛍️' };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>{isNew ? 'Nuevo producto' : 'Editar producto'}</Text>

          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={styles.photoRow}>
              <Thumb product={preview} size={rs(86)} />
              <Pressable style={styles.photoBtn} onPress={pickPhoto} accessibilityRole="button">
                <Ionicons name="image-outline" size={rs(18)} color={colors.primary} />
                <Text style={styles.photoBtnText}>{photo ? 'Cambiar foto' : 'Elegir foto'}</Text>
              </Pressable>
            </View>
            {isNew && <Text style={styles.hint}>La foto es opcional: sin ella se muestra un ícono.</Text>}

            <Text style={styles.label}>Nombre</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} maxLength={80} placeholder="Camiseta Titular 2026" placeholderTextColor={colors.disabledText} />

            <View style={styles.twoCols}>
              <View style={styles.col}>
                <Text style={styles.label}>Precio (CLP)</Text>
                <TextInput style={styles.input} value={price} onChangeText={(t) => setPrice(digits(t))} keyboardType="number-pad" placeholder="34990" placeholderTextColor={colors.disabledText} />
                {price !== '' && <Text style={styles.hint}>{formatCLP(Number(price))}</Text>}
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>{sizeMode === 'multiple' ? 'Stock total' : 'Stock'}</Text>
                {sizeMode === 'multiple' ? (
                  <View style={[styles.input, styles.readOnlyBox]}>
                    <Text style={styles.readOnlyText}>{totalSizeStock}</Text>
                  </View>
                ) : (
                  <TextInput style={styles.input} value={stock} onChangeText={(t) => setStock(digits(t))} keyboardType="number-pad" placeholder="10" placeholderTextColor={colors.disabledText} />
                )}
                <Text style={styles.hint}>{sizeMode === 'multiple' ? 'Suma de tallas' : '0 = Agotado'}</Text>
              </View>
            </View>

            <Text style={styles.label}>Tallas del producto</Text>
            <View style={styles.modeRow}>
              <Pressable
                style={[styles.modeBtn, sizeMode === 'single' && styles.modeBtnActive]}
                onPress={() => setSizeMode('single')}
              >
                <Text style={[styles.modeBtnText, sizeMode === 'single' && styles.modeBtnTextActive]}>
                  Talla única
                </Text>
              </Pressable>
              <Pressable
                style={[styles.modeBtn, sizeMode === 'multiple' && styles.modeBtnActive]}
                onPress={() => setSizeMode('multiple')}
              >
                <Text style={[styles.modeBtnText, sizeMode === 'multiple' && styles.modeBtnTextActive]}>
                  Por tallas
                </Text>
              </Pressable>
            </View>

            {sizeMode === 'multiple' && (
              <View style={styles.sizesBox}>
                <Text style={styles.hint}>Activa las tallas disponibles e indica el stock de cada una:</Text>
                <View style={styles.chipsRow}>
                  {DEFAULT_SIZE_PRESETS.map((sz) => {
                    const activeChip = sizeRows.some((r) => r.talla.toUpperCase() === sz);
                    return (
                      <Pressable
                        key={sz}
                        onPress={() => togglePresetSize(sz)}
                        style={[styles.chip, activeChip && styles.chipActive]}
                      >
                        <Text style={[styles.chipText, activeChip && styles.chipTextActive]}>{sz}</Text>
                      </Pressable>
                    );
                  })}
                </View>

                <View style={styles.customSizeRow}>
                  <TextInput
                    style={[styles.input, styles.customSizeInput]}
                    value={customSize}
                    onChangeText={setCustomSize}
                    maxLength={12}
                    placeholder="Otra talla (ej. 38, INF)"
                    placeholderTextColor={colors.disabledText}
                  />
                  <Pressable style={styles.customSizeBtn} onPress={addCustomSize}>
                    <Text style={styles.customSizeBtnText}>Agregar</Text>
                  </Pressable>
                </View>

                {sizeRows.map((row) => (
                  <View key={row.talla} style={styles.sizeStockRow}>
                    <Text style={styles.sizeStockLabel}>Talla {row.talla}</Text>
                    <TextInput
                      style={styles.sizeStockInput}
                      value={row.stock}
                      onChangeText={(t) => updateSizeStock(row.talla, t)}
                      keyboardType="number-pad"
                      placeholder="0"
                      placeholderTextColor={colors.disabledText}
                    />
                    <Pressable onPress={() => togglePresetSize(row.talla)} hitSlop={8}>
                      <Ionicons name="close-circle-outline" size={rs(20)} color={colors.muted} />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Visible en la tienda</Text>
              <Switch value={active} onValueChange={setActive} trackColor={{ true: colors.accent }} />
            </View>

            {!!error && <Text style={styles.error}>{error}</Text>}
          </ScrollView>

          <View style={styles.actionsRow}>
            <Pressable style={[styles.btn, styles.btnGhost]} onPress={onClose} disabled={saving}>
              <Text style={styles.btnGhostText}>Cancelar</Text>
            </Pressable>
            <Pressable style={[styles.btn, saving && styles.btnDisabled]} onPress={save} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Guardar</Text>}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function AdminScreen({ user, navigate }) {
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [editing, setEditing] = useState(null); // { product } | { product: null } para nuevo
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await listAdminProducts(user.token);
      setItems(res.items);
      setError('');
    } catch (e) {
      setError(e.message);
      setItems((prev) => prev || []);
    }
  }, [user.token]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const onSaved = (saved) => {
    setItems((prev) => {
      const exists = prev.some((p) => p.id === saved.id);
      return exists ? prev.map((p) => (p.id === saved.id ? saved : p)) : [...prev, saved];
    });
    setEditing(null);
    setNotice(`"${saved.name}" guardado`);
    setTimeout(() => setNotice(''), 2000);
  };

  // Seguridad: sin token valido no se muestra nada (el backend tambien lo exige)
  if (!user.token || user.role !== 'admin') {
    return (
      <View style={styles.denied}>
        <Ionicons name="lock-closed-outline" size={rs(56)} color={colors.disabled} />
        <Text style={styles.deniedText}>Este modo requiere iniciar sesión como administrador con el servidor activo.</Text>
        <Pressable style={styles.btn} onPress={() => navigate('home')}>
          <Text style={styles.btnText}>Volver al inicio</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigate('home')} hitSlop={12} accessibilityLabel="Volver">
          <Ionicons name="chevron-back" size={rs(26)} color="#fff" />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Modo administrador</Text>
          <Text style={styles.headerSub}>Precios, stock y fotos de la tienda</Text>
        </View>
        <Pressable style={styles.addBtn} onPress={() => setEditing({ product: null })} accessibilityRole="button">
          <Ionicons name="add" size={rs(18)} color="#fff" />
          <Text style={styles.addBtnText}>Nuevo</Text>
        </Pressable>
      </View>

      {!!error && <Text style={styles.banner}>{error}</Text>}

      <FlatList
        data={items || []}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <Pressable style={[styles.row, !item.active && styles.rowHidden]} onPress={() => setEditing({ product: item })} accessibilityRole="button">
            <Thumb product={item} size={rs(54)} />
            <View style={styles.rowInfo}>
              <Text style={styles.rowName} numberOfLines={2}>{item.name}</Text>
              <Text style={styles.rowMeta}>
                {formatCLP(item.price)} · {item.stock <= 0 ? 'Agotado' : `Stock ${item.stock}`}
                {hasMultipleOrNamedSizes(item)
                  ? ` · Tallas: ${item.sizes.map((s) => s.talla).join(', ')}`
                  : ' · Talla única'}
                {!item.active ? ' · Oculto' : ''}
              </Text>
            </View>
            <Ionicons name="create-outline" size={rs(22)} color={colors.muted} />
          </Pressable>
        )}
        ListEmptyComponent={!items ? <ActivityIndicator style={styles.loader} color={colors.primary} /> : null}
      />

      {!!notice && (
        <View style={styles.toast} pointerEvents="none">
          <Text style={styles.toastText}>{notice}</Text>
        </View>
      )}

      <EditorModal
        visible={!!editing}
        product={editing?.product || null}
        token={user.token}
        onClose={() => setEditing(null)}
        onSaved={onSaved}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: '4%',
    paddingVertical: '4%',
    borderBottomLeftRadius: rs(20),
    borderBottomRightRadius: rs(20),
  },
  headerText: { flex: 1, marginLeft: rs(8) },
  headerTitle: { fontSize: rs(18), fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: rs(12), color: colors.onPrimaryMuted, marginTop: rs(2) },
  addBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.accent, borderRadius: rs(10), paddingHorizontal: rs(12), paddingVertical: rs(8) },
  addBtnText: { color: '#fff', fontWeight: '800', fontSize: rs(13), marginLeft: rs(2) },
  banner: { backgroundColor: colors.accentTint, color: colors.accent, fontSize: rs(13), fontWeight: '600', padding: rs(10), marginHorizontal: '4%', marginTop: rs(10), borderRadius: rs(8) },
  list: { paddingHorizontal: '4%', paddingTop: rs(12), paddingBottom: rs(24) },
  loader: { paddingVertical: rs(40) },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: rs(12), borderWidth: 1, borderColor: colors.border, padding: rs(10), marginBottom: rs(8) },
  rowHidden: { opacity: 0.55 },
  rowInfo: { flex: 1, marginHorizontal: rs(10) },
  rowName: { fontSize: rs(14), fontWeight: '700', color: colors.text },
  rowMeta: { fontSize: rs(12), color: colors.muted, marginTop: rs(2) },
  thumb: { borderRadius: rs(10), backgroundColor: colors.tint, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  thumbImg: { width: '100%', height: '100%' },
  toast: { position: 'absolute', left: '8%', right: '8%', bottom: rs(16), backgroundColor: colors.text, borderRadius: rs(12), padding: rs(12) },
  toastText: { color: '#fff', textAlign: 'center', fontWeight: '600', fontSize: rs(13) },
  denied: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background, paddingHorizontal: '10%' },
  deniedText: { fontSize: rs(14), color: colors.muted, textAlign: 'center', marginVertical: rs(14) },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet: { maxHeight: '90%', backgroundColor: colors.surface, borderTopLeftRadius: rs(20), borderTopRightRadius: rs(20), padding: '5%' },
  sheetTitle: { fontSize: rs(18), fontWeight: '800', color: colors.text, marginBottom: rs(12) },
  photoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: rs(8) },
  photoBtn: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: colors.primary, borderRadius: rs(10), paddingHorizontal: rs(14), minHeight: rs(44), marginLeft: rs(14) },
  photoBtnText: { color: colors.primary, fontWeight: '700', fontSize: rs(14), marginLeft: rs(6) },
  label: { fontSize: rs(13), fontWeight: '600', color: colors.text, marginTop: rs(10), marginBottom: rs(6) },
  input: { minHeight: rs(48), borderWidth: 1, borderColor: colors.border, borderRadius: rs(10), paddingHorizontal: '4%', fontSize: rs(16), color: colors.text, backgroundColor: colors.background },
  hint: { fontSize: rs(11), color: colors.muted, marginTop: rs(4) },
  twoCols: { flexDirection: 'row', justifyContent: 'space-between' },
  col: { width: '48%' },
  readOnlyBox: { justifyContent: 'center', opacity: 0.7 },
  readOnlyText: { fontSize: rs(16), fontWeight: '700', color: colors.text },
  modeRow: { flexDirection: 'row', gap: rs(8) },
  modeBtn: {
    flex: 1,
    minHeight: rs(42),
    borderRadius: rs(10),
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeBtnActive: { borderColor: colors.primary, backgroundColor: colors.tint },
  modeBtnText: { fontSize: rs(13), fontWeight: '700', color: colors.muted },
  modeBtnTextActive: { color: colors.primary },
  sizesBox: {
    marginTop: rs(10),
    padding: rs(10),
    borderRadius: rs(12),
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: rs(6), marginTop: rs(8) },
  chip: {
    paddingHorizontal: rs(12),
    paddingVertical: rs(6),
    borderRadius: rs(8),
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  chipText: { fontSize: rs(12), fontWeight: '700', color: colors.text },
  chipTextActive: { color: '#fff' },
  customSizeRow: { flexDirection: 'row', alignItems: 'center', marginTop: rs(10), gap: rs(8) },
  customSizeInput: { flex: 1, minHeight: rs(40), fontSize: rs(14) },
  customSizeBtn: {
    minHeight: rs(40),
    paddingHorizontal: rs(12),
    borderRadius: rs(10),
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customSizeBtnText: { color: '#fff', fontSize: rs(12), fontWeight: '700' },
  sizeStockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: rs(8),
    paddingVertical: rs(6),
    paddingHorizontal: rs(10),
    borderRadius: rs(8),
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sizeStockLabel: { fontSize: rs(13), fontWeight: '700', color: colors.text, flex: 1 },
  sizeStockInput: {
    width: rs(72),
    minHeight: rs(36),
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: rs(8),
    paddingHorizontal: rs(8),
    textAlign: 'center',
    fontSize: rs(14),
    color: colors.text,
    backgroundColor: colors.background,
    marginRight: rs(8),
  },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: rs(16) },
  switchLabel: { fontSize: rs(14), fontWeight: '600', color: colors.text },
  error: { color: colors.accent, fontSize: rs(13), marginTop: rs(12) },
  actionsRow: { flexDirection: 'row', marginTop: rs(16) },
  btn: { flex: 1, minHeight: rs(50), borderRadius: rs(12), backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', paddingHorizontal: rs(16) },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: rs(15), fontWeight: '800' },
  btnGhost: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.border, marginRight: rs(10) },
  btnGhostText: { color: colors.text, fontSize: rs(15), fontWeight: '700' },
});
