import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Avatar from './Avatar';
import { colors, radius } from '../theme';

/** Banner + avatar + nombre + stats. Se usa en el perfil propio y en el público. */
export default function ProfileHeader({ name, username, bannerUri, avatarSrc, description, stats = [], children, tags = [] }) {
  const [bannerFailed, setBannerFailed] = useState(false);
  return (
    <View>
      <View style={styles.bannerWrap}>
        {bannerUri && !bannerFailed ? (
          <Image source={{ uri: bannerUri }} style={styles.banner} onError={() => setBannerFailed(true)} />
        ) : (
          <View style={[styles.banner, { backgroundColor: colors.panelLight }]} />
        )}
      </View>
      <View style={styles.body}>
        <Avatar src={avatarSrc} name={username} size={98} border style={styles.avatar} />
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.username}>@{username}</Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}

        {tags.length > 0 && (
          <View style={styles.tags}>
            {tags.map((t) => (
              <View key={t.label} style={styles.tag}>
                <Text style={styles.tagLabel}>{t.label}</Text>
                <Text style={styles.tagValue} numberOfLines={1}>
                  {t.value}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.stats}>
          {stats.map((s) => (
            <Pressable key={s.label} style={styles.stat} onPress={s.onPress} disabled={!s.onPress}>
              <Text style={styles.statValue}>{s.value ?? 0}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </Pressable>
          ))}
        </View>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bannerWrap: { height: 150, backgroundColor: colors.panel },
  banner: { width: '100%', height: '100%' },
  body: { alignItems: 'center', paddingHorizontal: 18, marginTop: -50 },
  avatar: { elevation: 4 },
  name: { fontSize: 22, fontWeight: '900', color: colors.text, marginTop: 8, textAlign: 'center' },
  username: { color: colors.primary, fontWeight: '700', marginTop: 2 },
  description: { color: colors.text, textAlign: 'center', marginTop: 10, lineHeight: 20 },
  tags: { flexDirection: 'row', gap: 8, marginTop: 14, flexWrap: 'wrap', justifyContent: 'center' },
  tag: { backgroundColor: colors.card, borderRadius: radius.sm, paddingVertical: 6, paddingHorizontal: 10, maxWidth: 160 },
  tagLabel: { fontSize: 10, color: colors.textMuted, fontWeight: '800', textTransform: 'uppercase' },
  tagValue: { fontSize: 13, color: colors.text, fontWeight: '700' },
  stats: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    marginTop: 16,
    paddingVertical: 12,
    alignSelf: 'stretch',
  },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 19, fontWeight: '900', color: colors.text },
  statLabel: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
});
