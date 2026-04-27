import { useUser } from '@clerk/expo';
import { useMutation } from 'convex/react';
import { useEffect } from 'react';

import { api } from '../../convex/_generated/api';

export function ConvexUserSync() {
  const { user, isLoaded } = useUser();
  const upsert = useMutation(api.users.upsertFromClerk);

  useEffect(() => {
    if (!isLoaded || !user) return;
    upsert({
      email: user.primaryEmailAddress?.emailAddress,
      name: user.fullName ?? undefined,
      image: user.imageUrl,
    }).catch((err) => console.warn('[convex] user upsert failed', err));
  }, [isLoaded, user?.id, upsert]);

  return null;
}
