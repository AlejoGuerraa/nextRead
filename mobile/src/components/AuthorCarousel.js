import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Avatar from './Avatar';
import { colors } from '../theme';

export default function AuthorCarousel({ title, authors = [] }) {
  const navigation = useNavigation();
  if (!authors.length) return null;
  return (
    <View style={styles.section}>
      <Text style={styles.title}>{title}</Text>
      <FlatList
        horizontal
        data={authors}
        keyExtractor={(a) => String(a.id)}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 16 }}
        renderItem={({ item }) => (
          <Pressable style={styles.item} onPress={() => navigation.push('Author', { id: item.id, name: item.nombre })}>
            <Avatar src={item.url_cara} name={item.nombre} size={76} />
            <Text style={styles.name} numberOfLines={2}>
              {item.nombre}
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 22 },
  title: { fontSize: 18, fontWeight: '800', color: colors.text, marginHorizontal: 16, marginBottom: 10 },
  item: { width: 84, alignItems: 'center' },
  name: { marginTop: 6, fontSize: 12, fontWeight: '700', color: colors.text, textAlign: 'center' },
});
