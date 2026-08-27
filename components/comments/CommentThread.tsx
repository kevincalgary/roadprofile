import React, { useEffect, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Avatar } from '../ui/Avatar';
import { TextField } from '../ui/TextField';
import { Button } from '../ui/Button';
import { OverflowMenu } from '../ui/OverflowMenu';
import { ReportDialog } from '../ui/ReportDialog';
import { relativeTime } from '../../lib/format';
import { useAuth } from '../../lib/auth-context';
import { getComments, getReplies, postComment, postReply, deleteComment, deleteReply } from '../../lib/api/comments';
import { getProfilesMap } from '../../lib/api/profiles';
import { blockUser } from '../../lib/api/social';
import type { Comment, Reply, Profile } from '../../lib/types/database';

export function CommentThread({ recordId }: { recordId: string }) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [profiles, setProfiles] = useState<Map<string, Profile>>(new Map());
  const [repliesByComment, setRepliesByComment] = useState<Map<string, Reply[]>>(new Map());
  const [newComment, setNewComment] = useState('');
  const [posting, setPosting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [reportTarget, setReportTarget] = useState<{ type: 'comment' | 'reply'; id: string } | null>(null);

  async function load() {
    const list = await getComments(recordId);
    setComments(list);
    const map = await getProfilesMap(list.map((c) => c.author_id));
    setProfiles(map);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordId]);

  async function loadReplies(commentId: string) {
    const list = await getReplies(commentId);
    setRepliesByComment((prev) => new Map(prev).set(commentId, list));
    const extra = await getProfilesMap(list.map((r) => r.author_id));
    setProfiles((prev) => new Map([...prev, ...extra]));
  }

  async function handlePostComment() {
    if (!newComment.trim()) return;
    setPosting(true);
    try {
      await postComment(recordId, newComment.trim());
      setNewComment('');
      await load();
    } finally {
      setPosting(false);
    }
  }

  async function handlePostReply(commentId: string) {
    if (!replyText.trim()) return;
    await postReply(commentId, replyText.trim());
    setReplyText('');
    setReplyingTo(null);
    await loadReplies(commentId);
  }

  return (
    <View className="mt-2">
      <Text className="text-base font-bold text-charcoal dark:text-dark-text mb-3">Comments</Text>

      {comments.map((comment) => (
        <View key={comment.id} className="mb-4">
          <CommentRow
            author={profiles.get(comment.author_id)}
            body={comment.body}
            createdAt={comment.created_at}
            canModerate={user?.id === comment.author_id}
            onDelete={() => deleteComment(comment.id).then(load)}
            onReport={() => setReportTarget({ type: 'comment', id: comment.id })}
            onBlock={() => comment.author_id !== user?.id && blockUser(comment.author_id)}
            onReply={() => {
              setReplyingTo(comment.id);
              setReplyText('');
              if (!repliesByComment.has(comment.id)) loadReplies(comment.id);
            }}
          />
          {(repliesByComment.get(comment.id) ?? []).map((reply) => (
            <View key={reply.id} className="ml-11 mt-2">
              <CommentRow
                author={profiles.get(reply.author_id)}
                body={reply.body}
                createdAt={reply.created_at}
                canModerate={user?.id === reply.author_id}
                onDelete={() => deleteReply(reply.id).then(() => loadReplies(comment.id))}
                onReport={() => setReportTarget({ type: 'reply', id: reply.id })}
                onBlock={() => reply.author_id !== user?.id && blockUser(reply.author_id)}
              />
            </View>
          ))}
          {replyingTo === comment.id ? (
            <View className="ml-11 mt-2 flex-row gap-2">
              <View className="flex-1">
                <TextField placeholder="Write a reply…" value={replyText} onChangeText={setReplyText} />
              </View>
              <Button label="Send" size="sm" onPress={() => handlePostReply(comment.id)} disabled={!replyText.trim()} />
            </View>
          ) : null}
        </View>
      ))}

      {user ? (
        <View className="flex-row gap-2 items-end mt-2">
          <View className="flex-1">
            <TextField placeholder="Add a comment… use @username to mention" value={newComment} onChangeText={setNewComment} />
          </View>
          <Button label="Post" onPress={handlePostComment} loading={posting} disabled={!newComment.trim()} />
        </View>
      ) : null}

      {reportTarget ? (
        <ReportDialog visible targetType={reportTarget.type} targetId={reportTarget.id} onClose={() => setReportTarget(null)} />
      ) : null}
    </View>
  );
}

function CommentRow({
  author,
  body,
  createdAt,
  canModerate,
  onDelete,
  onReport,
  onBlock,
  onReply,
}: {
  author?: Profile;
  body: string;
  createdAt: string;
  canModerate: boolean;
  onDelete: () => void;
  onReport: () => void;
  onBlock: () => void;
  onReply?: () => void;
}) {
  const router = useRouter();
  return (
    <View className="flex-row gap-3">
      <Pressable onPress={() => author && router.push(`/u/${author.username}`)}>
        <Avatar url={author?.avatar_url} name={author?.display_name ?? 'User'} size={32} />
      </Pressable>
      <View className="flex-1">
        <View className="flex-row items-center justify-between">
          <Text className="font-semibold text-sm text-charcoal dark:text-dark-text">{author?.display_name ?? 'RoadProfile user'}</Text>
          <Text className="text-xs text-asphalt dark:text-dark-textSecondary">{relativeTime(createdAt)}</Text>
        </View>
        <Text className="text-sm text-charcoal dark:text-dark-text mt-0.5">{body}</Text>
        <View className="flex-row gap-4 mt-1.5">
          {onReply ? (
            <Pressable onPress={onReply} className="min-h-[32px] justify-center">
              <Text className="text-xs text-asphalt dark:text-dark-textSecondary font-medium">Reply</Text>
            </Pressable>
          ) : null}
          <OverflowMenu
            accessibilityLabel="Comment options"
            items={[
              ...(canModerate ? [{ label: 'Delete', icon: 'trash-2' as const, onPress: onDelete, destructive: true }] : []),
              { label: 'Report', icon: 'flag', onPress: onReport, destructive: true },
              ...(!canModerate ? [{ label: 'Block user', icon: 'slash' as const, onPress: onBlock, destructive: true }] : []),
            ]}
          />
        </View>
      </View>
    </View>
  );
}
