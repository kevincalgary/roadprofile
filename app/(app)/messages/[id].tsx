import React, { useEffect, useRef, useState } from 'react';
import { View, Text, FlatList, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { CircularIconButton } from '../../../components/ui/CircularIconButton';
import { Avatar } from '../../../components/ui/Avatar';
import { TextField } from '../../../components/ui/TextField';
import { OverflowMenu } from '../../../components/ui/OverflowMenu';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { MessageBubble } from '../../../components/messages/MessageBubble';
import { useAuth } from '../../../lib/auth-context';
import { supabase } from '../../../lib/supabase';
import { getProfilesMap } from '../../../lib/api/profiles';
import {
  getMessages,
  sendMessage,
  markConversationRead,
  muteConversation,
  deleteConversationForMe,
  subscribeToConversationMessages,
} from '../../../lib/api/messages';
import { blockUser, submitReport } from '../../../lib/api/social';
import type { Message, ConversationMember, Profile } from '../../../lib/types/database';

export default function ChatThread() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [otherProfile, setOtherProfile] = useState<Profile | undefined>();
  const [otherMember, setOtherMember] = useState<ConversationMember | null>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [blockConfirmOpen, setBlockConfirmOpen] = useState(false);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;
    (async () => {
      const [msgs, { data: members }] = await Promise.all([
        getMessages(id),
        supabase.from('conversation_members').select('*').eq('conversation_id', id),
      ]);
      if (cancelled) return;
      setMessages(msgs);
      const other = (members ?? []).find((m: any) => m.user_id !== user?.id) ?? null;
      setOtherMember(other);
      if (other) {
        const profiles = await getProfilesMap([other.user_id]);
        if (cancelled) return;
        setOtherProfile(profiles.get(other.user_id));
      }
      await markConversationRead(id);
      if (cancelled) return;
      unsubscribe = subscribeToConversationMessages(id, (msg) => {
        setMessages((prev) => [...prev, msg]);
        markConversationRead(id);
      });
      // The effect's cleanup may already have run (and found `unsubscribe`
      // still undefined) if the user navigated away before this point —
      // guard against that by tearing the just-created subscription back
      // down immediately instead of leaking it.
      if (cancelled) unsubscribe();
    })();
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [id, user?.id]);

  async function handleSend() {
    if (!draft.trim()) return;
    setSending(true);
    const body = draft.trim();
    setDraft('');
    try {
      await sendMessage(id, body);
    } finally {
      setSending(false);
    }
  }

  async function handleBlock() {
    if (!otherMember) return;
    await blockUser(otherMember.user_id);
    setBlockConfirmOpen(false);
    router.replace('/messages');
  }

  return (
    <KeyboardAvoidingView className="flex-1 bg-warmwhite dark:bg-dark-bg" behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={insets.top}>
      <View className="flex-row items-center justify-between px-4" style={{ paddingTop: insets.top + 8, paddingBottom: 8 }}>
        <View className="flex-row items-center gap-3">
          <CircularIconButton icon="arrow-left" accessibilityLabel="Back" onPress={() => router.back()} />
          <Pressable onPress={() => otherProfile && router.push(`/u/${otherProfile.username}`)} className="flex-row items-center gap-2">
            <Avatar url={otherProfile?.avatar_url} name={otherProfile?.display_name ?? '?'} size={32} />
            <Text className="font-bold text-charcoal dark:text-dark-text">{otherProfile?.display_name ?? 'RoadProfile user'}</Text>
          </Pressable>
        </View>
        <OverflowMenu
          accessibilityLabel="Conversation options"
          items={[
            { label: 'Mute conversation', icon: 'bell-off', onPress: () => muteConversation(id, true) },
            { label: 'Delete conversation', icon: 'trash-2', onPress: () => deleteConversationForMe(id).then(() => router.replace('/messages')), destructive: true },
            { label: 'Block user', icon: 'slash', onPress: () => setBlockConfirmOpen(true), destructive: true },
            {
              label: 'Report user',
              icon: 'flag',
              onPress: () => otherMember && submitReport({ targetType: 'user', targetId: otherMember.user_id, reason: 'other' }),
              destructive: true,
            },
          ]}
        />
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        renderItem={({ item }) => (
          <MessageBubble
            message={item}
            isMine={item.sender_id === user?.id}
            read={!!otherMember?.last_read_at && new Date(otherMember.last_read_at) > new Date(item.created_at)}
          />
        )}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
      />

      <View className="flex-row items-end gap-2 px-4 pb-4" style={{ paddingBottom: insets.bottom + 12 }}>
        <View className="flex-1">
          <TextField placeholder="Message" value={draft} onChangeText={setDraft} multiline accessibilityLabel="Message input" />
        </View>
        <Pressable
          onPress={handleSend}
          disabled={!draft.trim() || sending}
          accessibilityRole="button"
          accessibilityLabel="Send message"
          className={['w-12 h-12 rounded-full items-center justify-center', draft.trim() ? 'bg-mint' : 'bg-cardgray dark:bg-dark-card'].join(' ')}
        >
          <Feather name="send" size={18} color={draft.trim() ? '#0F2518' : '#8A919B'} />
        </Pressable>
      </View>

      <ConfirmDialog
        visible={blockConfirmOpen}
        title="Block this user?"
        description="They won't be able to message, follow, or mention you anymore."
        confirmLabel="Block"
        destructive
        onConfirm={handleBlock}
        onCancel={() => setBlockConfirmOpen(false)}
      />
    </KeyboardAvoidingView>
  );
}
