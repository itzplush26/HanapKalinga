import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { Send, AlertCircle } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { rounded } from '../theme/rounded';
import { typography } from '../theme/typography';
import { supabase } from '../lib/supabase';
import type { Message } from '@hanapkalinga/shared/types';

interface MessageThreadProps {
  bookingId: string;
  currentUserId: string;
  initialMessages?: Message[];
  readOnly?: boolean;
}

export function MessageThread({
  bookingId,
  currentUserId,
  initialMessages = [],
  readOnly = false,
}: MessageThreadProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    if (!bookingId) return;

    const channel = supabase
      .channel(`messages:${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `booking_id=eq.${bookingId}`,
        },
        (payload) => {
          const next = payload.new as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === next.id)) return prev;
            return [...prev, next];
          });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [bookingId]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const handleSend = async () => {
    const content = draft.trim();
    if (!content || readOnly) return;

    const optimisticId = `temp-${Date.now()}`;
    const optimisticMessage: Message = {
      id: optimisticId,
      booking_id: bookingId,
      sender_id: currentUserId,
      content,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setDraft('');
    setSending(true);

    const { error: insertError } = await supabase.from('messages').insert({
      booking_id: bookingId,
      sender_id: currentUserId,
      content,
    } as any);

    setSending(false);

    if (insertError) {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      setDraft(content);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMine = item.sender_id === currentUserId;
    return (
      <View style={[styles.messageRow, isMine && styles.messageRowMine]}>
        <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleOther]}>
          <Text style={[styles.messageText, isMine && styles.messageTextMine]}>
            {item.content}
          </Text>
          <Text style={[styles.timestamp, isMine && styles.timestampMine]}>
            {new Date(item.created_at).toLocaleTimeString('en-PH', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: false })
        }
      />
      {readOnly ? (
        <View style={styles.readOnlyBar}>
          <Text style={styles.readOnlyText}>Admin view — read only</Text>
        </View>
      ) : (
        <View style={styles.inputBar}>
          <TextInput
            style={styles.textInput}
            placeholder="Type a message"
            placeholderTextColor={colors.muted}
            value={draft}
            onChangeText={setDraft}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!draft.trim() || sending}
            style={[styles.sendButton, !draft.trim() && styles.sendButtonDisabled]}
            accessibilityRole="button"
            accessibilityLabel="Send message"
          >
            <Send size={20} color={draft.trim() ? colors.canvas : colors.muted} />
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 300,
  },
  messageList: {
    padding: spacing.md,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  messageRowMine: {
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: '80%',
    padding: spacing.sm,
    borderRadius: rounded.md,
  },
  bubbleMine: {
    backgroundColor: colors.brand[600],
    borderBottomRightRadius: rounded.xs,
  },
  bubbleOther: {
    backgroundColor: colors.surface.strong,
    borderBottomLeftRadius: rounded.xs,
  },
  messageText: {
    fontSize: typography.size.body,
    fontFamily: typography.fontFamily.body,
    color: colors.ink,
  },
  messageTextMine: {
    color: colors.canvas,
  },
  timestamp: {
    fontSize: typography.size.legal,
    fontFamily: typography.fontFamily.body,
    color: colors.muted,
    marginTop: 2,
    alignSelf: 'flex-end',
  },
  timestampMine: {
    color: 'rgba(255,255,255,0.7)',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
    backgroundColor: colors.canvas,
    gap: spacing.sm,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: rounded.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.size.body,
    fontFamily: typography.fontFamily.body,
    color: colors.ink,
    maxHeight: 80,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: rounded.full,
    backgroundColor: colors.brand[600],
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.surface.strong,
  },
  readOnlyBar: {
    padding: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
    alignItems: 'center',
  },
  readOnlyText: {
    fontSize: typography.size.caption,
    fontFamily: typography.fontFamily.body,
    color: colors.muted,
  },
});
