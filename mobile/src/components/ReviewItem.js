import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Avatar from './Avatar';
import Stars from './Stars';
import { timeAgo } from '../utils/helpers';
import { colors, radius } from '../theme';
import { useKeyboardScroll } from './KeyboardAwareScroll';

/** Una reseña con likes, respuestas y (si es propia) botón eliminar */
export default function ReviewItem({ review, isOwn, canInteract, onLike, onReply, onDelete, onPressUser }) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const { reveal } = useKeyboardScroll();
  const author = review.Usuario || {};
  const replies = review.Respuestas || [];

  const sendReply = async () => {
    if (!text.trim()) return;
    setSending(true);
    const ok = await onReply(review, text.trim());
    setSending(false);
    if (ok) {
      setText('');
      setReplyOpen(false);
      setShowReplies(true);
    }
  };

  return (
    <View style={[styles.card, isOwn && styles.own]}>
      <View style={styles.head}>
        <Pressable onPress={() => onPressUser?.(author)} style={styles.user}>
          <Avatar src={author.iconoData?.simbolo} name={author.usuario} size={38} />
          <View style={{ marginLeft: 10, flex: 1 }}>
            <Text style={styles.username}>
              {author.usuario || 'Usuario'} {isOwn && <Text style={styles.youTag}> · Vos</Text>}
            </Text>
            <Text style={styles.date}>{timeAgo(review.fecha)}</Text>
          </View>
        </Pressable>
        {review.puntuacion != null && Number(review.puntuacion) > 0 && <Stars value={Number(review.puntuacion)} size={13} />}
      </View>

      {review.comentario ? <Text style={styles.comment}>{review.comentario}</Text> : null}

      <View style={styles.actions}>
        <Pressable style={styles.action} onPress={() => onLike(review)}>
          <Ionicons
            name={review.likedByCurrentUser ? 'heart' : 'heart-outline'}
            size={18}
            color={review.likedByCurrentUser ? colors.rose : colors.textMuted}
          />
          <Text style={styles.actionText}>{review.likes || 0}</Text>
        </Pressable>
        <Pressable style={styles.action} onPress={() => setReplyOpen((o) => !o)}>
          <Ionicons name="chatbubble-outline" size={17} color={colors.textMuted} />
          <Text style={styles.actionText}>Responder</Text>
        </Pressable>
        {replies.length > 0 && (
          <Pressable style={styles.action} onPress={() => setShowReplies((s) => !s)}>
            <Text style={[styles.actionText, { color: colors.primary }]}>
              {showReplies ? 'Ocultar' : `Ver ${replies.length} ${replies.length === 1 ? 'respuesta' : 'respuestas'}`}
            </Text>
          </Pressable>
        )}
        {isOwn && (
          <Pressable style={[styles.action, { marginLeft: 'auto' }]} onPress={() => onDelete(review)}>
            <Ionicons name="trash-outline" size={17} color={colors.danger} />
          </Pressable>
        )}
      </View>

      {showReplies &&
        replies.map((r) => (
          <View key={r.id} style={styles.reply}>
            <Avatar src={r.Usuario?.iconoData?.simbolo} name={r.Usuario?.usuario} size={26} />
            <View style={{ marginLeft: 8, flex: 1 }}>
              <Text style={styles.replyUser}>
                {r.Usuario?.usuario || 'Usuario'} <Text style={styles.date}>· {timeAgo(r.fecha)}</Text>
              </Text>
              <Text style={styles.replyText}>{r.comentario}</Text>
            </View>
          </View>
        ))}

      {replyOpen && (
        <View style={styles.replyBox}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Escribí una respuesta…"
            placeholderTextColor="#90A0B0"
            style={styles.replyInput}
            onFocus={reveal}
            maxLength={2000}
            multiline
            autoFocus
          />
          <Pressable onPress={sendReply} disabled={sending} style={styles.sendBtn}>
            {sending ? <ActivityIndicator color={colors.white} size="small" /> : <Ionicons name="send" size={16} color={colors.white} />}
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radius.md, padding: 14, marginBottom: 10 },
  own: { borderWidth: 1.5, borderColor: colors.primary },
  head: { flexDirection: 'row', alignItems: 'center' },
  user: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  username: { fontWeight: '800', color: colors.text },
  youTag: { color: colors.primary, fontWeight: '700' },
  date: { fontSize: 12, color: colors.textMuted, fontWeight: '400' },
  comment: { marginTop: 10, color: colors.text, lineHeight: 21 },
  actions: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 16 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionText: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  reply: { flexDirection: 'row', marginTop: 10, marginLeft: 14, paddingLeft: 10, borderLeftWidth: 2, borderLeftColor: colors.border },
  replyUser: { fontWeight: '700', color: colors.text, fontSize: 13 },
  replyText: { color: colors.text, fontSize: 13, marginTop: 2 },
  replyBox: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 10, gap: 8 },
  replyInput: {
    flex: 1,
    backgroundColor: colors.cardAlt,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: colors.text,
    maxHeight: 100,
  },
  sendBtn: { backgroundColor: colors.primary, width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
});
