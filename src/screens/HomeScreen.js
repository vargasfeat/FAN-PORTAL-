import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { updateProfile } from '../services/authApi';
import { fetchTeam } from '../services/sportsApi';
import { colors, rs } from '../theme';

export default function HomeScreen({ user, navigate, onLogout, onUpdateUser }) {
  const [team, setTeam] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [currentUser, setCurrentUser] = useState(user);
  const [nombreInput, setNombreInput] = useState(user?.name || user?.nombre || '');
  const [emailInput, setEmailInput] = useState(user?.email || '');
  const [passwordInput, setPasswordInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  useEffect(() => {
    setCurrentUser(user);
  }, [user]);

  useEffect(() => {
    let active = true;
    fetchTeam().then((res) => active && setTeam(res));
    return () => {
      active = false;
    };
  }, []);

  const info = team?.data;
  const offline = team && team.source !== 'live';

  const fullName = currentUser?.name || currentUser?.nombre || 'Socio';
  const firstName = fullName.split(' ')[0];
  const memberLabel = currentUser?.memberType || (currentUser?.role === 'admin' ? 'Administrador' : 'Socio Activo');
  const rutValue = currentUser?.rut || 'No registrado';
  const emailValue = currentUser?.email || 'No registrado';
  const roleValue = currentUser?.role || 'socio';

  const openProfileModal = () => {
    setNombreInput(fullName);
    setEmailInput(currentUser?.email || '');
    setPasswordInput('');
    setProfileError('');
    setProfileSuccess('');
    setIsEditing(false);
    setShowProfile(true);
  };

  const handleSaveProfile = async () => {
    if (nombreInput.trim().length < 2) {
      return setProfileError('El nombre debe tener al menos 2 caracteres.');
    }
    if (passwordInput && passwordInput.length < 4) {
      return setProfileError('La nueva contraseña debe tener al menos 4 caracteres.');
    }

    setProfileError('');
    setProfileSuccess('');
    setSaving(true);

    try {
      const updated = await updateProfile({
        rut: rutValue,
        nombre: nombreInput.trim(),
        email: emailInput.trim() || null,
        password: passwordInput || undefined,
        token: currentUser?.token,
      });

      const mergedUser = {
        ...currentUser,
        name: updated?.nombre || nombreInput.trim(),
        nombre: updated?.nombre || nombreInput.trim(),
        email: updated?.email ?? (emailInput.trim() || null),
      };

      setCurrentUser(mergedUser);
      if (onUpdateUser) onUpdateUser(mergedUser);

      setPasswordInput('');
      setIsEditing(false);
      setProfileSuccess('Perfil actualizado correctamente.');
    } catch (e) {
      setProfileError(e.message || 'No se pudo actualizar el perfil.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable
          style={styles.headerText}
          onPress={openProfileModal}
          accessibilityRole="button"
          accessibilityLabel="Ver o editar datos de mi perfil"
        >
          <View style={styles.greetingRow}>
            <Text style={styles.greeting}>Hola, {firstName}</Text>
            <Ionicons name="person-circle-outline" size={rs(20)} color="#fff" style={styles.profileIcon} />
          </View>
          <Text style={styles.member}>{memberLabel} · Ver perfil</Text>
        </Pressable>

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
              {info?.badge ? (
                <Image source={{ uri: info.badge }} style={styles.badge} resizeMode="contain" />
              ) : (
                <Text style={styles.badgeFallback}>⚽</Text>
              )}
            </View>
            <View style={styles.teamInfo}>
              <Text style={styles.teamName} numberOfLines={1}>
                {info?.name}
              </Text>
              <Text style={styles.teamMeta} numberOfLines={1}>
                {[info?.stadium, info?.formedYear && `Fundado en ${info.formedYear}`].filter(Boolean).join(' · ') ||
                  info?.league}
              </Text>
              {offline && <Text style={styles.offline}>Datos del club no disponibles en línea</Text>}
            </View>
          </>
        )}
      </View>

      <Text style={styles.question}>¿Qué quieres hacer hoy?</Text>

      {/* Acciones principales */}
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

      {currentUser?.role === 'admin' && !!currentUser?.token && (
        <Pressable
          style={({ pressed }) => [styles.adminBtn, pressed && styles.pressed]}
          onPress={() => navigate('admin')}
          accessibilityRole="button"
        >
          <Ionicons name="settings-outline" size={rs(20)} color={colors.primary} />
          <Text style={styles.adminText}>Modo administrador</Text>
        </Pressable>
      )}

      {/* Modal de perfil (Lectura y Edición) */}
      <Modal
        visible={showProfile}
        animationType="slide"
        transparent
        onRequestClose={() => setShowProfile(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalTitle}>
                  {isEditing ? 'Editar perfil' : 'Mis datos de perfil'}
                </Text>
                {!isEditing && (
                  <Pressable
                    onPress={() => {
                      setProfileError('');
                      setProfileSuccess('');
                      setIsEditing(true);
                    }}
                    style={styles.editBadge}
                  >
                    <Ionicons name="create-outline" size={rs(16)} color={colors.primary} />
                    <Text style={styles.editBadgeText}>Editar</Text>
                  </Pressable>
                )}
              </View>

              {!!profileError && <Text style={styles.errorText}>{profileError}</Text>}
              {!!profileSuccess && <Text style={styles.successText}>{profileSuccess}</Text>}

              {!isEditing ? (
                <View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Nombre</Text>
                    <Text style={styles.infoValue}>{fullName}</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>RUT</Text>
                    <Text style={styles.infoValue}>{rutValue}</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Correo</Text>
                    <Text style={styles.infoValue}>{emailValue}</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Tipo / Rol</Text>
                    <Text style={styles.infoValue}>{roleValue}</Text>
                  </View>

                  <Pressable style={styles.modalButton} onPress={() => setShowProfile(false)}>
                    <Text style={styles.modalButtonText}>Cerrar</Text>
                  </Pressable>
                </View>
              ) : (
                <View>
                  <Text style={styles.inputLabel}>RUT (no editable)</Text>
                  <TextInput
                    style={[styles.input, styles.inputDisabled]}
                    value={rutValue}
                    editable={false}
                  />

                  <Text style={styles.inputLabel}>Nombre completo</Text>
                  <TextInput
                    style={styles.input}
                    value={nombreInput}
                    onChangeText={setNombreInput}
                    placeholder="Tu nombre"
                    placeholderTextColor={colors.disabledText}
                  />

                  <Text style={styles.inputLabel}>Correo electrónico</Text>
                  <TextInput
                    style={styles.input}
                    value={emailInput}
                    onChangeText={setEmailInput}
                    placeholder="correo@ejemplo.cl"
                    placeholderTextColor={colors.disabledText}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />

                  <Text style={styles.inputLabel}>Nueva contraseña (dejar vacío para mantener)</Text>
                  <TextInput
                    style={styles.input}
                    value={passwordInput}
                    onChangeText={setPasswordInput}
                    placeholder="••••••••"
                    placeholderTextColor={colors.disabledText}
                    secureTextEntry
                    autoCapitalize="none"
                  />

                  <View style={styles.editActions}>
                    <Pressable
                      style={[styles.secondaryBtn, saving && { opacity: 0.6 }]}
                      disabled={saving}
                      onPress={() => {
                        setIsEditing(false);
                        setProfileError('');
                      }}
                    >
                      <Text style={styles.secondaryBtnText}>Cancelar</Text>
                    </Pressable>

                    <Pressable
                      style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                      disabled={saving}
                      onPress={handleSaveProfile}
                    >
                      {saving ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.modalButtonText}>Guardar</Text>
                      )}
                    </Pressable>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  greetingRow: { flexDirection: 'row', alignItems: 'center' },
  greeting: { fontSize: rs(22), fontWeight: '800', color: '#fff' },
  profileIcon: { marginLeft: rs(8) },
  member: { fontSize: rs(13), color: colors.onPrimaryMuted, marginTop: rs(2) },
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
  adminBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: rs(48),
    marginHorizontal: '6%',
    marginBottom: '4%',
    borderRadius: rs(14),
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  adminText: { fontSize: rs(14), fontWeight: '800', color: colors.primary, marginLeft: rs(8) },
  pressed: { opacity: 0.88, transform: [{ scale: 0.99 }] },
  actionTitle: { fontSize: rs(22), fontWeight: '800', color: '#fff', marginTop: rs(10) },
  actionDesc: { fontSize: rs(14), color: 'rgba(255,255,255,0.85)', marginTop: rs(4) },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  modalCard: {
    maxHeight: '85%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: rs(20),
    borderTopRightRadius: rs(20),
    padding: '6%',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: rs(14),
  },
  modalTitle: { fontSize: rs(18), fontWeight: '800', color: colors.text },
  editBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: rs(10),
    paddingVertical: rs(6),
    borderRadius: rs(8),
    borderWidth: 1,
    borderColor: colors.primary,
  },
  editBadgeText: { fontSize: rs(13), fontWeight: '700', color: colors.primary, marginLeft: rs(4) },
  errorText: { color: colors.accent, fontSize: rs(13), marginBottom: rs(10) },
  successText: { color: '#15803d', fontSize: rs(13), fontWeight: '600', marginBottom: rs(10) },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: rs(10),
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: { fontSize: rs(14), fontWeight: '600', color: colors.muted },
  infoValue: { fontSize: rs(14), fontWeight: '700', color: colors.text },
  inputLabel: { fontSize: rs(13), fontWeight: '600', color: colors.text, marginBottom: rs(5) },
  input: {
    width: '100%',
    minHeight: rs(46),
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: rs(10),
    paddingHorizontal: '4%',
    fontSize: rs(15),
    color: colors.text,
    backgroundColor: colors.background,
    marginBottom: rs(12),
  },
  inputDisabled: { opacity: 0.6 },
  editActions: { flexDirection: 'row', marginTop: rs(6) },
  secondaryBtn: {
    flex: 1,
    minHeight: rs(50),
    borderRadius: rs(12),
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: rs(10),
  },
  secondaryBtnText: { fontSize: rs(15), fontWeight: '700', color: colors.text },
  saveBtn: {
    flex: 1,
    minHeight: rs(50),
    borderRadius: rs(12),
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButton: {
    marginTop: rs(18),
    minHeight: rs(50),
    borderRadius: rs(12),
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonText: { color: '#fff', fontSize: rs(16), fontWeight: '700' },
});