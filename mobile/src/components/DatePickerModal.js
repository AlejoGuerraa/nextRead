import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Button from './Button';
import { colors, radius } from '../theme';

export const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const ITEM = 44;

const daysInMonth = (month, year) => new Date(year, month, 0).getDate();

/** Selector de fecha en 3 columnas (día / mes / año) sin librerías extra */
export default function DatePickerModal({ visible, value, onClose, onConfirm, title = 'Fecha de nacimiento' }) {
  const thisYear = new Date().getFullYear();
  const years = useMemo(() => Array.from({ length: 121 }, (_, i) => thisYear - i), [thisYear]);

  const [day, setDay] = useState(value?.day || 1);
  const [month, setMonth] = useState(value?.month || 1);
  const [year, setYear] = useState(value?.year || thisYear - 18);

  useEffect(() => {
    if (!visible) return;
    setDay(value?.day || 1);
    setMonth(value?.month || 1);
    setYear(value?.year || thisYear - 18);
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  const maxDay = daysInMonth(month, year);
  useEffect(() => {
    if (day > maxDay) setDay(maxDay);
  }, [maxDay, day]);

  const days = useMemo(() => Array.from({ length: maxDay }, (_, i) => i + 1), [maxDay]);
  const months = useMemo(() => MESES.map((m, i) => i + 1), []);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.bg} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.columns}>
            <Column label="Día" data={days} selected={day} onSelect={setDay} render={(d) => String(d)} visible={visible} />
            <Column label="Mes" data={months} selected={month} onSelect={setMonth} render={(m) => MESES[m - 1]} visible={visible} flex={1.6} />
            <Column label="Año" data={years} selected={year} onSelect={setYear} render={(y) => String(y)} visible={visible} flex={1.2} />
          </View>
          <Text style={styles.preview}>
            {day} de {MESES[month - 1]} de {year}
          </Text>
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 14 }}>
            <Button title="Cancelar" variant="outline" onPress={onClose} style={{ flex: 1 }} />
            <Button title="Listo" icon="checkmark" onPress={() => onConfirm({ day, month, year })} style={{ flex: 1 }} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Column({ label, data, selected, onSelect, render, visible, flex = 1 }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!visible) return;
    const index = data.indexOf(selected);
    if (index >= 0) {
      setTimeout(() => ref.current?.scrollToIndex({ index, animated: false, viewPosition: 0.5 }), 50);
    }
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <View style={{ flex }}>
      <Text style={styles.colLabel}>{label}</Text>
      <FlatList
        ref={ref}
        data={data}
        keyExtractor={(item) => String(item)}
        style={styles.list}
        showsVerticalScrollIndicator={false}
        getItemLayout={(_, index) => ({ length: ITEM, offset: ITEM * index, index })}
        onScrollToIndexFailed={() => {}}
        renderItem={({ item }) => {
          const active = item === selected;
          return (
            <Pressable onPress={() => onSelect(item)} style={[styles.item, active && styles.itemActive]}>
              <Text style={[styles.itemText, active && styles.itemTextActive]}>{render(item)}</Text>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.panel, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: 20, paddingBottom: 34 },
  title: { color: colors.white, fontSize: 18, fontWeight: '900', textAlign: 'center', marginBottom: 12 },
  columns: { flexDirection: 'row', gap: 8 },
  colLabel: { color: colors.whiteMuted, fontWeight: '800', textAlign: 'center', marginBottom: 6, fontSize: 12 },
  list: { height: ITEM * 5, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: radius.md },
  item: { height: ITEM, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm, marginHorizontal: 4 },
  itemActive: { backgroundColor: colors.primary },
  itemText: { color: colors.whiteMuted, fontSize: 15, fontWeight: '600' },
  itemTextActive: { color: colors.white, fontWeight: '900' },
  preview: { color: colors.white, textAlign: 'center', marginTop: 14, fontWeight: '700' },
});
