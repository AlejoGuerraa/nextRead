import React, { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import AppHeader from '../components/AppHeader';
import ScreenBackground from '../components/ScreenBackground';
import KeyboardAwareScroll from '../components/KeyboardAwareScroll';
import Avatar from '../components/Avatar';
import Input from '../components/Input';
import Button from '../components/Button';
import { Loading } from '../components/StateViews';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { catalogApi, usersApi } from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import { assetUrl, parseList } from '../utils/helpers';
import { AuthorPicker, GenrePicker, splitTastes } from '../components/TastePickers';
import { colors, radius } from '../theme';

export default function EditProfileScreen({ navigation }) {
  const { profile, refreshProfile } = useAuth();
  const toast = useToast();
  const [icons, setIcons] = useState([]);
  const [banners, setBanners] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState(null);

  useEffect(() => {
    if (!profile || form) return;
    setForm({
      nombre: profile.nombre || '',
      apellido: profile.apellido || '',
      descripcion: profile.descripcion || '',
      icono: profile.iconoData?.simbolo || null,
      banner: profile.bannerData?.url || null,
      generos: splitTastes(profile.genero_preferido),
      autores: splitTastes(profile.autor_preferido),
      titulo_preferido: profile.titulo_preferido || '',
    });
  }, [profile, form]);

  useEffect(() => {
    const ownedIcons = parseList(profile?.iconos_obtenidos).map(Number);
    const ownedBanners = parseList(profile?.banners_obtenidos).map(Number);
    catalogApi.iconos().then((list) => {
      const all = Array.isArray(list) ? list : [];
      const owned = all.filter((i) => ownedIcons.includes(Number(i.id)));
      setIcons((owned.length ? owned : all).map((i) => i.simbolo));
    }).catch(() => {});
    catalogApi.banners().then((list) => {
      const all = Array.isArray(list) ? list : [];
      const owned = all.filter((b) => ownedBanners.includes(Number(b.id)));
      setBanners((owned.length ? owned : all).map((b) => b.url));
    }).catch(() => {});
    catalogApi.autores().then((a) => setAuthors(Array.isArray(a) ? a : [])).catch(() => {});
  }, [profile?.iconos_obtenidos, profile?.banners_obtenidos]);

  if (!form) {
    return (
      <View style={styles.container}>
      <ScreenBackground />
        <AppHeader back title="Editar perfil" />
        <Loading />
      </View>
    );
  }

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const save = async () => {
    const e = {};
    if (form.nombre.trim().length < 2) e.nombre = 'Mínimo 2 caracteres';
    if (form.apellido.trim().length < 2) e.apellido = 'Mínimo 2 caracteres';
    setErrors(e);
    if (Object.keys(e).length) return;

    const payload = {
      nombre: form.nombre.trim(),
      apellido: form.apellido.trim(),
      descripcion: form.descripcion.trim(),
      genero_preferido: form.generos.join(', '),
      autor_preferido: form.autores.join(', '),
      titulo_preferido: form.titulo_preferido.trim().slice(0, 50),
    };
    if (form.icono) payload.icono = form.icono;
    if (form.banner) payload.banner = form.banner;

    setSaving(true);
    try {
      await usersApi.editProfile(payload);
      await refreshProfile();
      toast.show('Perfil actualizado');
      navigation.goBack();
    } catch (err) {
      toast.show(getErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScreenBackground />
      <AppHeader back title="Editar perfil" />
      <KeyboardAwareScroll contentContainerStyle={{ padding: 16, paddingBottom: 50 }}>
          {/* Preview */}
          <View style={styles.preview}>
            {form.banner ? <Image source={{ uri: assetUrl(form.banner) }} style={styles.previewBanner} /> : <View style={[styles.previewBanner, { backgroundColor: colors.panelLight }]} />}
            <Avatar src={form.icono} name={profile.usuario} size={84} border style={{ marginTop: -42 }} />
          </View>

          <Text style={styles.label}>Ícono</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingVertical: 4 }}>
            {icons.map((p) => (
              <Pressable key={p} onPress={() => set('icono')(p)}>
                <Avatar src={p} size={54} style={[styles.pick, form.icono === p && styles.picked]} />
              </Pressable>
            ))}
          </ScrollView>

          <Text style={styles.label}>Banner</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingVertical: 4 }}>
            {banners.map((p) => (
              <Pressable key={p} onPress={() => set('banner')(p)}>
                <Image source={{ uri: assetUrl(p) }} style={[styles.bannerPick, form.banner === p && styles.picked]} />
              </Pressable>
            ))}
          </ScrollView>

          <View style={{ marginTop: 18 }}>
            <Input dark={false} label="Nombre" value={form.nombre} onChangeText={set('nombre')} maxLength={20} error={errors.nombre} />
            <Input dark={false} label="Apellido" value={form.apellido} onChangeText={set('apellido')} maxLength={20} error={errors.apellido} />
            <Input dark={false} label="Descripción" value={form.descripcion} onChangeText={set('descripcion')} multiline maxLength={300} hint={`${form.descripcion.length}/300`} />
          </View>

          <Text style={styles.label}>Géneros favoritos (hasta 5)</Text>
          <GenrePicker value={form.generos} onChange={set('generos')} max={5} dark={false} />

          <Text style={[styles.label, { marginTop: 20 }]}>Autores favoritos (hasta 3)</Text>
          <AuthorPicker authors={authors} value={form.autores} onChange={set('autores')} max={3} dark={false} />

          <View style={{ height: 18 }} />
          <Input dark={false} label="Libro favorito" value={form.titulo_preferido} onChangeText={set('titulo_preferido')} maxLength={50} />

          <Button title="Guardar cambios" icon="checkmark" onPress={save} loading={saving} style={{ marginTop: 10 }} />
      </KeyboardAwareScroll>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  preview: { alignItems: 'center', marginBottom: 8 },
  previewBanner: { width: '100%', height: 110, borderRadius: radius.md },
  label: { fontSize: 13, fontWeight: '800', color: colors.text, marginTop: 14, marginBottom: 6, marginLeft: 4 },
  pick: { borderWidth: 3, borderColor: 'transparent' },
  picked: { borderWidth: 3, borderColor: colors.primary },
  bannerPick: { width: 140, height: 64, borderRadius: 10, borderWidth: 3, borderColor: 'transparent' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: colors.card, paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.pill },
  chipActive: { backgroundColor: colors.primary },
  chipText: { color: colors.text, fontWeight: '600', fontSize: 13 },
});
