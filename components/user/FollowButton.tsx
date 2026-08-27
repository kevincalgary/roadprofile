import React, { useEffect, useState } from 'react';
import { Button } from '../ui/Button';
import { follow, unfollow, isFollowing } from '../../lib/api/social';
import { useAuth } from '../../lib/auth-context';
import type { FolloweeType } from '../../lib/types/database';

export function FollowButton({ followeeType, followeeId, size = 'md' }: { followeeType: FolloweeType; followeeId: string; size?: 'sm' | 'md' }) {
  const { user } = useAuth();
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    isFollowing(followeeType, followeeId)
      .then(setFollowing)
      .finally(() => setLoading(false));
  }, [followeeType, followeeId, user]);

  if (!user || loading) return null;

  async function handlePress() {
    setBusy(true);
    const next = !following;
    setFollowing(next);
    try {
      if (next) await follow(followeeType, followeeId);
      else await unfollow(followeeType, followeeId);
    } catch {
      setFollowing(!next);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      label={following ? 'Following' : 'Follow'}
      variant={following ? 'outline' : 'primary'}
      size={size}
      onPress={handlePress}
      loading={busy}
      accessibilityLabel={following ? 'Unfollow' : 'Follow'}
    />
  );
}
