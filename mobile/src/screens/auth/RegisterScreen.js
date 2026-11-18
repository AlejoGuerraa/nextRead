import React, { useEffect, useRef, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AuthLayout from './AuthLayout';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Avatar from '../../components/Avatar';
import DatePickerModal, { MESES } from '../../components/DatePickerModal';
import { GenrePicker, AuthorPicker } from '../../components/TastePickers';
import { LogoText } from '../../components/Logo';
import { useAuth } from '../../context/AuthContext';
import { authApi, catalogApi, usersApi } from '../../api/endpoints';
import { getErrorMessage } from '../../api/client';
import { assetUrl } from '../../utils/helpers';
import { colors, radius } from '../../theme';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USER_RE = /^[a-zA-Z0-9_]+$/;
const STEPS = ['Cuenta', 'Datos', 'Perfil', 'Géneros', 'Autores'];
const MIN_AGE = 13;

const DEFAULT_ICONS = ['/iconos/LogoDefault1.jpg', '/iconos/LogoDefault2.png', '/iconos/LogoDefault3.jpg', '/iconos/LogoDefault4.png', '/iconos/LogoDefault5.png', '/iconos/LogoDefault6.png'];
const DEFAULT_BANNERS = ['/banners/bannerSol.jpg', '/banners/bannerCienAS.png', '/banners/bannerMetamorfosis.jpg', '/banners/bannerSherlock.png', '/banners/bannerBiblioteca.jpg'];

/**
 * Valida la fecha: que exista (ej. no 31/02), que no sea futura,
 * que no tenga más de 120 años y que tenga la edad mínima.
 * Devuelve { error } o { age }.
 */
export function checkBirth({ dia, mes, anio }) {
  if (!dia || !mes || !anio) return { error: 'Completá la fecha (DD / MM / AAAA)' };
  const d = Number(dia), m = Number(mes), y = Number(anio);
  if (String(anio).length !== 4) return { error: 'El año tiene que tener 4 dígitos' };
  if (m < 1 || m > 12) return { error: 'El mes tiene que estar entre 1 y 12' };
  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) {
    return { error: `El ${d} de ${MESES[m - 1]} de ${y} no existe` };
  }
  const today = new Date();
  if (date > today) return { error: 'La fecha no puede ser futura' };
  let age = today.getFullYear() - y;
  if (today.getMonth() < m - 1 || (today.getMonth() === m - 1 && today.getDate() < d)) age -= 1;
  if (age > 120) return { error: 'La fecha no puede tener más de 120 años' };
  if (age < MIN_AGE) return { error: `Tenés que tener al menos ${MIN_AGE} años` };
  return { age };
}

const pad = (v) => String(v).padStart(2, '0');

export default function RegisterScreen({ navigation }) {
  const { register, refreshProfile } = useAuth();
  const [step, setStep] = useState(0);
  const [maxStep, setMaxStep] = useState(0); // hasta qué paso llegó (para saltar con el stepper)
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [icons, setIcons] = useState(DEFAULT_ICONS);
  const [banners, setBanners] = useState(DEFAULT_BANNERS);
  const [authors, setAuthors] = useState([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [form, setForm] = useState({
    correo: '',
    usuario: '',
    contrasena: '',
    confirmar: '',
    nombre: '',
    apellido: '',
    dia: '',
    mes: '',
    anio: '',
    icono: DEFAULT_ICONS[0],
    banner: DEFAULT_BANNERS[0],
    descripcion: '',
    generos: [],
    autores: [],
  });
  const stepRef = useRef(step);
  stepRef.current = step;

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  useEffect(() => {
    catalogApi.iconos().then((list) => {
      const paths = (list || []).map((i) => i.simbolo).filter(Boolean);
      if (paths.length) setIcons(paths);
    }).catch(() => {});
    catalogApi.banners().then((list) => {
      const paths = (list || []).map((b) => b.url).filter(Boolean);
      if (paths.length) setBanners(paths);
    }).catch(() => {});
    catalogApi.autores().then((list) => setAuthors(Array.isArray(list) ? list : [])).catch(() => {});
  }, []);

  // El botón/gesto "atrás" del celular vuelve un PASO, no sale del registro
  // (así no se pierde lo que ya completaste).
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (stepRef.current === 0 || e.data.action.type === 'REPLACE') return;
      e.preventDefault();
      setStep((s) => Math.max(0, s - 1));
    });
    return unsubscribe;
  }, [navigation]);

  const birth = form.dia && form.mes && form.anio.length === 4 ? checkBirth(form) : null;

  const validateStep = async () => {
    const e = {};
    if (step === 0) {
      if (!EMAIL_RE.test(form.correo.trim())) e.correo = 'Correo inválido';
      const u = form.usuario.trim();
      if (u.length < 3) e.usuario = 'Mínimo 3 caracteres';
      else if (!USER_RE.test(u)) e.usuario = 'Solo letras, números y guión bajo';
      if (form.contrasena.length < 8 || !/[A-Z]/.test(form.contrasena)) e.contrasena = 'Mínimo 8 caracteres y una mayúscula';
      if (form.confirmar !== form.contrasena) e.confirmar = 'Las contraseñas no coinciden';

      if (!Object.keys(e).length) {
        try {
          const [em, us] = await Promise.all([authApi.checkEmail(form.correo.trim()), authApi.checkUsername(u)]);
          if (em?.exists) e.correo = 'Ese correo ya está registrado';
          if (us?.exists) e.usuario = 'Ese nombre de usuario ya existe';
        } catch {
          // si falla el chequeo, el registro valida al final
        }
      }
    }
    if (step === 1) {
      if (form.nombre.trim().length < 2) e.nombre = 'Mínimo 2 caracteres';
      if (form.apellido.trim().length < 2) e.apellido = 'Mínimo 2 caracteres';
      const result = checkBirth(form);
      if (result.error) e.fecha = result.error;
    }
    if (step === 3 && form.generos.length === 0) e.generos = 'Elegí al menos un género';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = async () => {
    setLoading(true);
    const ok = await validateStep();
    setLoading(false);
    if (ok) {
      setStep((s) => s + 1);
      setMaxStep((m) => Math.max(m, step + 1));
    }
  };

  const back = () => {
    if (step === 0) navigation.goBack();
    else setStep((s) => s - 1);
  };

  const jumpTo = (i) => {
    if (i <= maxStep && i !== step) {
      setErrors({});
      setStep(i);
    }
  };

  const finish = async () => {
    setServerError('');
    setLoading(true);
    const payload = {
      nombre: form.nombre.trim(),
      apellido: form.apellido.trim(),
      correo: form.correo.trim(),
      usuario: form.usuario.trim(),
      contrasena: form.contrasena,
      fecha_nacimiento: `${form.anio}-${pad(form.mes)}-${pad(form.dia)}`,
      icono: form.icono,
      banner: form.banner,
    };
    if (form.descripcion.trim()) payload.descripcion = form.descripcion.trim();

    try {
      await register(payload); // registra + inicia sesión
      const tastes = {};
      if (form.generos.length) tastes.genero_preferido = form.generos.join(', ');
      if (form.autores.length) tastes.autor_preferido = form.autores.join(', ');
      if (Object.keys(tastes).length) {
        await usersApi.editProfile(tastes).catch(() => {});
        refreshProfile();
      }
    } catch (error) {
      setServerError(getErrorMessage(error, 'No fue posible completar el registro.'));
      setLoading(false);
    }
  };

  return (
    <AuthLayout onBack={back}>
      <Stepper step={step} maxStep={maxStep} onJump={jumpTo} />

      {step === 0 && (
        <>
          <Text style={styles.kicker}>BIENVENIDO A</Text>
          <LogoText size={32} style={{ textAlign: 'center', marginBottom: 22 }} />
          <Input label="Correo electrónico" placeholder="tu@correo.com" keyboardType="email-address" autoCapitalize="none" icon="mail-outline" value={form.correo} onChangeText={set('correo')} error={errors.correo} />
          <Input label="Nombre de usuario" placeholder="lector_123" autoCapitalize="none" icon="at-outline" value={form.usuario} onChangeText={set('usuario')} error={errors.usuario} maxLength={50} />
          <Input label="Contraseña" placeholder="Mínimo 8 caracteres" secure icon="lock-closed-outline" value={form.contrasena} onChangeText={set('contrasena')} error={errors.contrasena} hint="Al menos 8 caracteres y una letra mayúscula" />
          <Input label="Repetir contraseña" placeholder="••••••••" secure icon="lock-closed-outline" value={form.confirmar} onChangeText={set('confirmar')} error={errors.confirmar} />
          <Button title="Siguiente" iconRight="arrow-forward" onPress={next} loading={loading} style={{ marginTop: 8 }} />
          <View style={styles.footer}>
            <Text style={styles.footerText}>¿Ya tenés cuenta? </Text>
            <Pressable onPress={() => navigation.replace('Login')}>
              <Text style={styles.footerLink}>Iniciá sesión</Text>
            </Pressable>
          </View>
        </>
      )}

      {step === 1 && (
        <>
          <Text style={styles.title}>Contanos sobre vos</Text>
          <Input label="Nombre" placeholder="Nombre" value={form.nombre} onChangeText={set('nombre')} error={errors.nombre} maxLength={20} />
          <Input label="Apellido" placeholder="Apellido" value={form.apellido} onChangeText={set('apellido')} error={errors.apellido} maxLength={20} />

          <Text style={styles.label}>Fecha de nacimiento</Text>
          <View style={styles.dateRow}>
            <Input placeholder="DD" keyboardType="number-pad" maxLength={2} value={form.dia} onChangeText={(v) => set('dia')(v.replace(/\D/g, ''))} style={{ flex: 1 }} inputStyle={{ textAlign: 'center' }} />
            <Input placeholder="MM" keyboardType="number-pad" maxLength={2} value={form.mes} onChangeText={(v) => set('mes')(v.replace(/\D/g, ''))} style={{ flex: 1 }} inputStyle={{ textAlign: 'center' }} />
            <Input placeholder="AAAA" keyboardType="number-pad" maxLength={4} value={form.anio} onChangeText={(v) => set('anio')(v.replace(/\D/g, ''))} style={{ flex: 1.5 }} inputStyle={{ textAlign: 'center' }} />
            <Pressable style={styles.calendarBtn} onPress={() => setPickerOpen(true)}>
              <Ionicons name="calendar" size={22} color={colors.white} />
            </Pressable>
          </View>
          {errors.fecha ? (
            <Text style={styles.error}>{errors.fecha}</Text>
          ) : birth?.error ? (
            <Text style={styles.error}>{birth.error}</Text>
          ) : birth?.age != null ? (
            <Text style={styles.ok}>✓ Fecha válida · {birth.age} años</Text>
          ) : (
            <Text style={styles.hint}>Escribila o tocá el calendario para elegirla</Text>
          )}

          <DatePickerModal
            visible={pickerOpen}
            value={form.anio ? { day: Number(form.dia) || 1, month: Number(form.mes) || 1, year: Number(form.anio) } : null}
            onClose={() => setPickerOpen(false)}
            onConfirm={({ day, month, year }) => {
              setForm((f) => ({ ...f, dia: pad(day), mes: pad(month), anio: String(year) }));
              setErrors((e) => ({ ...e, fecha: undefined }));
              setPickerOpen(false);
            }}
          />
          <NavButtons onBack={back} onNext={next} loading={loading} />
        </>
      )}

      {step === 2 && (
        <>
          <Text style={styles.title}>Personalizá tu perfil</Text>
          <View style={styles.previewCard}>
            <Image source={{ uri: assetUrl(form.banner) }} style={styles.previewBanner} />
            <Avatar src={form.icono} name={form.usuario} size={86} border style={{ marginTop: -43 }} />
            <Text style={styles.previewName}>@{form.usuario || 'usuario'}</Text>
          </View>

          <Text style={styles.label}>Elegí tu foto de perfil</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingVertical: 4 }}>
            {icons.map((path) => (
              <Pressable key={path} onPress={() => set('icono')(path)}>
                <Avatar src={path} size={56} style={form.icono === path ? styles.selectedIcon : styles.icon} />
              </Pressable>
            ))}
          </ScrollView>

          <Text style={[styles.label, { marginTop: 16 }]}>Elegí tu banner</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingVertical: 4 }}>
            {banners.map((path) => (
              <Pressable key={path} onPress={() => set('banner')(path)}>
                <Image source={{ uri: assetUrl(path) }} style={[styles.banner, form.banner === path && styles.bannerSelected]} />
              </Pressable>
            ))}
          </ScrollView>

          <Input label="Descripción (opcional)" placeholder="Contá qué te gusta leer…" multiline maxLength={300} value={form.descripcion} onChangeText={set('descripcion')} style={{ marginTop: 16 }} hint={`${form.descripcion.length}/300`} />
          <NavButtons onBack={back} onNext={next} />
        </>
      )}

      {step === 3 && (
        <>
          <Text style={styles.title}>¿Qué géneros te gustan?</Text>
          <Text style={styles.subtitle}>Elegí hasta 5. Los usamos para recomendarte libros.</Text>
          <GenrePicker value={form.generos} onChange={set('generos')} max={5} />
          {errors.generos ? <Text style={[styles.error, { marginTop: 10 }]}>{errors.generos}</Text> : null}
          <NavButtons onBack={back} onNext={next} />
        </>
      )}

      {step === 4 && (
        <>
          <Text style={styles.title}>¿Y tus autores favoritos?</Text>
          <Text style={styles.subtitle}>Elegí hasta 3 (opcional). Podés cambiarlos después.</Text>
          <AuthorPicker authors={authors} value={form.autores} onChange={set('autores')} max={3} />
          {serverError ? <Text style={styles.serverError}>{serverError}</Text> : null}
          <NavButtons onBack={back} onNext={finish} nextLabel={form.autores.length ? 'Finalizar' : 'Omitir y finalizar'} loading={loading} />
        </>
      )}
    </AuthLayout>
  );
}

function Stepper({ step, maxStep, onJump }) {
  return (
    <View style={styles.stepper}>
      {STEPS.map((label, i) => {
        const reachable = i <= maxStep;
        return (
          <Pressable key={label} style={styles.stepItem} onPress={() => onJump(i)} disabled={!reachable} hitSlop={6}>
            <View style={[styles.dot, reachable && styles.dotReached, i === step && styles.dotActive]}>
              {i < step || (reachable && i !== step && i < maxStep) ? (
                <Ionicons name="checkmark" size={14} color={colors.white} />
              ) : (
                <Text style={styles.dotText}>{i + 1}</Text>
              )}
            </View>
            <Text style={[styles.stepLabel, i === step && { color: colors.white }]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function NavButtons({ onBack, onNext, nextLabel = 'Siguiente', loading }) {
  return (
    <View style={styles.navRow}>
      <Button title="Atrás" variant="outline" icon="arrow-back" onPress={onBack} style={{ flex: 1 }} />
      <Button title={nextLabel} iconRight="arrow-forward" onPress={onNext} loading={loading} style={{ flex: 1.4 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  stepper: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18, marginTop: 4 },
  stepItem: { alignItems: 'center', flex: 1 },
  dot: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.panelLight, alignItems: 'center', justifyContent: 'center' },
  dotReached: { backgroundColor: '#2F5670' },
  dotActive: { backgroundColor: colors.primaryLight, transform: [{ scale: 1.12 }] },
  dotText: { color: colors.white, fontWeight: '800', fontSize: 13 },
  stepLabel: { color: colors.whiteMuted, fontSize: 11, marginTop: 4, fontWeight: '700' },
  kicker: { color: colors.whiteMuted, textAlign: 'center', fontWeight: '800', letterSpacing: 2, fontSize: 12, marginTop: 6 },
  title: { color: colors.white, fontSize: 24, fontWeight: '900', textAlign: 'center', marginBottom: 20, marginTop: 6 },
  subtitle: { color: colors.whiteMuted, textAlign: 'center', marginTop: -12, marginBottom: 14 },
  label: { color: colors.white, fontSize: 13, fontWeight: '700', marginBottom: 6, marginLeft: 4 },
  dateRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  calendarBtn: { width: 50, height: 48, borderRadius: radius.sm, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  error: { color: '#FF8A9A', fontSize: 12, marginTop: -6, marginLeft: 4, fontWeight: '600' },
  ok: { color: '#7BE0AE', fontSize: 12, marginTop: -6, marginLeft: 4, fontWeight: '700' },
  hint: { color: colors.whiteMuted, fontSize: 12, marginTop: -6, marginLeft: 4 },
  previewCard: { alignItems: 'center', marginBottom: 16, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: radius.md, paddingBottom: 12, overflow: 'hidden' },
  previewBanner: { width: '100%', height: 100 },
  previewName: { color: colors.white, fontWeight: '800', marginTop: 6 },
  icon: { borderWidth: 3, borderColor: 'transparent' },
  selectedIcon: { borderWidth: 3, borderColor: colors.sky },
  banner: { width: 140, height: 62, borderRadius: 10, borderWidth: 3, borderColor: 'transparent' },
  bannerSelected: { borderColor: colors.sky },
  navRow: { flexDirection: 'row', gap: 12, marginTop: 22 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  footerText: { color: colors.whiteMuted },
  footerLink: { color: colors.sky, fontWeight: '800' },
  serverError: { color: colors.white, backgroundColor: 'rgba(224,70,90,0.85)', padding: 10, borderRadius: 8, marginTop: 16, textAlign: 'center', fontWeight: '600' },
});
