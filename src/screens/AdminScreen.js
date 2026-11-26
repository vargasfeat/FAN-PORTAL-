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
  const [photo, setPhoto] = useState(null); // { uri, base64 } elegida en este editor
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!visible) return;
    setName(product?.name ?? '');
    setPrice(product ? String(product.price) : '');
    setStock(product ? String(product.stock) : '');
    setActive(product ? product.active : true);
    setPhoto(null);
    setError('');
    setSaving(false);
  }, [visible, product]);

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
      if (!base64 && asset.uri?.startsWith('data:')) base64 = asset.uri.split(',')[1];
      if (!base64) throw new Error('No se pudo leer la imagen elegida.');
      setPhoto({ uri: asset.uri, base64 });
    } catch (e) {
      setError(e.message || 'No se pudo abrir la galería.');
    }
  };

  const save = async () => {
    if (!name.trim()) return setError('Escribe el nombre del producto.');
    if (price === '') return setError('Escribe el precio.');
    if (stock === '') return setError('Escribe el stock (0 si está agotado).');

    setSaving(true);
    setError('');
    try {
      const data = { name: name.trim(), price: Number(price), stock: Number(stock), active };
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
                <Text style={styles.label}>Stock</Text>
                <TextInput style={styles.input} value={stock} onChangeText={(t) => setStock(digits(t))} keyboardType="number-pad" placeholder="10" placeholderTextColor={colors.disabledText} />
                <Text style={styles.hint}>0 = Agotado</Text>
              </View>
            </View>

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
