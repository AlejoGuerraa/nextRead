import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../theme';
import { useKeyboardScroll } from './KeyboardAwareScroll';

/** Campo de texto blanco (estilo pantallas de acceso). `dark` = etiqueta blanca */
export default function Input({
  label,
  error,
  hint,
  secure = false,
  icon,
  dark = true,
  multiline = false,
  style,
  inputStyle,
  ...props
}) {
  const [hidden, setHidden] = useState(secure);
  const { reveal } = useKeyboardScroll();
  const labelColor = dark ? colors.white : colors.text;

  return (
    <View style={[styles.wrap, style]}>
      {label && <Text style={[styles.label, { color: labelColor }]}>{label}</Text>}
      <View style={[styles.field, error && styles.fieldError, multiline && styles.multiline]}>
        {icon && <Ionicons name={icon} size={18} color={colors.textMuted} style={{ marginRight: 8 }} />}
        <TextInput
          placeholderTextColor="#90A0B0"
          secureTextEntry={hidden}
          autoCorrect={false}
          multiline={multiline}
          style={[styles.input, multiline && { textAlignVertical: 'top', minHeight: 90 }, inputStyle]}
          {...props}
          onFocus={(e) => {
            reveal();
            props.onFocus?.(e);
          }}
        />
        {secure && (
          <Pressable hitSlop={10} onPress={() => setHidden((h) => !h)}>
            <Ionicons name={hidden ? 'eye-outline' : 'eye-off-outline'} size={20} color={colors.textMuted} />
          </Pressable>
        )}
      </View>
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : hint ? (
        <Text style={[styles.hint, { color: dark ? colors.whiteMuted : colors.textMuted }]}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '700', marginBottom: 6, marginLeft: 4 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    minHeight: 48,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  multiline: { alignItems: 'flex-start', paddingVertical: 10 },
  fieldError: { borderColor: colors.danger },
  input: { flex: 1, fontSize: 15, color: colors.text, paddingVertical: 10 },
  error: { color: '#FF8A9A', fontSize: 12, marginTop: 4, marginLeft: 4, fontWeight: '600' },
  hint: { fontSize: 12, marginTop: 4, marginLeft: 4 },
});
